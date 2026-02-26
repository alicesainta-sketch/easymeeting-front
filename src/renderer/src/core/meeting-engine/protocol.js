// Meeting event protocol definition.
// Each event should match: { id, type, actor, payload, timestamp, version }.
const EVENT_VERSION = 1

// Event types are used for event sourcing and state machine transitions.
const MeetingEventType = {
  MEETING_STARTED: 'MEETING_STARTED',
  MEETING_PAUSED: 'MEETING_PAUSED',
  MEETING_RESUMED: 'MEETING_RESUMED',
  MEETING_ENDED: 'MEETING_ENDED',
  USER_JOINED: 'USER_JOINED',
  USER_LEFT: 'USER_LEFT',
  ROLE_CHANGED: 'ROLE_CHANGED',
  MIC_TOGGLED: 'MIC_TOGGLED',
  CAMERA_TOGGLED: 'CAMERA_TOGGLED',
  HAND_RAISED: 'HAND_RAISED',
  HAND_LOWERED: 'HAND_LOWERED',
  SCREEN_SHARE_STARTED: 'SCREEN_SHARE_STARTED',
  SCREEN_SHARE_STOPPED: 'SCREEN_SHARE_STOPPED',
  MEETING_LOCKED: 'MEETING_LOCKED',
  MEETING_UNLOCKED: 'MEETING_UNLOCKED',
  MIC_POLICY_CHANGED: 'MIC_POLICY_CHANGED',
  SPEAKER_ALLOWED: 'SPEAKER_ALLOWED',
  WAIT_APPROVED: 'WAIT_APPROVED',
  WAIT_REJECTED: 'WAIT_REJECTED'
}

// Payload contract for key event types, used as documentation and validation reference.
// `required` and `optional` list the expected payload fields.
const EVENT_PAYLOAD_SCHEMA = {
  [MeetingEventType.MEETING_STARTED]: { required: [], optional: ['reason'] },
  [MeetingEventType.MEETING_PAUSED]: { required: [], optional: ['reason'] },
  [MeetingEventType.MEETING_RESUMED]: { required: [], optional: ['reason'] },
  [MeetingEventType.MEETING_ENDED]: { required: [], optional: ['reason'] },
  [MeetingEventType.USER_JOINED]: { required: ['name'], optional: [] },
  [MeetingEventType.USER_LEFT]: { required: ['name'], optional: [] },
  [MeetingEventType.ROLE_CHANGED]: { required: ['name', 'from', 'to'], optional: [] },
  [MeetingEventType.MIC_TOGGLED]: { required: ['enabled'], optional: [] },
  [MeetingEventType.CAMERA_TOGGLED]: { required: ['enabled'], optional: [] },
  [MeetingEventType.HAND_RAISED]: { required: [], optional: ['raisedAt'] },
  [MeetingEventType.HAND_LOWERED]: { required: [], optional: [] },
  [MeetingEventType.SCREEN_SHARE_STARTED]: { required: [], optional: [] },
  [MeetingEventType.SCREEN_SHARE_STOPPED]: { required: [], optional: [] },
  [MeetingEventType.MEETING_LOCKED]: { required: [], optional: [] },
  [MeetingEventType.MEETING_UNLOCKED]: { required: [], optional: [] },
  [MeetingEventType.MIC_POLICY_CHANGED]: { required: ['allowParticipantMic'], optional: [] },
  [MeetingEventType.SPEAKER_ALLOWED]: { required: ['name'], optional: [] },
  [MeetingEventType.WAIT_APPROVED]: { required: ['name'], optional: [] },
  [MeetingEventType.WAIT_REJECTED]: { required: ['name'], optional: [] }
}

export { EVENT_VERSION, MeetingEventType, EVENT_PAYLOAD_SCHEMA }
