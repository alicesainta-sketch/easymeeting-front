# Architecture Diagram (Text)

## Module Dependency Graph

```
[UI Components]
  -> [Composables]
    -> [Meeting Engine]
      -> [protocol]
      -> [events]
      -> [formatters]
      -> [metrics]
      -> [machine]
      -> [selectors]
      -> [eventStore]
```

## Data Flow

```
User Action
  -> Composable
    -> Append Event
      -> Event Store
        -> State Machine Transition
        -> Selectors Build Snapshot/Timeline
          -> UI Render
```

## Notes
- UI is stateless and only consumes derived state.
- Engine modules remain framework-agnostic.
- EventStore is the single persistence point.
