// ===== SCENARIO STORE - Enhanced with missing methods =====
import {
  getAllScenarios,
  getScenario,
  saveScenario,
  deleteScenario,
  getMessagesForScenario,
  saveMessage,
  exportAllData,
  importAllData
} from '../core/storage.js';
import { Scenario, ScenarioSettings, Message, Character } from '../types/index.js';
import { appEvents } from './index.js';
import { chatStore } from './ChatStore.js';
import { characterStore } from './CharacterStore.js';

class ScenarioStore {
  private scenarios: Map<string, Scenario> = new Map();
  private currentScenario: Scenario | null = null;
  private isLoaded = false;

  async load(): Promise<void> {
    if (this.isLoaded) return;
    const scenList = await getAllScenarios();
    scenList.forEach(s => this.scenarios.set(s.id, s));
    this.isLoaded = true;
    appEvents.emit('scenarios:loaded', this.getAll());
  }

  getAll(): Scenario[] {
    return Array.from(this.scenarios.values()).sort((a, b) => 
      (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt)
    );
  }

  getMessages(scenarioId: string): Promise<Message[]> {
    return getMessagesForScenario(scenarioId, 1000);
  }

  get(id: string): Scenario | undefined {
    return this.scenarios.get(id);
  }

  get current(): Scenario | null {
    return this.currentScenario;
  }

