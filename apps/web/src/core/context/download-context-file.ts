export function downloadContextFile(
  content: string,
) {
  const blob = new Blob([content], {
    type: "text/plain",
  })

  const url =
    window.URL.createObjectURL(blob)

  const anchor =
    document.createElement("a")

  anchor.href = url

  anchor.download =
    `foundry-context-${Date.now()}.txt`

  document.body.appendChild(anchor)

  anchor.click()

  document.body.removeChild(anchor)

  window.URL.revokeObjectURL(url)
}