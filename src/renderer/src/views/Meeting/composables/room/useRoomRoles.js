import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const useRoomRoles = ({ meeting, displayName, allowParticipantMic, joined, appendChatMessage }) => {
  const cohostList = ref([])
  const allowedSpeakerSet = ref(new Set())

  const normalizeName = (value) => (value ? value.trim() : '')
  const normalizedDisplayName = computed(() => normalizeName(displayName.value))
  const hostName = computed(() => normalizeName(meeting.value?.host))
  const isHostName = (name) => Boolean(hostName.value) && normalizeName(name) === hostName.value
  const isCohostName = (name) => cohostList.value.includes(normalizeName(name))
  const getRole = (name) => {
    if (isHostName(name)) return 'host'
    if (isCohostName(name)) return 'cohost'
    return 'participant'
  }
  const userRole = computed(() => getRole(normalizedDisplayName.value))
  const canModerate = computed(() => ['host', 'cohost'].includes(userRole.value))
  const canManageRoles = computed(() => userRole.value === 'host')

  const waitingRoomWhitelist = computed(() => {
    const list = Array.isArray(meeting.value?.waitingRoomWhitelist)
      ? meeting.value.waitingRoomWhitelist
      : []
    return list.map((name) => normalizeName(name)).filter(Boolean)
  })
  const waitingWhitelistCount = computed(() => waitingRoomWhitelist.value.length)
  const isInWaitingWhitelist = (name) => waitingRoomWhitelist.value.includes(normalizeName(name))

  const getRoleLabel = (role) => {
    if (role === 'host') return '主持人'
    if (role === 'cohost') return '联席主持人'
    return '参会者'
  }

  const isParticipantAllowedToSpeak = (name) => {
    if (allowParticipantMic.value) return true
    return allowedSpeakerSet.value.has(normalizeName(name))
  }

  const setParticipantSpeakAllowed = (name, allowed) => {
    const normalizedName = normalizeName(name)
    if (!normalizedName) return
    const next = new Set(allowedSpeakerSet.value)
    if (allowed) {
      next.add(normalizedName)
    } else {
      next.delete(normalizedName)
    }
    allowedSpeakerSet.value = next
  }

  const clearAllowedSpeakers = () => {
    if (!allowedSpeakerSet.value.size) return
    allowedSpeakerSet.value = new Set()
  }

  const resetRoleState = () => {
    clearAllowedSpeakers()
    cohostList.value = []
  }

  const pruneRoleState = () => {
    if (!meeting.value) return
    const participants = Array.isArray(meeting.value.participants) ? meeting.value.participants : []
    const normalizedParticipants = new Set(participants.map((name) => normalizeName(name)))
    const nextCohosts = cohostList.value.filter(
      (name) => normalizedParticipants.has(name) && !isHostName(name)
    )
    if (nextCohosts.length !== cohostList.value.length) {
      cohostList.value = nextCohosts
    }
    const nextAllowed = new Set()
    for (const name of allowedSpeakerSet.value) {
      if (normalizedParticipants.has(name)) {
        nextAllowed.add(name)
      }
    }
    allowedSpeakerSet.value = nextAllowed
  }

  const assertModerationPermission = () => {
    if (canModerate.value) return true
    ElMessage.warning('仅主持人或联席主持人可操作')
    return false
  }

  const assertRolePermission = () => {
    if (canManageRoles.value) return true
    ElMessage.warning('仅主持人可管理角色')
    return false
  }

  const toggleCohostRole = (name) => {
    if (!assertRolePermission()) return
    const normalizedName = normalizeName(name)
    if (!normalizedName || !meeting.value) return
    const participants = Array.isArray(meeting.value.participants) ? meeting.value.participants : []
    if (!participants.some((participant) => normalizeName(participant) === normalizedName)) {
      ElMessage.warning('该成员不在会议中')
      return
    }
    if (isHostName(normalizedName)) {
      ElMessage.info('主持人无需设置为联席主持人')
      return
    }
    const next = new Set(cohostList.value)
    let message = ''
    if (next.has(normalizedName)) {
      next.delete(normalizedName)
      message = `已取消 ${normalizedName} 的联席主持人权限`
    } else {
      next.add(normalizedName)
      message = `已将 ${normalizedName} 设置为联席主持人`
    }
    cohostList.value = Array.from(next)
    if (joined.value) {
      appendChatMessage('系统', message, 'system')
    }
    ElMessage.success(message)
  }

  const removeParticipant = (name) => {
    if (!assertModerationPermission()) return
    const normalizedName = normalizeName(name)
    if (!normalizedName || !meeting.value) return
    if (normalizedName === normalizedDisplayName.value) {
      ElMessage.warning('不能移出自己')
      return
    }
    if (isHostName(normalizedName)) {
      ElMessage.warning('不能移出主持人')
      return
    }
    const participants = Array.isArray(meeting.value.participants) ? meeting.value.participants : []
    if (!participants.some((participant) => normalizeName(participant) === normalizedName)) return
    meeting.value = {
      ...meeting.value,
      participants: participants.filter(
        (participant) => normalizeName(participant) !== normalizedName
      )
    }
    setParticipantSpeakAllowed(normalizedName, false)
    cohostList.value = cohostList.value.filter((cohost) => cohost !== normalizedName)
    if (joined.value) {
      appendChatMessage('系统', `${normalizedName} 已被移出会议（演示）`, 'system')
    }
    ElMessage.success(`已移出 ${normalizedName}`)
  }

  return {
    normalizeName,
    normalizedDisplayName,
    hostName,
    isHostName,
    isCohostName,
    getRole,
    getRoleLabel,
    userRole,
    canModerate,
    canManageRoles,
    waitingRoomWhitelist,
    waitingWhitelistCount,
    isInWaitingWhitelist,
    isParticipantAllowedToSpeak,
    setParticipantSpeakAllowed,
    clearAllowedSpeakers,
    resetRoleState,
    pruneRoleState,
    assertModerationPermission,
    assertRolePermission,
    toggleCohostRole,
    removeParticipant
  }
}

export { useRoomRoles }
