import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Character, Scenario, Message, Memory, RelationshipMatrix,
  Provider, ExportData
} from '../types/index.js';
import { initializeProviders } from '../services/providers.js';

interface TheatroDB extends DBSchema {
  characters: { key: string; value: Character; indexes: { 'by-updated': number; 'by-is-user': number } };
  scenarios: { key: string; value: Scenario; indexes: { 'by-updated': number; 'by-parent': string } };
  messages: { key: string; value: Message; indexes: { 'by-scenario': string; 'by-scenario-time': [string, number]; 'by-character': string } };
  memories: { key: [string, string]; value: Memory; indexes: { 'by-scenario': string } };
  relationships: { key: string; value: RelationshipMatrix; indexes: { 'by-updated': number } };
  providers: { key: string; value: Provider; indexes: { 'by-default': number } };
  settings: { key: string; value: any };
}

const DB_NAME = 'theatro-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TheatroDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<TheatroDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TheatroDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('characters')) {
          const charStore = db.createObjectStore('characters', { keyPath: 'id' });
          charStore.createIndex('by-updated', 'updatedAt');
          charStore.createIndex('by-is-user', 'isUser');
        }
        if (!db.objectStoreNames.contains('scenarios')) {
          const scenStore = db.createObjectStore('scenarios', { keyPath: 'id' });
          scenStore.createIndex('by-updated', 'updatedAt');
          scenStore.createIndex('by-parent', 'parentId');
        }
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('by-scenario', 'scenarioId');
          msgStore.createIndex('by-scenario-time', ['scenarioId', 'timestamp']);
          msgStore.createIndex('by-character', 'characterId');
        }
        if (!db.objectStoreNames.contains('memories')) {
          const memStore = db.createObjectStore('memories', { keyPath: ['characterId', 'scenarioId'] });
          memStore.createIndex('by-scenario', 'scenarioId');
        }
        if (!db.objectStoreNames.contains('relationships')) {
          const relStore = db.createObjectStore('relationships', { keyPath: 'scenarioId' });
          relStore.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('providers')) {
          const provStore = db.createObjectStore('providers', { keyPath: 'id' });
          provStore.createIndex('by-default', 'isDefault');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      }
    });
  }
  return dbPromise;
}

export async function getAllCharacters(): Promise<Character[]> {
  const db = await getDB();
  return db.getAllFromIndex('characters', 'by-updated');
}

export async function getCharacter(id: string): Promise<Character | undefined> {
  const db = await getDB();
  return db.get('characters', id);
}

export async function getUserCharacter(): Promise<Character | undefined> {
  const db = await getDB();
  const chars = await db.getAllFromIndex('characters', 'by-is-user', 1);
  return chars[0];
}

export async function saveCharacter(character: Character): Promise<void> {
  const db = await getDB();
  character.updatedAt = Date.now();
  await db.put('characters', character);
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('characters', id);
}

export async function getAllScenarios(): Promise<Scenario[]> {
  const db = await getDB();
  return db.getAllFromIndex('scenarios', 'by-updated');
}

export async function getScenario(id: string): Promise<Scenario | undefined> {
  const db = await getDB();
  return db.get('scenarios', id);
}

export async function saveScenario(scenario: Scenario): Promise<void> {
  const db = await getDB();
  scenario.updatedAt = Date.now();
  await db.put('scenarios', scenario);
}

/**
 * Delete a scenario and all its associated messages, memories, and relationships.
 */
export async function deleteScenario(id: string): Promise<void> {
  const db = await getDB();
  
  // Delete all messages for this scenario
  const messageTx = db.transaction('messages', 'readwrite');
  const messageIndex = messageTx.store.index('by-scenario');
  let cursor = await messageIndex.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await messageTx.done;
  
  // Delete all memories for this scenario
  const memoryTx = db.transaction('memories', 'readwrite');
  const memoryIndex = memoryTx.store.index('by-scenario');
  let memCursor = await memoryIndex.openCursor(IDBKeyRange.only(id));
  while (memCursor) {
    await memCursor.delete();
    memCursor = await memCursor.continue();
  }
  await memoryTx.done;
  
  // Delete relationship matrix for this scenario
  await db.delete('relationships', id);
  
  // Delete the scenario itself
  await db.delete('scenarios', id);
}

export async function getMessagesForScenario(scenarioId: string, limit = 100): Promise<Message[]> {
  const db = await getDB();
  const tx = db.transaction('messages', 'readonly');
  const index = tx.store.index('by-scenario-time');
  const range = IDBKeyRange.bound([scenarioId, 0], [scenarioId, Infinity]);
  const msgs = await index.getAll(range, limit);
  return msgs.reverse();
}

export async function saveMessage(message: Message): Promise<void> {
  const db = await getDB();
  await db.put('messages', message);
}

