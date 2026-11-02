import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const root = path.resolve(import.meta.dirname, '../..')
const appScopeMedia = path.join(root, 'AppScope/resources/base/media')
const entryMedia = path.join(root, 'entry/src/main/resources/base/media')
const iconDir = path.join(root, 'assets/app-icon')
const defaultHarmonyBackgroundShaPrefix = '497edeafc51af043'
const plusForegroundShaPrefix = 'b55209a41a686519'

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

function readPngRgba(file) {
  const buf = readFileSync(file)
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file} 不是 PNG`)
  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idat = []
  while (offset + 12 <= buf.length) {
    const length = buf.readUInt32BE(offset)
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii')
    const data = buf.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }
  assert.equal(bitDepth, 8, `${file} 需要 8bit PNG`)
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0
  assert.ok(channels >= 3, `${file} 需要 RGB/RGBA PNG，colorType=${colorType}`)
  const stride = width * channels
  const raw = inflateSync(Buffer.concat(idat))
  const pixels = Buffer.alloc(height * width * 4)
  let src = 0
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[src]
    src += 1
    const row = raw.subarray(src, src + stride)
    src += stride
    const reconRow = Buffer.alloc(stride)
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? reconRow[i - channels] : 0
      const up = prev[i]
      const upLeft = i >= channels ? prev[i - channels] : 0
      let recon = row[i]
      if (filter === 1) recon = (recon + left) & 255
      else if (filter === 2) recon = (recon + up) & 255
      else if (filter === 3) recon = (recon + ((left + up) >> 1)) & 255
      else if (filter === 4) recon = (recon + paeth(left, up, upLeft)) & 255
      else assert.ok(filter === 0, `${file} 未知 PNG 滤波 ${filter}`)
      reconRow[i] = recon
    }
    prev = reconRow
    for (let x = 0; x < width; x++) {
      const dst = (y * width + x) * 4
      const srcPx = x * channels
      pixels[dst] = reconRow[srcPx]
      pixels[dst + 1] = reconRow[srcPx + 1]
      pixels[dst + 2] = reconRow[srcPx + 2]
      pixels[dst + 3] = channels === 4 ? reconRow[srcPx + 3] : 255
    }
  }
  return { width, height, pixels }
}

function pngSize(file) {
  const png = readPngRgba(file)
  return { width: png.width, height: png.height }
}

function isTransparent(pixels, idx) {
  return pixels[idx * 4 + 3] === 0
}

function floodTransparent(width, height, pixels, starts) {
  const seen = Buffer.alloc(width * height)
  const stack = starts.filter((idx) => idx >= 0 && idx < width * height && isTransparent(pixels, idx))
  for (const idx of stack) seen[idx] = 1
  while (stack.length) {
    const cur = stack.pop()
    const x = cur % width
    const y = (cur - x) / width
    const next = []
    if (x > 0) next.push(cur - 1)
    if (x + 1 < width) next.push(cur + 1)
    if (y > 0) next.push(cur - width)
    if (y + 1 < height) next.push(cur + width)
    for (const n of next) {
      if (seen[n] || !isTransparent(pixels, n)) continue
      seen[n] = 1
      stack.push(n)
    }
  }
  return seen
}

function largestInteriorTransparentHole(file) {
  const { width, height, pixels } = readPngRgba(file)
  const exteriorStarts = []
  for (let x = 0; x < width; x++) {
    exteriorStarts.push(x)
    exteriorStarts.push((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    exteriorStarts.push(y * width)
    exteriorStarts.push(y * width + width - 1)
  }
  const exterior = floodTransparent(width, height, pixels, exteriorStarts)
  const seen = Buffer.alloc(width * height)
  let best = null
  const stack = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (seen[idx] || exterior[idx] || !isTransparent(pixels, idx)) continue
      stack.length = 0
      stack.push(idx)
      seen[idx] = 1
      let count = 0
      let minX = x
      let maxX = x
      let minY = y
      let maxY = y
      while (stack.length) {
        const cur = stack.pop()
        const cx = cur % width
        const cy = (cur - cx) / width
        count += 1
        if (cx < minX) minX = cx
        if (cx > maxX) maxX = cx
        if (cy < minY) minY = cy
        if (cy > maxY) maxY = cy
        const next = []
        if (cx > 0) next.push(cur - 1)
        if (cx + 1 < width) next.push(cur + 1)
        if (cy > 0) next.push(cur - width)
        if (cy + 1 < height) next.push(cur + width)
        for (const n of next) {
          if (seen[n] || exterior[n] || !isTransparent(pixels, n)) continue
          seen[n] = 1
          stack.push(n)
        }
      }
      if (!best || count > best.count) {
        best = { count, minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 }
      }
    }
  }
  assert.ok(best, `${file} 纸面内部没有透明镂空`)
  return best
}

function readText(rel) {
  return readFileSync(path.join(root, rel), 'utf8')
}

test('桌面分层图标与商店品牌图使用同一套资源', () => {
  const paper = readFileSync(path.join(iconDir, 'paper.svg'), 'utf8')
  const appIconSvg = readFileSync(path.join(iconDir, 'app-icon.svg'), 'utf8')
  const foregroundSvg = readFileSync(path.join(iconDir, 'foreground.svg'), 'utf8')
  const backgroundSvg = readFileSync(path.join(iconDir, 'background.svg'), 'utf8')
  assert.doesNotMatch(paper, /<(?:image|line|polygon)\b/, '主体采用曲线路径，不含位图或旧三角贴片')
  assert.match(appIconSvg, /<use\s+href="paper\.svg#artwork"\s*\/>/)
  assert.match(foregroundSvg, /<use\s+href="paper\.svg#artwork"\s*\/>/)
  assert.match(appIconSvg, /href="background\.svg#background-artwork"/)
  assert.match(backgroundSvg, /radialGradient id="bgGrad"/)

  const appJson = readText('AppScope/app.json5')
  const moduleJson = readText('entry/src/main/module.json5')
  assert.match(appJson, /"icon":\s*"\$media:layered_image"/)
  assert.match(moduleJson, /"icon":\s*"\$media:layered_image"/)
  assert.match(moduleJson, /"startWindowIcon":\s*"\$media:app_icon"/)

  const names = ['background.png', 'foreground.png', 'app_icon.png', 'layered_image.json']
  for (const name of names) {
    const appFile = path.join(appScopeMedia, name)
    const entryFile = path.join(entryMedia, name)
    assert.equal(sha256(entryFile), sha256(appFile), `${name} 在 AppScope 与 entry 中必须一致`)
  }

  assert.deepEqual(pngSize(path.join(appScopeMedia, 'background.png')), { width: 1024, height: 1024 })
  assert.deepEqual(pngSize(path.join(appScopeMedia, 'foreground.png')), { width: 1024, height: 1024 })
  assert.deepEqual(pngSize(path.join(appScopeMedia, 'app_icon.png')), { width: 216, height: 216 })
  assert.notEqual(
    sha256(path.join(entryMedia, 'background.png')).slice(0, 16),
    defaultHarmonyBackgroundShaPrefix,
    'entry 分层背景不能再使用鸿蒙默认青绿底',
  )
  assert.notEqual(
    sha256(path.join(appScopeMedia, 'foreground.png')).slice(0, 16),
    plusForegroundShaPrefix,
    '分层前景中心不能再使用加号镂空',
  )

  const minus = largestInteriorTransparentHole(path.join(appScopeMedia, 'foreground.png'))
  assert.ok(minus.width > minus.height * 3, `中心镂空应是减号横条，实际 ${minus.width}x${minus.height}`)
  assert.ok(minus.height >= 40 && minus.height <= 70, `减号厚度异常: ${minus.height}`)
})

test('参考图轮廓：后折面、斜下缘、圆角与分层合成一致', () => {
  const fg = readPngRgba(path.join(appScopeMedia, 'foreground.png'))
  const bg = readPngRgba(path.join(appScopeMedia, 'background.png'))
  const preview = readPngRgba(path.join(iconDir, 'preview.png'))
  const pixel = (png, x, y) => [...png.pixels.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)]
  assert.deepEqual(pixel(fg, 260, 800), [48, 123, 89, 255], '左下露出深绿后折面')
  assert.deepEqual(pixel(fg, 740, 800), [104, 205, 160, 255], '浅绿主体延伸到右下')
  assert.equal(pixel(fg, 512, 800)[3], 0, '两片之间下方保持开口')
  assert.equal(pixel(fg, 512, 402)[3], 0, '减号镂空')
  assert.equal(pixel(fg, 512, 300)[3], 255, '减号上方没有加号竖臂')
  assert.equal(pixel(fg, 512, 500)[3], 255, '减号下方没有加号竖臂')
  assert.equal(pixel(preview, 0, 0)[3], 0, '合成图使用透明圆角')
  assert.equal(pixel(bg, 0, 0)[3], 255, '分层背景铺满，供系统裁切')
  // 比较画布中央区域，排除合成图外沿圆角裁切。
  for (let y = 160; y < 864; y += 7) {
    for (let x = 160; x < 864; x += 7) {
      const f = pixel(fg, x, y), b = pixel(bg, x, y), p = pixel(preview, x, y)
      for (let c = 0; c < 3; c++) {
        const expected = Math.round(f[c] * f[3] / 255 + b[c] * (1 - f[3] / 255))
        assert.ok(Math.abs(p[c] - expected) <= 2, `分层合成偏差 ${x},${y},${c}`)
      }
    }
  }
})

