import {
  getDB, getAllScenarios, getScenario, saveScenario,
  getMessagesForScenario, saveMessage as dbSaveMessage
} from '../core/storage.js';
import { Scenario, Message, ScenarioSettings } from '../types/index.js';
import { appEvents } from './index.js';
import { TurnQueueManager } from '../services/turnQueue.js';
import { characterStore } from './CharacterStore.js';

class ScenarioStore {
  private scenarios: Map<string, Scenario> = new Map();
  private currentScenario: Scenario | null = null;
  private turnQueueManager: TurnQueueManager | null = null;
  private isLoaded = false;

  async load(): Promise<void> {
    if (this.isLoaded) return;
    const scenList = await getAllScenarios();
    scenList.forEach(s => this.scenarios.set(s.id, s));
    this.isLoaded = true;
    appEvents.emit('scenarios:loaded', this.getAll());
  }

  getAll(): Scenario[] {
    return Array.from(this.scenarios.values());
  }

  get(id: string): Scenario | undefined {
    return this.scenarios.get(id);
  }

  async create(data: {
    name: string;
    lore: string;
    characterIds: string[];
    settings?: Partial<ScenarioSettings>;
  }): Promise<Scenario> {
    const scenario: Scenario = {
      id: `scen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      lore: data.lore,
      characterIds: data.characterIds,
      settings: {
        aiKnowsUser: data.settings?.aiKnowsUser ?? false,
        autoScenario: data.settings?.autoScenario ?? false,
        autoImageGeneration: data.settings?.autoImageGeneration ?? false,
        controllerCheckFrequency: data.settings?.controllerCheckFrequency ?? 10,
        shortTermMemorySize: data.settings?.shortTermMemorySize ?? 30,
        privateChannels: data.settings?.privateChannels ?? []
      },
      summary: '',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveScenario(scenario);
    this.scenarios.set(scenario.id, scenario);
    appEvents.emit('scenario:created', scenario);
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
    appEvents.emit('scenario:updated', updated);
    return updated;
  }

  async setActive(id: string): Promise<Scenario | undefined> {
    // Deactivate current
    if (this.currentScenario) {
      this.currentScenario.isActive = false;
      await saveScenario(this.currentScenario);
    }

    const scenario = this.scenarios.get(id);
    if (scenario) {
      scenario.isActive = true;
      scenario.lastMessageAt = Date.now();
      await saveScenario(scenario);
      this.currentScenario = scenario;

      // Initialize turn queue
      const characters = scenario.characterIds
        .map(id => characterStore.get(id))
        .filter(Boolean) as any[];
      this.turnQueueManager = new TurnQueueManager(scenario, characters);

      appEvents.emit('scenario:activated', scenario);
    }
    return scenario;
  }

  async delete(id: string): Promise<void> {
    const scenario = this.scenarios.get(id);
    if (scenario?.isActive) {
      this.currentScenario = null;
      this.turnQueueManager = null;
    }
    this.scenarios.delete(id);
    // Note: Don't delete messages - keep for history
    appEvents.emit('scenario:deleted', id);
  }

  async branch(id: string, newName?: string): Promise<Scenario | undefined> {
    const original = this.scenarios.get(id);
    if (!original) return undefined;

    // Copy scenario
    const branched: Scenario = {
      ...original,
      id: `scen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newName || `${original.name}-2`,
      parentId: original.id,
      summary: original.summary,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveScenario(branched);
    this.scenarios.set(branched.id, branched);
    appEvents.emit('scenario:branched', { original, branched });
    return branched;
  }

  // === MESSAGE HANDLING ===

  async getMessages(scenarioId: string, limit = 100): Promise<Message[]> {
    return getMessagesForScenario(scenarioId, limit);
  }

  async addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const msg: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    await dbSaveMessage(msg);
    
    // Update scenario last message time
    if (this.currentScenario?.id === message.scenarioId) {
      this.currentScenario.lastMessageAt = msg.timestamp;
      await saveScenario(this.currentScenario);
    }

    appEvents.emit('message:added', msg);
    return msg;
  }

  // === AUTO-SCENARIO ===

  startAutoScenario(): void {
    if (this.turnQueueManager && this.currentScenario) {
      this.turnQueueManager.resume();
      appEvents.emit('auto-scenario:started');
    }
  }

  pauseAutoScenario(): void {
    if (this.turnQueueManager) {
      this.turnQueueManager.pause();
      appEvents.emit('auto-scenario:paused');
    }
  }

  toggleAutoScenario(): void {
    if (this.turnQueueManager) {
      this.turnQueueManager.resume();
    }
  }

  // === USER MESSAGES ===

  async sendUserMessage(
    content: string,
    dialogue: string,
    actions: string[] = []
  ): Promise<void> {
    if (!this.currentScenario) return;

    const userChar = await characterStore.getUserCharacter();
    if (!userChar) {
      appEvents.emit('toast', { message: 'No user character set', type: 'warning' });
      return;
    }

    const message = await this.addMessage({
      scenarioId: this.currentScenario.id,
      characterId: userChar.id,
      content,
      dialogue,
      actions
    });

    // Queue character responses
    this.turnQueueManager?.addToQueue({
      id: `turn_${Date.now()}`,
      type: 'user',
      characterId: userChar.id,
      content,
      dialogue,
      actions,
      timestamp: Date.now()
    });
  }

  // === EXPORT/IMPORT ===

  async exportScenario(id: string): Promise<any> {
    const scenario = this.scenarios.get(id);
    if (!scenario) return null;

    const messages = await this.getMessages(id);
    const characters = scenario.characterIds
      .map(cid => characterStore.get(cid))
      .filter(Boolean);

    return {
      version: '1.0',
      exportedAt: Date.now(),
      scenario,
      messages,
      characters
    };
  }

  async importScenario(data: any): Promise<Scenario | undefined> {
    const { scenario, messages, characters } = data;

    // Import characters first
    if (characters) {
      await characterStore.importCharacters(characters);
    }

    // Create scenario with new ID
    const newScenario = await this.create({
      name: scenario.name,
      lore: scenario.lore,
      characterIds: scenario.characterIds,
      settings: scenario.settings
    });

    // Import messages
    for (const msg of messages || []) {
      await dbSaveMessage({
        ...msg,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scenarioId: newScenario.id
      });
    }

    return newScenario;
  }

  clearCache(): void {
    this.scenarios.clear();
    this.isLoaded = false;
    this.currentScenario = null;
  }
}

export const scenarioStore = new ScenarioStore();
