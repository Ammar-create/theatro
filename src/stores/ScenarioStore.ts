import { getAllScenarios, getScenario, saveScenario, getMessagesForScenario, saveMessage, getRelationshipMatrix, saveRelationshipMatrix } from '../core/storage.js';
import type { Scenario, Message, RelationshipMatrix, RelationshipState } from '../types/index.js';

export class ScenarioStore {
  async getAll(): Promise<Scenario[]> {
    return getAllScenarios();
  }

  async getById(id: string): Promise<Scenario | undefined> {
    return getScenario(id);
  }

  async create(data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Scenario> {
    const scenario: Scenario = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await saveScenario(scenario);
    
    // Initialize relationship matrix
    await this.initializeMatrix(scenario.id, scenario.characterIds);
    
    return scenario;
  }

  async addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const fullMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    await saveMessage(fullMessage);
    return fullMessage;
  }

  async getMessages(scenarioId: string, limit = 100): Promise<Message[]> {
    return getMessagesForScenario(scenarioId, limit);
  }

  async getMatrix(scenarioId: string): Promise<RelationshipMatrix | undefined> {
    return getRelationshipMatrix(scenarioId);
  }

  async updateRelationship(
    scenarioId: string, 
    fromId: string, 
    toId: string, 
    state: Partial<RelationshipState>
  ): Promise<void> {
    const matrix = await this.getMatrix(scenarioId);
    if (!matrix) return;

    const key = `${fromId}->${toId}`;
    const existing = matrix.matrix[key] || {
      mood: 'neutral',
      intensity: 0.5,
      reason: '',
      history: []
    };

    matrix.matrix[key] = {
      ...existing,
      ...state,
      history: [...existing.history, {
        timestamp: Date.now(),
        change: state.reason || 'Relationship updated'
      }]
    };

    await saveRelationshipMatrix(matrix);
  }

  private async initializeMatrix(scenarioId: string, characterIds: string[]): Promise<void> {
    const matrix: RelationshipMatrix = {
      scenarioId,
      matrix: {},
      updatedAt: Date.now()
    };

    // Initialize neutral relationships between all characters
    for (const fromId of characterIds) {
      for (const toId of characterIds) {
        if (fromId !== toId) {
          matrix.matrix[`${fromId}->${toId}`] = {
            mood: 'neutral',
            intensity: 0.5,
            reason: 'Initial meeting',
            history: [{
              timestamp: Date.now(),
              change: 'Characters first encountered each other'
            }]
          };
        }
      }
    }

    await saveRelationshipMatrix(matrix);
  }
}
