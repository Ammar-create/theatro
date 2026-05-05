# Theatro Architecture

## Philosophy

Theatro is designed as a **narrative state machine** where characters, controllers, and the user interact through a strictly-sequenced turn system. Every design decision prioritizes:

1. **Determinism**: Given the same state, the system produces the same behavior
2. **Observability**: Every controller decision is logged and inspectable
3. **Recoverability**: Any state can be exported, imported, resumed
4. **Extensibility**: Swappable adapters for storage, providers, models

## Core Abstractions

### Turn Queue (Critical)

The strict sequential queue is the heart of Theatro. It prevents race conditions and ensures each character sees fully-updated context before generating.

```
[User] → [Character A] → [Character B] → [Character C] → [Main Controller] → ...
```

- Only one LLM call in flight at any moment
- Queue state persisted to IndexedDB (resumable across reloads)
- User can pause, inspect, resume at any point
- Branching creates new scenario with copied state, diverges from there

### State Layers

| Layer | Persistence | Scope | Contents |
|-------|-------------|-------|----------|
| **Session** | Memory only | Tab | Streaming responses, transient UI state |
| **Scenario** | IndexedDB | Per-chat | Messages, character instances, relationships |
| **Character** | IndexedDB | Global | Base sheets, voices, colors, avatars |
| **User** | LocalStorage | Global | API keys, preferences, global settings |

### Controller Output Schema

Controllers emit **structured JSON directives**, not raw text. This enables:
- Validation before application
- Rollback on invalid output
- Debug inspection
- Replay for testing

```typescript
interface MainControllerOutput {
  version: "1.0";
  directives: Directive[];
  summary?: string;
  relationshipUpdates?: RelationshipDelta[];
}

type Directive = 
  | { type: "mood"; characterId: string; mood: string; reason: string; intensity: number }
  | { type: "whisper"; characterId: string; targetId: string; content: string }
  | { type: "scene_shift"; location: string; atmosphere: string }
  | { type: "request_scenario_controller"; reason: string }
  | { type: "auto_generate_image"; prompt: string; reason: string };
```

### Memory Injection Strategy

Each character prompt is assembled fresh every turn:

```
[SYSTEM: You are {name}, {personality}]
[SUMMARY: {longTermSummary}]
[RELATIONSHIPS: {relevantRowsFromMatrix}]
[RECENT: {lastNMessages}]
[USER MESSAGE or CONTEXT]
[INSTRUCTION: Generate response with mood {currentMood}]
```

Private conversations (DMs) are stored with `isPrivateBetween: [id1, id2]` and only injected into context for those characters.

## Data Flow

```
User Input / Auto-Scenario Trigger
        ↓
[Turn Queue Manager]
        ↓
[State Assembler] → Fetches summary, relationships, recent messages
        ↓
[Prompt Builder] → Assembles character-specific prompt
        ↓
[Provider Adapter] → Streaming fetch
        ↓
[Response Parser] → Markdown action extraction, content validation
        ↓
[State Updater] → Save message, update turn queue
        ↓
[Main Controller?] → N messages reached? Trigger analysis
        ↓
[Directive Applier] → Apply mood shifts, scene changes
        ↓
[UI Update] → Streaming render, relationship matrix refresh
```

## IndexedDB Schema

```javascript
// IndexedDB stores (version 1)
const STORES = {
  characters: '++id, name, updatedAt, isUser',
  scenarios: '++id, name, updatedAt, parentId',
  messages: '++id, scenarioId, characterId, timestamp, [scenarioId+timestamp]',
  memories: '[characterId+scenarioId], characterId, scenarioId',
  relationships: 'scenarioId, updatedAt',
  settings: 'key',
  providers: '++id, name, isDefault',
  exports: '++id, name, createdAt, type' // export metadata
};
```

## Swappable Adapters

All external dependencies implement adapter interfaces:

```typescript
interface StorageAdapter {
  getCharacters(): Promise<Character[]>;
  saveCharacter(c: Character): Promise<void>;
  // ... etc
}

interface ProviderAdapter {
  streamChat(params: ChatParams): AsyncIterable<Chunk>;
  listModels(): Promise<Model[]>;
}

// Current: IndexedDBStorageAdapter
// Future: SupabaseStorageAdapter implements same interface
```

## Error Recovery Strategies

| Failure | Strategy |
|---------|----------|
| API timeout | Exponential backoff, fallback model, user notification |
| Invalid JSON from controller | Retry with stricter prompt, skip cycle if fails twice |
| IndexedDB quota exceeded | Prompt export, LRU eviction of generated images |
| Character breaks character | Main Controller detects, sends silent correction directive |
| Rate limit | Client-side tracking, 80% warning, suggest Aqua upgrade |

## Security Considerations

- **API Keys**: Provider P key is publishable (rate-limited, no abuse vector). Provider A and custom keys stored in LocalStorage (encrypted at rest not required for v1, user can clear).
- **XSS**: All content sanitized through DOMPurify. Character-generated content treated as untrusted.
- **CSP**: Strict CSP headers recommended for deployment.

## Performance Targets

- First paint: < 1s
- Time to interactive: < 2s
- Message streaming start: < 500ms (with warm connection)
- IndexedDB query: < 50ms for 1000 messages
- Turn queue pause-to-resume: < 100ms
