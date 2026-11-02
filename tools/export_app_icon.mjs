#!/usr/bin/env node
import { mkdir, copyFile, readFile, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const iconDir = path.join(root, 'assets/app-icon')
const rsvg = process.env.RSVG_CONVERT || 'rsvg-convert'
const SHARED_LAYERS = ['paper', 'background']

function run(args, { input } = {}) {
  const result = spawnSync(rsvg, args, { encoding: 'buffer', input })
  if (result.status !== 0) {
    const detail = Buffer.concat([result.stderr || Buffer.alloc(0), result.stdout || Buffer.alloc(0)]).toString('utf8').trim()
      || result.error?.message
      || ''
    throw new Error(`${rsvg} ${args.join(' ')} 失败${detail ? `:\n${detail}` : ''}`)
  }
}

async function inlinePaper(svgName) {
  let svg = await readFile(path.join(iconDir, svgName), 'utf8')
  for (const layer of SHARED_LAYERS) {
    const reference = new RegExp(`<use\\s+href="${layer}\\.svg#[^"]+"\\s*/>`)
    if (!reference.test(svg)) continue
    const source = await readFile(path.join(iconDir, `${layer}.svg`), 'utf8')
    const inner = source.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '').trim()
    svg = svg.replace(reference, inner)
  }
  return svg
}

async function exportPng(svgName, size, out) {
  const svg = await inlinePaper(svgName)
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'app-icon-'))
  const tmpSvg = path.join(tmpDir, svgName)
  try {
    await writeFile(tmpSvg, svg)
    run([
      '--format', 'png',
      '--width', String(size),
      '--height', String(size),
      '--output', out,
      '--unlimited',
      tmpSvg,
    ])
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
}

const appScopeMedia = path.join(root, 'AppScope/resources/base/media')
const entryMedia = path.join(root, 'entry/src/main/resources/base/media')
const assetsDir = path.join(root, 'assets')
await mkdir(appScopeMedia, { recursive: true })
await mkdir(entryMedia, { recursive: true })
await mkdir(assetsDir, { recursive: true })

const background = path.join(appScopeMedia, 'background.png')
const foreground = path.join(appScopeMedia, 'foreground.png')
const appIcon = path.join(appScopeMedia, 'app_icon.png')

await exportPng('background.svg', 1024, background)
await exportPng('foreground.svg', 1024, foreground)
await exportPng('app-icon.svg', 216, appIcon)

await copyFile(background, path.join(entryMedia, 'background.png'))
await copyFile(foreground, path.join(entryMedia, 'foreground.png'))
await copyFile(appIcon, path.join(entryMedia, 'app_icon.png'))
await copyFile(appIcon, path.join(assetsDir, 'icon-216x216.png'))

await exportPng('app-icon.svg', 108, path.join(assetsDir, 'icon-108x108.png'))
await exportPng('app-icon.svg', 28, path.join(assetsDir, 'icon-28x28.png'))
await exportPng('app-icon.svg', 1024, path.join(iconDir, 'preview.png'))
await writeFile(path.join(iconDir, 'preview.svg'), await inlinePaper('app-icon.svg'))

console.log('已从 assets/app-icon 导出应用图标 PNG')
