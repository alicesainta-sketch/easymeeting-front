const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

const pad = (value) => {
  return String(Math.max(0, value)).padStart(2, '0')
}

const getMeetingRemainingMs = (startTime, nowTime = Date.now()) => {
  return new Date(startTime).getTime() - nowTime
}

const formatCountdown = (remainingMs) => {
  if (remainingMs <= 0) return '00:00'
  const totalSeconds = Math.ceil(remainingMs / SECOND)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

const formatRemainingText = (remainingMs) => {
  if (remainingMs <= 0) return '不到1分钟'
  if (remainingMs < MINUTE) return `${Math.ceil(remainingMs / SECOND)} 秒`
  if (remainingMs < HOUR) return `${Math.ceil(remainingMs / MINUTE)} 分钟`

  const hours = Math.floor(remainingMs / HOUR)
  const leftMinutes = Math.ceil((remainingMs % HOUR) / MINUTE)
  if (leftMinutes === 60) return `${hours + 1} 小时`
  if (leftMinutes === 0) return `${hours} 小时`
  return `${hours} 小时 ${leftMinutes} 分钟`
}

export { MINUTE, getMeetingRemainingMs, formatCountdown, formatRemainingText }
