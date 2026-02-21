const AUTH_STORAGE_KEY = 'easymeeting-user'
const canUseElectronStore = () => {
  return Boolean(window?.electron?.ipcRenderer?.invoke)
}

const getCurrentUser = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const setCurrentUser = (user) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  if (canUseElectronStore()) {
    window.electron.ipcRenderer.invoke('auth:setCurrentUser', user).catch(() => {
      // Keep local auth flow available in web mode.
    })
  }
}

const clearCurrentUser = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  if (canUseElectronStore()) {
    window.electron.ipcRenderer.invoke('auth:clearCurrentUser').catch(() => {
      // Keep local auth flow available in web mode.
    })
  }
}

const isAuthenticated = () => {
  const user = getCurrentUser()
  return Boolean(user?.email)
}

const syncUserFromStore = async () => {
  if (!canUseElectronStore()) {
    return getCurrentUser()
  }

  try {
    const user = await window.electron.ipcRenderer.invoke('auth:getCurrentUser')
    if (user?.email) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      return user
    }
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  } catch {
    return getCurrentUser()
  }
}

export {
  AUTH_STORAGE_KEY,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  isAuthenticated,
  syncUserFromStore
}
