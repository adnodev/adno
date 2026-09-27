export function copyToClipboard(text: string): void {
    if (window.isSecureContext && navigator.clipboard) {
        navigator.clipboard.writeText(text)
        return
    }

    const textArea = document.createElement('textarea')

    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
        document.execCommand('copy')
    } catch (error) {
        console.error('Unable to copy to clipboard', error)
    }

    document.body.removeChild(textArea)
}
