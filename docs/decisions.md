# Engineering Decisions

## 1. Event Sourcing as the Core Model
- **Decision**: All meeting operations are stored as immutable events.
- **Why**: Enables timeline replay, auditing, and predictable state recovery.
- **Tradeoff**: Slightly higher modeling cost versus direct state mutation.

## 2. State Machine for Lifecycle Control
- **Decision**: Meeting lifecycle uses a dedicated state machine.
- **Why**: Keeps lifecycle transitions explicit and testable.
- **Tradeoff**: Adds an extra abstraction layer but prevents invalid transitions.

## 3. Policy Layer for Permissions
- **Decision**: Permission checks live in a policy module, not UI.
- **Why**: Centralized rules reduce drift and simplify testing.
- **Tradeoff**: UI needs to consume policy results instead of hard-coded logic.

## 4. Engine vs. UI Boundary
- **Decision**: Engine modules remain framework-agnostic; UI consumes derived state.
- **Why**: Keeps core logic reusable and easy to test.
- **Tradeoff**: Requires additional selectors/formatters for UI-friendly data.

## 5. Local Event Store as Persistence
- **Decision**: Use a local event store with a capped size.
- **Why**: Keeps the demo responsive and avoids storage blow-up.
- **Tradeoff**: Older events are pruned; long-term history needs backend sync.
