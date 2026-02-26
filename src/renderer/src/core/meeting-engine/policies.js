// 会议规则引擎：统一计算主持人控制权限与禁用原因
// 边界说明：非主持人一律禁用；已结束状态不允许任何状态变更
const getMeetingActionAvailability = ({ state, canModerate }) => {
  const normalizeState = state || 'idle'
  const baseDeniedReason = canModerate ? '' : '仅主持人/联席主持可操作'

  const buildAction = (key, label, enabled, reason) => {
    return {
      key,
      label,
      enabled,
      reason: enabled ? '' : reason
    }
  }

  if (!canModerate) {
    return [
      buildAction('start', '开始会议', false, baseDeniedReason),
      buildAction('pause', '暂停会议', false, baseDeniedReason),
      buildAction('resume', '继续会议', false, baseDeniedReason),
      buildAction('end', '结束会议', false, baseDeniedReason)
    ]
  }

  return [
    buildAction('start', '开始会议', normalizeState === 'idle', '会议已开始或已结束'),
    buildAction('pause', '暂停会议', normalizeState === 'live', '当前不在进行中'),
    buildAction('resume', '继续会议', normalizeState === 'paused', '当前不在暂停中'),
    buildAction('end', '结束会议', normalizeState !== 'ended', '会议已结束')
  ]
}

export { getMeetingActionAvailability }
