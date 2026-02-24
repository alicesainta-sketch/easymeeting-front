const copyText = async (text) => {
  if (!text) return false
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to legacy copy command.
    }
  }

  try {
    const input = document.createElement('textarea')
    input.value = text
    input.setAttribute('readonly', 'readonly')
    input.style.position = 'fixed'
    input.style.left = '-9999px'
    document.body.appendChild(input)
    input.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(input)
    return copied
  } catch {
    return false
  }
}

export { copyText }
