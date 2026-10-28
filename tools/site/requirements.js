// 页面展示、下载与复制均使用同一份要求文件的完整正文。
document.querySelectorAll('[data-copy-requirement]').forEach((button) => {
  button.addEventListener('click', async () => {
    const id = button.dataset.copyRequirement
    const content = document.getElementById(`${id}-content`)
    const status = document.getElementById(`${id}-status`)
    button.disabled = true
    try {
      await navigator.clipboard.writeText(content.value)
      status.textContent = '已复制完整要求。请粘贴给大模型，再补充你的主题或文件链接。'
    } catch {
      content.closest('details').open = true
      content.focus()
      content.select()
      status.textContent = '已选中完整要求，请按 Ctrl+C / ⌘C，或长按复制，再粘贴给大模型。'
    } finally {
      button.disabled = false
    }
  })
})
