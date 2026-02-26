# Meeting Engine Design

## Event Contract
Each event follows the structure below:

```
{
  id: string,
  type: string,
  actor: { name: string, role: string },
  payload: object,
  timestamp: number,
  version: number
}
```

The payload fields are documented in `protocol.js` via `EVENT_PAYLOAD_SCHEMA`.

## State Machine
Meeting lifecycle states:
- `idle` -> `live` -> `paused` -> `ended`

Transitions are triggered only by meeting lifecycle events:
- `MEETING_STARTED`, `MEETING_PAUSED`, `MEETING_RESUMED`, `MEETING_ENDED`

## Event Sourcing
- All UI actions append events into the store.
- Current UI state is derived by replaying events.
- Timeline replay is just a partial replay of the event list.

## Policy Gating
- `policies.js` defines what actions are allowed in a given state.
- UI uses those results to disable or hide controls.

## Extensibility
- Add new event types in `protocol.js`.
- Update formatters and snapshot logic when new events are introduced.
- Keep selectors and metrics pure for easy testing.