export async function getMemory(characterId: string, scenarioId: string): Promise<Memory | undefined> {
  const db = await getDB();
  return db.get('memories', [characterId, scenarioId]);
}

export async function saveMemory(memory: Memory): Promise<void> {
  const db = await getDB();
  memory.lastUpdated = Date.now();
  await db.put('memories', memory);
}

export async function getRelationshipMatrix(scenarioId: string): Promise<RelationshipMatrix | undefined> {
  const db = await getDB();
  return db.get('relationships', scenarioId);
}

export async function saveRelationshipMatrix(matrix: RelationshipMatrix): Promise<void> {
  const db = await getDB();
  matrix.updatedAt = Date.now();
  await db.put('relationships', matrix);
}

export async function getAllProviders(): Promise<Provider[]> {
  const db = await getDB();
  return db.getAll('providers');
}

export async function getDefaultProvider(): Promise<Provider | undefined> {
  const db = await getDB();
  const defaults = await db.getAllFromIndex('providers', 'by-default', 1);
  return defaults[0];
}

export async function saveProvider(provider: Provider): Promise<void> {
  const db = await getDB();
  await db.put('providers', provider);
}

export async function getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
  const db = await getDB();
  const value = await db.get('settings', key);
  return value !== undefined ? value : defaultValue;
}

export async function setSetting(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('settings', value, key);
}

export async function initializeDefaults(): Promise<void> {
  const db = await getDB();
  const existingProviders = await db.getAll('providers');
  
  if (existingProviders.length === 0) {
    // Initialize providers with embedded key
    await initializeProviders();
  }

  // Initialize default settings if not present
  const hasTheme = await db.get('settings', 'theme');
  if (!hasTheme) {
    await db.put('settings', 'dark', 'theme');
  }
}

/**
 * Export all data from the database as an ExportData object.
 * This includes characters, scenarios, messages, memories, relationships, and providers.
 */
export async function exportAllData(): Promise<ExportData> {
  const db = await getDB();
  
  const [characters, scenarios, messages, memories, relationships, providers] = await Promise.all([
    db.getAll('characters'),
    db.getAll('scenarios'),
    db.getAll('messages'),
    db.getAll('memories'),
    db.getAll('relationships'),
    db.getAll('providers')
  ]);
  
  // Get all settings as an object
  const settings: Record<string, any> = {};
  const settingsTx = db.transaction('settings', 'readonly');
  const settingsCursor = await settingsTx.store.openCursor();
  while (settingsCursor) {
    settings[settingsCursor.key as string] = settingsCursor.value;
    await settingsCursor.continue();
  }
  await settingsTx.done;
  
  return {
    version: '1.0.0',
    exportedAt: Date.now(),
    characters,
    scenarios,
    messages,
    memories,
    relationships,
    providers,
    settings
  };
}

/**
 * Import data from an ExportData object into the database.
 * This merges with existing data, preferring imported data on conflict.
 */
export async function importAllData(data: ExportData): Promise<void> {
  const db = await getDB();
  
  // Import characters
  if (data.characters?.length > 0) {
    const tx = db.transaction('characters', 'readwrite');
    for (const char of data.characters) {
      char.updatedAt = Date.now();
      await tx.store.put(char);
    }
    await tx.done;
  }
  
  // Import scenarios
  if (data.scenarios?.length > 0) {
    const tx = db.transaction('scenarios', 'readwrite');
    for (const scenario of data.scenarios) {
      scenario.updatedAt = Date.now();
      await tx.store.put(scenario);
    }
    await tx.done;
  }
  
  // Import messages
  if (data.messages?.length > 0) {
    const tx = db.transaction('messages', 'readwrite');
    for (const msg of data.messages) {
      await tx.store.put(msg);
    }
    await tx.done;
  }
  
  // Import memories
  if (data.memories?.length > 0) {
    const tx = db.transaction('memories', 'readwrite');
    for (const mem of data.memories) {
      mem.lastUpdated = Date.now();
      await tx.store.put(mem);
    }
    await tx.done;
  }
  
  // Import relationships
  if (data.relationships?.length > 0) {
    const tx = db.transaction('relationships', 'readwrite');
    for (const rel of data.relationships) {
      rel.updatedAt = Date.now();
      await tx.store.put(rel);
    }
    await tx.done;
  }
  
  // Import providers (skip default pollinations to preserve embedded key)
  if (data.providers?.length > 0) {
    const tx = db.transaction('providers', 'readwrite');
    for (const provider of data.providers) {
      // Skip Pollinations provider to preserve embedded key
      if (provider.type !== 'pollinations') {
        await tx.store.put(provider);
      }
    }
    await tx.done;
  }
  
  // Import settings
  if (data.settings) {
    const tx = db.transaction('settings', 'readwrite');
    for (const [key, value] of Object.entries(data.settings)) {
      await tx.store.put(value, key);
    }
    await tx.done;
  }
}