  async create(data: {
    name: string;
    lore: string;
    characterIds: string[];
    settings?: Partial<ScenarioSettings>;
    parentId?: string;
  }): Promise<Scenario> {
    const now = Date.now();
    const scenario: Scenario = {
      id: `scen_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      lore: data.lore,
      characterIds: data.characterIds,
      settings: {
        aiKnowsUser: data.settings?.aiKnowsUser ?? false,
        autoScenario: data.settings?.autoScenario ?? false,
        autoImageGeneration: data.settings?.autoImageGeneration ?? false,
        controllerCheckFrequency: data.settings?.controllerCheckFrequency ?? 10,
        shortTermMemorySize: data.settings?.shortTermMemorySize ?? 30,
        privateChannels: data.settings?.privateChannels ?? [],
        whatNext: data.settings?.whatNext || '',
        briefDetails: data.settings?.briefDetails || ''
      },
      parentId: data.parentId,
      summary: '',
      isActive: false,
      createdAt: now,
      updatedAt: now
    };

    await saveScenario(scenario);
    this.scenarios.set(scenario.id, scenario);
    appEvents.emit('scenario:created', scenario);
    appEvents.emit('scenarios:changed', this.getAll());
    return scenario;
  }

  async update(id: string, data: Partial<Scenario>): Promise<Scenario | undefined> {
    const existing = this.scenarios.get(id);
    if (!existing) return undefined;

    const updated: Scenario = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: Date.now()
    };

    await saveScenario(updated);
    this.scenarios.set(id, updated);

    if (this.currentScenario?.id === id) {
      this.currentScenario = updated;
    }

    appEvents.emit('scenario:updated', updated);
    appEvents.emit('scenarios:changed', this.getAll());
    return updated;
  }

  async updateSettings(
    id: string, 
    settings: Partial<Scenario['settings']>
  ): Promise<Scenario | undefined> {
    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;

    return this.update(id, {
      settings: { ...scenario.settings, ...settings }
    });
  }

  async activate(id: string): Promise<Scenario | undefined> {
    // Deactivate current
    if (this.currentScenario) {
      await this.update(this.currentScenario.id, { isActive: false });
    }

    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;

    // Activate new
    const updated = await this.update(id, { 
      isActive: true, 
      lastMessageAt: Date.now() 
    });

    if (updated) {
      this.currentScenario = updated;

      // Load characters and initialize turn queue
      const characters = scenario.characterIds
        .map(cid => characterStore.get(cid))
        .filter((c): c is Character => c !== undefined);

      chatStore.initializeTurnQueue(updated, characters);

      appEvents.emit('scenario:activated', updated);
      appEvents.emit('navigate:chat', updated);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const scenario = this.scenarios.get(id);
    if (!scenario) return;

    if (scenario.id === this.currentScenario?.id) {
      this.currentScenario = null;
      chatStore.pauseAutoScenario(id);
    }

    await deleteScenario(id);
    this.scenarios.delete(id);

    appEvents.emit('scenario:deleted', id);
    appEvents.emit('scenarios:changed', this.getAll());
  }

  // ===== BRANCHING =====

  async branch(
    scenarioId: string, 
    messageId?: string,
    newName?: string
  ): Promise<Scenario | undefined> {
    const original = this.scenarios.get(scenarioId);
    if (!original) return undefined;

    // Get messages up to branch point
    const messages = await getMessagesForScenario(scenarioId, 1000);
    
    // Create branched scenario
    const branched = await this.create({
      name: newName || `${original.name}-2`,
      lore: original.lore,
      characterIds: [...original.characterIds],
      settings: { ...original.settings },
      parentId: original.id
    });

    // Copy summary
    await this.update(branched.id, { 
      summary: original.summary + '\n[BRANCHED FROM ORIGINAL]' 
    });

    // Copy messages up to branch point (if messageId provided)
    // Otherwise copy all messages
    const messagesToCopy = messageId 
      ? messages.filter(m => m.timestamp <= (messages.find(m => m.id === messageId)?.timestamp || 0))
      : messages;

    for (const msg of messagesToCopy.reverse()) {
      await saveMessage({
        ...msg,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scenarioId: branched.id
      });
    }

    appEvents.emit('scenario:branched', { original, branched });
    return branched;
  }

  // ===== IMPORT/EXPORT =====

  async exportScenario(id: string): Promise<unknown | null> {
    const scenario = this.scenarios.get(id);
    if (!scenario) return null;

    const messages = await getMessagesForScenario(id, 10000);
    const characters = scenario.characterIds
      .map(cid => characterStore.get(cid))
      .filter((c): c is Character => c !== undefined);

    return {
      version: '1.0',
      exportedAt: Date.now(),
      type: 'scenario-export',
      scenario,
      messages,
      characters
    };
  }

  async exportAll(): Promise<unknown> {
    return exportAllData();
  }

  async importScenario(data: unknown): Promise<Scenario | undefined> {
    const importData = data as { scenario?: Scenario; messages?: Message[]; characters?: Character[] };
    if (!importData.scenario) return undefined;

    const { scenario, messages, characters } = importData;

    // Create new scenario (new ID)
    const imported = await this.create({
      name: `${scenario.name} (Imported)`,
      lore: scenario.lore,
      characterIds: [], // Will be populated after character import
      settings: scenario.settings
    });

    // Update with summary
    await this.update(imported.id, { summary: scenario.summary || '' });

    // Import messages
    if (messages && Array.isArray(messages)) {
      for (const msg of messages.reverse()) {
        await saveMessage({
          ...msg,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          scenarioId: imported.id
        });
      }
    }

    appEvents.emit('scenario:imported', imported);
    return imported;
  }

  async importAll(data: unknown): Promise<boolean> {
    try {
      await importAllData(data as {
        characters: Character[];
        scenarios: Scenario[];
        messages: Message[];
        memories: unknown[];
        relationships: unknown[];
        providers: unknown[];
        settings: Record<string, unknown>;
      });
      await this.load(); // Reload all scenarios
      await characterStore.load(); // Reload all characters
      appEvents.emit('data:imported');
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      appEvents.emit('toast', { 
        message: 'Import failed: ' + (error as Error).message, 
        type: 'error' 
      });
      return false;
    }
  }

  // ===== UTILITIES =====

  clear(): void {
    this.scenarios.clear();
    this.currentScenario = null;
    this.isLoaded = false;
  }

  toggleAutoScenario(): boolean {
    const scenario = this.currentScenario;
    if (!scenario) return false;
    
    const newState = !scenario.settings.autoScenario;
    this.update(scenario.id, {
      settings: { ...scenario.settings, autoScenario: newState }
    });
    return newState;
  }

  async sendUserMessage(content: string, dialogue: string, actions: string[]): Promise<void> {
    const scenario = this.currentScenario;
    if (!scenario) return;

    const userChar = await characterStore.getUserCharacter();
    if (!userChar) return;

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scenarioId: scenario.id,
      characterId: userChar.id,
      content,
      dialogue,
      actions,
      timestamp: Date.now()
    };

    await saveMessage(message);
    appEvents.emit('message:new', message);
  }
}

export const scenarioStore = new ScenarioStore();
