import type { 
  Character, 
  Scenario, 
  Message, 
  Memory, 
  RelationshipMatrix,
  Provider,
  GlobalSettings,
  SidePanelState,
  AppState,
  ControllerType
} from '../types/index.js';
import {
  getAllCharacters,
  getCharacter,
  saveCharacter,
  deleteCharacter,
  getUserCharacter,
  getAllScenarios,
  getScenario,
  saveScenario,
  getMessagesForScenario,
  saveMessage,
  getMemory,
  saveMemory,
  getRelationshipMatrix,
  saveRelationshipMatrix,
  getAllProviders,
  getDefaultProvider,
  getSetting,
  setSetting
} from '../core/storage.js';

// ===== EVENT EMITTER FOR REACTIVITY =====

class EventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

export const appEvents = new EventEmitter();

// ===== CHARACTER STORE =====

class CharacterStore {
  private _characters: Map<string, Character> = new Map();
  private _initialized = false;

  async init() {
    if (this._initialized) return;
    const chars = await getAllCharacters();
    chars.forEach(char => this._characters.set(char.id, char));
    this._initialized = true;
    appEvents.emit('characters:loaded', this.all);
  }

  get all(): Character[] {
    return Array.from(this._characters.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  }

  get user(): Character | undefined {
    return this.all.find(c => c.isUser);
  }

  get regular(): Character[] {
    return this.all.filter(c => !c.isUser);
  }

  get(id: string): Character | undefined {
    return this._characters.get(id);
  }

  async create(char: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character> {
    const now = Date.now();
    const newChar: Character = {
      ...char,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
    
    // If setting as user, unset any existing user
    if (newChar.isUser) {
      const existingUser = this.user;
      if (existingUser) {
        existingUser.isUser = false;
        await saveCharacter(existingUser);
        this._characters.set(existingUser.id, existingUser);
      }
    }

    await saveCharacter(newChar);
    this._characters.set(newChar.id, newChar);
    appEvents.emit('character:created', newChar);
    appEvents.emit('characters:changed', this.all);
    return newChar;
  }

  async update(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const char = this._characters.get(id);
    if (!char) return undefined;

    // Handle user flag change
    if (updates.isUser && !char.isUser) {
      const existingUser = this.user;
      if (existingUser) {
        existingUser.isUser = false;
        await saveCharacter(existingUser);
        this._characters.set(existingUser.id, existingUser);
      }
    }

    const updated = { ...char, ...updates, updatedAt: Date.now() };
    await saveCharacter(updated);
    this._characters.set(id, updated);
    appEvents.emit('character:updated', updated);
    appEvents.emit('characters:changed', this.all);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const char = this._characters.get(id);
    if (!char) return false;

    // Prevent deleting the last character in active scenarios
    const activeScenarios = scenarioStore.all.filter(s => 
      s.isActive && s.characterIds.includes(id)
    );
    
    if (activeScenarios.length > 0) {
      throw new Error(`Cannot delete character: active in ${activeScenarios.length} scenarios`);
    }

    // Remove from IndexedDB
    const db = await import('../core/storage.js');
    const { getDB } = db;
    const database = await getDB();
    await database.delete('characters', id);

    this._characters.delete(id);
    appEvents.emit('character:deleted', id);
    appEvents.emit('characters:changed', this.all);
    return true;
  }

  generateId(): string {
    return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const characterStore = new CharacterStore();

// ===== SCENARIO STORE =====

class ScenarioStore {
  private _scenarios: Map<string, Scenario> = new Map();
  private _initialized = false;

  async init() {
    if (this._initialized) return;
    const scenarios = await getAllScenarios();
    scenarios.forEach(s => this._scenarios.set(s.id, s));
    this._initialized = true;
    appEvents.emit('scenarios:loaded', this.all);
  }

  get all(): Scenario[] {
    return Array.from(this._scenarios.values()).sort(
      (a, b) => (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt)
    );
  }

  get active(): Scenario | undefined {
    return this.all.find(s => s.isActive);
  }

  get branches(): Scenario[] {
    return this.all.filter(s => s.parentId);
  }

  get(id: string): Scenario | undefined {
    return this._scenarios.get(id);
  }

  getChildren(parentId: string): Scenario[] {
    return this.all.filter(s => s.parentId === parentId);
  }

  async create(
    data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt' | 'summary' | 'isActive'>
  ): Promise<Scenario> {
    const now = Date.now();
    const newScenario: Scenario = {
      ...data,
      id: this.generateId(),
      summary: '',
      isActive: false,
      createdAt: now,
      updatedAt: now
    };

    await saveScenario(newScenario);
    this._scenarios.set(newScenario.id, newScenario);
    appEvents.emit('scenario:created', newScenario);
    appEvents.emit('scenarios:changed', this.all);
    return newScenario;
  }

  async branch(scenarioId: string, fromMessageId?: string): Promise<Scenario | undefined> {
    const original = this._scenarios.get(scenarioId);
    if (!original) return undefined;

    const branchCount = this.getChildren(scenarioId).length;
    const newName = `${original.name}-${branchCount + 2}`;

    const now = Date.now();
    const branched: Scenario = {
      ...original,
      id: this.generateId(),
      name: newName,
      parentId: scenarioId,
      isActive: false,
      summary: original.summary,
      createdAt: now,
      updatedAt: now
    };

    await saveScenario(branched);
    this._scenarios.set(branched.id, branched);

    // Copy messages up to the branch point
    if (fromMessageId) {
      const messages = await getMessagesForScenario(scenarioId, 1000);
      const db = await import('../core/storage.js');
      const { getDB } = db;
      const database = await getDB();
      
      for (const msg of messages.reverse()) {
        const newMsg: Message = {
          ...msg,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          scenarioId: branched.id,
          parentId: msg.id
        };
        await database.put('messages', newMsg);
        
        if (msg.id === fromMessageId) break;
      }
    }

    appEvents.emit('scenario:branched', { original: scenarioId, branched: branched.id });
    appEvents.emit('scenarios:changed', this.all);
    return branched;
  }

  async activate(id: string): Promise<Scenario | undefined> {
    const target = this._scenarios.get(id);
    if (!target) return undefined;

    // Deactivate all others
    for (const [sid, scenario] of this._scenarios) {
      if (sid !== id && scenario.isActive) {
        scenario.isActive = false;
        await saveScenario(scenario);
        this._scenarios.set(sid, scenario);
      }
    }

    target.isActive = true;
    await saveScenario(target);
    this._scenarios.set(id, target);

    appState.currentScenarioId = id;
    appEvents.emit('scenario:activated', target);
    appEvents.emit('scenarios:changed', this.all);
    return target;
  }

  async update(id: string, updates: Partial<Scenario>): Promise<Scenario | undefined> {
    const scenario = this._scenarios.get(id);
    if (!scenario) return undefined;

    const updated = { ...scenario, ...updates, updatedAt: Date.now() };
    await saveScenario(updated);
    this._scenarios.set(id, updated);
    appEvents.emit('scenario:updated', updated);
    appEvents.emit('scenarios:changed', this.all);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const scenario = this._scenarios.get(id);
    if (!scenario) return false;

    const db = await import('../core/storage.js');
    const { getDB } = db;
    const database = await getDB();

    // Delete all messages
    const messages = await getMessagesForScenario(id, 10000);
    for (const msg of messages) {
      await database.delete('messages', msg.id);
    }

    // Delete relationships
    await database.delete('relationships', id);

    // Delete memories
    const allMemories = await database.getAllFromIndex('memories', 'by-scenario', id);
    for (const mem of allMemories) {
      await database.delete('memories', [mem.characterId, mem.scenarioId]);
    }

    // Delete scenario
    await database.delete('scenarios', id);

    this._scenarios.delete(id);
    appEvents.emit('scenario:deleted', id);
    appEvents.emit('scenarios:changed', this.all);
    return true;
  }

  generateId(): string {
    return `scen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const scenarioStore = new ScenarioStore();

// ===== CHAT STORE =====

class ChatStore {
  private _messages: Map<string, Message[]> = new Map(); // scenarioId -> messages
  private _streaming: Map<string, boolean> = new Map(); // scenarioId -> isStreaming

  async getMessages(scenarioId: string, limit = 100): Promise<Message[]> {
    if (!this._messages.has(scenarioId)) {
      const msgs = await getMessagesForScenario(scenarioId, limit);
      this._messages.set(scenarioId, msgs.reverse());
    }
    return this._messages.get(scenarioId) || [];
  }

  async addMessage(
    scenarioId: string,
    data: Omit<Message, 'id' | 'timestamp' | 'scenarioId'>
  ): Promise<Message> {
    const now = Date.now();
    const message: Message = {
      ...data,
      id: this.generateId(),
      scenarioId,
      timestamp: now
    };

    await saveMessage(message);

    // Update cache
    const cached = this._messages.get(scenarioId) || [];
    cached.push(message);
    this._messages.set(scenarioId, cached);

    // Update scenario's last message time
    const scenario = scenarioStore.get(scenarioId);
    if (scenario) {
      scenario.lastMessageAt = now;
      await saveScenario(scenario);
    }

    appEvents.emit('message:added', message);
    appEvents.emit('messages:changed', { scenarioId, messages: cached });
    return message;
  }

  async regenerate(messageId: string): Promise<Message | undefined> {
    const messages = Array.from(this._messages.values()).flat();
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return undefined;

    // Mark for regeneration
    appEvents.emit('message:regenerate', msg);
    return msg;
  }

  async branchFrom(messageId: string): Promise<Scenario | undefined> {
    const messages = Array.from(this._messages.values()).flat();
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return undefined;

    return scenarioStore.branch(msg.scenarioId, messageId);
  }

  setStreaming(scenarioId: string, isStreaming: boolean) {
    this._streaming.set(scenarioId, isStreaming);
    appEvents.emit('streaming:changed', { scenarioId, isStreaming });
  }

  isStreaming(scenarioId: string): boolean {
    return this._streaming.get(scenarioId) || false;
  }

  generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const chatStore = new ChatStore();

// ===== MEMORY STORE =====

class MemoryStore {
  private _cache: Map<string, Memory> = new Map(); // "charId:scenarioId" -> memory

  async get(characterId: string, scenarioId: string): Promise<Memory | undefined> {
    const key = `${characterId}:${scenarioId}`;
    if (!this._cache.has(key)) {
      const mem = await getMemory(characterId, scenarioId);
      if (mem) this._cache.set(key, mem);
    }
    return this._cache.get(key);
  }

  async update(characterId: string, scenarioId: string, updates: Partial<Memory>): Promise<Memory> {
    const key = `${characterId}:${scenarioId}`;
    const existing = await this.get(characterId, scenarioId);
    
    const memory: Memory = {
      characterId,
      scenarioId,
      summary: updates.summary || existing?.summary || '',
      privateKnowledge: updates.privateKnowledge || existing?.privateKnowledge || [],
      witnessedMessageIds: updates.witnessedMessageIds || existing?.witnessedMessageIds || [],
      lastUpdated: Date.now()
    };

    await saveMemory(memory);
    this._cache.set(key, memory);
    appEvents.emit('memory:updated', memory);
    return memory;
  }

  async addWitnessedMessage(characterId: string, scenarioId: string, messageId: string) {
    const memory = await this.get(characterId, scenarioId);
    const witnessed = new Set(memory?.witnessedMessageIds || []);
    witnessed.add(messageId);
    
    await this.update(characterId, scenarioId, {
      witnessedMessageIds: Array.from(witnessed)
    });
  }
}

export const memoryStore = new MemoryStore();

// ===== RELATIONSHIP STORE =====

class RelationshipStore {
  private _cache: Map<string, RelationshipMatrix> = new Map();

  async get(scenarioId: string): Promise<RelationshipMatrix> {
    if (!this._cache.has(scenarioId)) {
      const matrix = await getRelationshipMatrix(scenarioId);
      if (matrix) {
        this._cache.set(scenarioId, matrix);
      } else {
        // Create empty matrix
        const empty: RelationshipMatrix = {
          scenarioId,
          matrix: {},
          updatedAt: Date.now()
        };
        this._cache.set(scenarioId, empty);
      }
    }
    return this._cache.get(scenarioId)!;
  }

  async updateRelationship(
    scenarioId: string,
    fromId: string,
    toId: string,
    state: Partial<RelationshipState>
  ): Promise<RelationshipMatrix> {
    const matrix = await this.get(scenarioId);
    const key = `${fromId}→${toId}`;
    
    const existing = matrix.matrix[key] || {
      mood: 'neutral',
      intensity: 0.5,
      reason: '',
      history: []
    };

    matrix.matrix[key] = {
      ...existing,
      ...state,
      history: [
        ...existing.history,
        ...(state.history || [{
          timestamp: Date.now(),
          change: state.mood || state.reason || 'updated',
          triggerMessageId: undefined
        }])
      ]
    };

    matrix.updatedAt = Date.now();
    await saveRelationshipMatrix(matrix);
    this._cache.set(scenarioId, matrix);
    
    appEvents.emit('relationship:updated', { scenarioId, fromId, toId, state: matrix.matrix[key] });
    return matrix;
  }

  getMood(scenarioId: string, fromId: string, toId: string): string {
    const matrix = this._cache.get(scenarioId);
    if (!matrix) return 'neutral';
    return matrix.matrix[`${fromId}→${toId}`]?.mood || 'neutral';
  }
}

export const relationshipStore = new RelationshipStore();

// ===== PROVIDER STORE =====

class ProviderStore {
  private _providers: Map<string, Provider> = new Map();
  private _initialized = false;

  async init() {
    if (this._initialized) return;
    const providers = await getAllProviders();
    providers.forEach(p => this._providers.set(p.id, p));
    this._initialized = true;
    appEvents.emit('providers:loaded', this.all);
  }

  get all(): Provider[] {
    return Array.from(this._providers.values());
  }

  get default(): Provider | undefined {
    return this.all.find(p => p.isDefault);
  }

  get(id: string): Provider | undefined {
    return this._providers.get(id);
  }

  async add(provider: Omit<Provider, 'id'>): Promise<Provider> {
    const newProvider: Provider = {
      ...provider,
      id: `prov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    const db = await import('../core/storage.js');
    await db.saveProvider(newProvider);
    this._providers.set(newProvider.id, newProvider);
    
    appEvents.emit('provider:added', newProvider);
    return newProvider;
  }

  async setDefault(id: string): Promise<void> {
    for (const [pid, provider] of this._providers) {
      if (pid === id) {
        provider.isDefault = true;
      } else if (provider.isDefault) {
        provider.isDefault = false;
      }
      const db = await import('../core/storage.js');
      await db.saveProvider(provider);
    }
    appEvents.emit('providers:changed', this.all);
  }
}

export const providerStore = new ProviderStore();

// ===== SETTINGS STORE =====

const DEFAULT_SETTINGS: GlobalSettings = {
  theme: 'dark',
  language: 'en',
  defaultProvider: 'pollinations-p',
  defaultCharacterModel: 'llama-scout',
  defaultControllerModel: 'llama-scout',
  defaultImageModel: 'zimage',
  defaultVoiceModel: 'qwen-tts-flash',
  autoSaveInterval: 30000,
  maxCharactersPerScenario: 11,
  debugMode: false
};

class SettingsStore {
  private _settings: Partial<GlobalSettings> = {};
  private _initialized = false;

  async init() {
    if (this._initialized) return;
    
    const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof GlobalSettings>;
    for (const key of keys) {
      const value = await getSetting(key);
      if (value !== undefined) {
        (this._settings as any)[key] = value;
      }
    }
    
    this._initialized = true;
    appEvents.emit('settings:loaded', this.all);
  }

  get all(): GlobalSettings {
    return { ...DEFAULT_SETTINGS, ...this._settings };
  }

  get<K extends keyof GlobalSettings>(key: K): GlobalSettings[K] {
    return (this._settings[key] ?? DEFAULT_SETTINGS[key]) as GlobalSettings[K];
  }

  async set<K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]): Promise<void> {
    (this._settings as any)[key] = value;
    await setSetting(key, value);
    appEvents.emit('settings:changed', { key, value, settings: this.all });
  }

  async reset(): Promise<void> {
    this._settings = {};
    const keys = Object.keys(DEFAULT_SETTINGS);
    for (const key of keys) {
      await setSetting(key, undefined);
    }
    appEvents.emit('settings:reset', this.all);
  }
}

export const settingsStore = new SettingsStore();

// ===== APP STATE =====

export const appState: AppState = {
  sidePanel: {
    isOpen: false,
    activeTab: 'next'
  },
  isAutoScenarioRunning: false,
  selectedCharacters: [],
  pendingTurnQueue: []
};

// ===== INITIALIZE ALL STORES =====

export async function initializeStores(): Promise<void> {
  await Promise.all([
    characterStore.init(),
    scenarioStore.init(),
    providerStore.init(),
    settingsStore.init()
  ]);
  appEvents.emit('stores:ready');
}
