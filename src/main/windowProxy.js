const windowManager = {}

const saveWindow = (id, window) => {
  windowManager[id] = window
}

const getWindow = (id) => {
  return windowManager[id]
}
const deWindow = (id) => {
  delete windowManager[id]
}

const getWindowManager = () => {
  return windowManager
}

export { saveWindow, getWindow, deWindow, getWindowManager }
