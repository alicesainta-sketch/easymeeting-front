import { ipcMain } from 'electron'
import { getWindow } from './windowProxy'
import {
  clearCurrentUser,
  createMeeting,
  getCurrentUser,
  getMeetingById,
  getMeetings,
  setCurrentUser
} from './persistentStore'

const login_width = 375
const login_height = 365
const register_height = 485
const workspace_width = 1180
const workspace_height = 760
const workspace_min_width = 980
const workspace_min_height = 640

const registerHandle = (channel, handler) => {
  ipcMain.removeHandler(channel)
  ipcMain.handle(channel, handler)
}

const resetToAuthWindow = (mainWindow, isLogin = true) => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  }
  mainWindow.setResizable(true)
  mainWindow.setMaximizable(false)
  mainWindow.setMinimumSize(login_width, login_height)
  mainWindow.setSize(login_width, isLogin ? login_height : register_height)
  mainWindow.center()
  mainWindow.setResizable(false)
}

const setMeetingWorkspace = (mainWindow) => {
  mainWindow.setResizable(true)
  mainWindow.setMaximizable(true)
  mainWindow.setMinimumSize(workspace_min_width, workspace_min_height)
  const [width, height] = mainWindow.getSize()
  if (width < workspace_min_width || height < workspace_min_height) {
    mainWindow.setSize(workspace_width, workspace_height)
    mainWindow.center()
  }
}

const onLoginOrRegister = () => {
  registerHandle('loginOrRegister', (_, isLogin) => {
    const mainWindow = getWindow('main')
    if (!mainWindow) return
    resetToAuthWindow(mainWindow, isLogin)
  })
}

const onWorkspaceMode = () => {
  registerHandle('setWorkspaceMode', (_, mode) => {
    const mainWindow = getWindow('main')
    if (!mainWindow) return
    if (mode === 'meeting') {
      setMeetingWorkspace(mainWindow)
      return
    }
    resetToAuthWindow(mainWindow, true)
  })
}

const onMeetingStore = () => {
  registerHandle('meetings:list', () => {
    return getMeetings()
  })

  registerHandle('meetings:getById', (_, id) => {
    return getMeetingById(id)
  })

  registerHandle('meetings:create', (_, payload) => {
    return createMeeting(payload)
  })
}

const onAuthStore = () => {
  registerHandle('auth:getCurrentUser', () => {
    return getCurrentUser()
  })

  registerHandle('auth:setCurrentUser', (_, user) => {
    setCurrentUser(user)
    return true
  })

  registerHandle('auth:clearCurrentUser', () => {
    clearCurrentUser()
    return true
  })
}

export { onLoginOrRegister, onWorkspaceMode, onMeetingStore, onAuthStore }
