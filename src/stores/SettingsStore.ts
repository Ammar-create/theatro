import { getDB, getSetting, setSetting } from '../core/storage.js';
import { appEvents } from './appState.js';

interface SettingsCache {
  theme: string;
  controllerCheckFrequency: number;
  shortTermMemorySize: number;
  debugMode: boolean;
  defaultCharacterModel: string;
  defaultControllerModel: string;
}

const DEFAULT_SETTINGS: SettingsCache = {
  theme: 'dark',
  controllerCheckFrequency: 10,
  shortTermMemorySize: 30,
  debugMode: false,
  defaultCharacterModel: 'llama-scout',
  defaultControllerModel: 'llama-scout',
};

class SettingsStore {
  private cache: SettingsCache = { ...DEFAULT_SETTINGS };
  private isLoaded = false;

  async load(): Promise<void> {
    if (this.isLoaded) return;

    const keys = Object.keys(DEFAULT_SETTINGS) as (keyof SettingsCache)[];
    for (const key of keys) {
      const stored = await getSetting(key);
      if (stored !== undefined) {
        (this.cache as any)[key] = stored;
      }
    }

    this.isLoaded = true;
    appEvents.emit('settings:loaded', this.cache);
  }

  getAll(): Record<string, any> {
    return { ...this.cache };
  }

  async set(key: string, value: any): Promise<void> {
    await setSetting(key, value);
    (this.cache as any)[key] = value;
    appEvents.emit('setting:changed', { key, value });
  }

  clearCache(): void {
    this.cache = { ...DEFAULT_SETTINGS };
    this.isLoaded = false;
  }
}

export const settingsStore = new SettingsStore();