const AUTH_STORAGE_KEY = 'easymeeting-user'

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
}

const clearCurrentUser = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

const isAuthenticated = () => {
  const user = getCurrentUser()
  return Boolean(user?.email)
}

export { AUTH_STORAGE_KEY, getCurrentUser, setCurrentUser, clearCurrentUser, isAuthenticated }
