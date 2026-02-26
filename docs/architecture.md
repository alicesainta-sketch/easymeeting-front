# Architecture Overview

## Goals
- Keep the meeting room UI driven by a shared engine (state machine + event sourcing).
- Maintain clear boundaries between UI, domain logic, and persistence.
- Enable timeline replay, policy gating, and recoverable state.

## Core Modules
- `src/renderer/src/core/meeting-engine/`
  - `protocol.js`: event contract, type definitions, versioning.
  - `events.js`: event creation and normalization.
  - `formatters.js`: event/role labels and time formatting.
  - `metrics.js`: event aggregation for analytics panels.
  - `machine.js`: meeting lifecycle state machine.
  - `selectors.js`: derived timeline + replay snapshot.
  - `eventStore.js`: local persistence and pub/sub.

## Data Flow
1. UI actions call composables (room/view layer).
2. Composables append events into the event store.
3. State machine and selectors derive the current state.
4. UI renders timeline, snapshot, and control availability.

## Boundaries
- UI components are stateless and only receive props and callbacks.
- Engine code is framework-agnostic and testable in isolation.
- Storage is abstracted behind `eventStore` to allow future backend sync.
