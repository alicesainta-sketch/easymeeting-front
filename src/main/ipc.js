import { ipcMain } from 'electron'
import { getWindow } from './windowProxy'

const onLoginOrRegister = () => {
  ipcMain.handle('loginOrRegister', (e, isLogin) => {
    const login_width = 375
    const login_height = 365
    const register_height = 485
    const mainWindow = getWindow('main')
    mainWindow.setResizeable(true)
    mainWindow.setMinimumSize(login_width, login_height)
    if (isLogin) {
      mainWindow.setSize(login_width, login_height)
    } else {
      mainWindow.setSize(login_width, register_height)
    }
    mainWindow.setResizeable(false)
  })
}

export { onLoginOrRegister }
