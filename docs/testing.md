# Testing Strategy

## Scope
- Core meeting engine is covered by unit tests.
- UI components are validated via engine behavior and integration checks.

## What Is Covered
- State machine transitions.
- Policy gating for moderator actions.
- Timeline and replay snapshot selectors.
- Metrics aggregation and formatter output.

## Test Commands
- `npm run test`
- `npm run lint`

## Notes
- Engine modules are framework-agnostic, so tests stay lightweight.
- Event store tests can be added with a minimal `localStorage` stub.
