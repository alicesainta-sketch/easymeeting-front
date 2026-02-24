const setWorkspaceMode = async (mode) => {
  try {
    await window.electron?.ipcRenderer?.invoke('setWorkspaceMode', mode)
  } catch {
    // Keep functional in web mode.
  }
}

export { setWorkspaceMode }
