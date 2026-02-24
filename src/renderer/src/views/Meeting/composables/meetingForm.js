const DEFAULT_FORM = {
  title: '',
  topic: '',
  startTime: '',
  durationMinutes: 45,
  roomPassword: '',
  allowParticipantEarlyJoin: true,
  waitingRoomWhitelist: '',
  participants: '',
  agenda: '',
  notes: ''
}

const createMeetingForm = (options = {}) => {
  return {
    ...DEFAULT_FORM,
    ...(options.includeHost ? { host: '' } : {})
  }
}

const resetMeetingForm = (form, options = {}) => {
  Object.assign(form, createMeetingForm(options))
}

const toCommaString = (value) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.join(',')
  return String(value)
}

const toLineString = (value) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.join('\n')
  return String(value)
}

const buildMeetingFormFromMeeting = (meeting, options = {}) => {
  const form = createMeetingForm(options)
  if (!meeting) return form
  form.title = meeting.title || ''
  form.topic = meeting.topic || ''
  form.startTime = meeting.startTime ? String(new Date(meeting.startTime).getTime()) : ''
  form.durationMinutes = Number(meeting.durationMinutes || DEFAULT_FORM.durationMinutes)
  form.roomPassword = meeting.roomPassword || ''
  form.allowParticipantEarlyJoin = meeting.allowParticipantEarlyJoin ?? true
  form.waitingRoomWhitelist = toCommaString(meeting.waitingRoomWhitelist)
  form.participants = toCommaString(meeting.participants)
  form.agenda = toLineString(meeting.agenda)
  form.notes = meeting.notes || ''
  if (options.includeHost) {
    form.host = meeting.host || ''
  }
  return form
}

const splitByDelimiter = (value, delimiter) => {
  if (!value) return []
  return value
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean)
}

const splitLines = (value) => {
  if (!value) return []
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const buildMeetingPayload = (formData, validation, options = {}) => {
  const payload = {
    title: formData.title,
    topic: formData.topic,
    startTime: new Date(validation.startTimestamp).toISOString(),
    durationMinutes: validation.durationMinutes,
    roomPassword: formData.roomPassword?.trim?.() || '',
    allowParticipantEarlyJoin: formData.allowParticipantEarlyJoin,
    waitingRoomWhitelist: splitByDelimiter(formData.waitingRoomWhitelist, ','),
    participants: splitByDelimiter(formData.participants, ','),
    agenda: splitLines(formData.agenda),
    notes: formData.notes
  }
  if (options.host !== undefined) {
    payload.host = options.host
  }
  return payload
}

export { buildMeetingFormFromMeeting, buildMeetingPayload, createMeetingForm, resetMeetingForm }
