const AUDIT_STORAGE_KEY = 'easymeeting-audit-logs'
const MAX_AUDIT_LOGS = 200

const canUseElectronStore = () => {
  return Boolean(window?.electron?.ipcRenderer?.invoke)
}

const getLocalAuditLogs = () => {
  const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
  if (!raw) return []
  try {
    const logs = JSON.parse(raw)
    return Array.isArray(logs) ? logs : []
  } catch {
    return []
  }
}

const saveLocalAuditLogs = (logs) => {
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs))
}

// 本地模式追加审计日志：限制最大长度避免无限增长
const appendLocalAuditLog = (log) => {
  const logs = getLocalAuditLogs()
  saveLocalAuditLogs([log, ...logs].slice(0, MAX_AUDIT_LOGS))
}

// 获取审计日志：Electron 模式走 IPC，本地模式走 localStorage
const listAuditLogs = async ({ limit = 20 } = {}) => {
  if (canUseElectronStore()) {
    try {
      const logs = await window.electron.ipcRenderer.invoke('audit:list')
      return Array.isArray(logs) ? logs.slice(0, limit) : []
    } catch {
      // IPC 异常时回退本地数据，保持页面可用
    }
  }

  const logs = getLocalAuditLogs()
  return logs.slice(0, limit)
}

export { AUDIT_STORAGE_KEY, appendLocalAuditLog, listAuditLogs }
