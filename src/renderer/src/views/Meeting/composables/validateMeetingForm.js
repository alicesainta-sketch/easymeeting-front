const MIN_DURATION_MINUTES = 15
const MAX_DURATION_MINUTES = 180

const validateMeetingForm = (formData) => {
  if (!formData.title || !formData.topic || !formData.startTime || !formData.durationMinutes) {
    return {
      ok: false,
      message: '请先填写完整必填项'
    }
  }

  const startTimestamp = Number(formData.startTime)
  if (!Number.isFinite(startTimestamp)) {
    return {
      ok: false,
      message: '开始时间格式错误'
    }
  }

  if (startTimestamp <= Date.now()) {
    return {
      ok: false,
      message: '开始时间需晚于当前时间'
    }
  }

  const durationMinutes = Number(formData.durationMinutes)
  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes < MIN_DURATION_MINUTES ||
    durationMinutes > MAX_DURATION_MINUTES
  ) {
    return {
      ok: false,
      message: `会议时长需在 ${MIN_DURATION_MINUTES}-${MAX_DURATION_MINUTES} 分钟`
    }
  }

  return {
    ok: true,
    startTimestamp,
    durationMinutes
  }
}

export { validateMeetingForm }
