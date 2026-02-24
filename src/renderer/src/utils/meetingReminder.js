const reminderMarks = new Set()

const buildReminderKey = (meetingId, stageKey) => `${meetingId}:${stageKey}`

const shouldNotifyReminder = (meetingId, stageKey) => {
  if (!meetingId || !stageKey) return false
  const key = buildReminderKey(meetingId, stageKey)
  if (reminderMarks.has(key)) return false
  reminderMarks.add(key)
  return true
}

const clearMeetingReminders = (meetingId) => {
  if (!meetingId) return
  for (const key of Array.from(reminderMarks)) {
    if (key.startsWith(`${meetingId}:`)) {
      reminderMarks.delete(key)
    }
  }
}

export { shouldNotifyReminder, clearMeetingReminders }
