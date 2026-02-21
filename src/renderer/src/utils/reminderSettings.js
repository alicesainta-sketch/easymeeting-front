const REMINDER_SETTINGS_STORAGE_KEY = 'easymeeting-reminder-settings'

const REMINDER_STAGE_ONE_OPTIONS = [30, 15, 10, 5]
const REMINDER_STAGE_TWO_OPTIONS = [5, 3, 1]

const DEFAULT_REMINDER_SETTINGS = {
  autoEnabled: true,
  stageOneMinutes: 10,
  stageTwoMinutes: 1
}

const normalizeReminderSettings = (settings = {}) => {
  const autoEnabled = settings.autoEnabled !== false
  const stageOneMinutes = REMINDER_STAGE_ONE_OPTIONS.includes(Number(settings.stageOneMinutes))
    ? Number(settings.stageOneMinutes)
    : DEFAULT_REMINDER_SETTINGS.stageOneMinutes
  const stageTwoMinutes = REMINDER_STAGE_TWO_OPTIONS.includes(Number(settings.stageTwoMinutes))
    ? Number(settings.stageTwoMinutes)
    : DEFAULT_REMINDER_SETTINGS.stageTwoMinutes

  if (stageOneMinutes <= stageTwoMinutes) {
    return { ...DEFAULT_REMINDER_SETTINGS, autoEnabled }
  }

  return {
    autoEnabled,
    stageOneMinutes,
    stageTwoMinutes
  }
}

const getReminderSettings = () => {
  const raw = localStorage.getItem(REMINDER_SETTINGS_STORAGE_KEY)
  if (!raw) return { ...DEFAULT_REMINDER_SETTINGS }

  try {
    const parsed = JSON.parse(raw)
    return normalizeReminderSettings(parsed)
  } catch {
    return { ...DEFAULT_REMINDER_SETTINGS }
  }
}

const setReminderSettings = (settings) => {
  const normalized = normalizeReminderSettings(settings)
  localStorage.setItem(REMINDER_SETTINGS_STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export {
  REMINDER_STAGE_ONE_OPTIONS,
  REMINDER_STAGE_TWO_OPTIONS,
  DEFAULT_REMINDER_SETTINGS,
  getReminderSettings,
  setReminderSettings
}
