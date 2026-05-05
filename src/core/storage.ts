import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Character, Scenario, Message, Memory, RelationshipMatrix,
  Provider
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
