import { getAllProviders, saveProvider } from '../core/storage.js';
import { Provider } from '../types/index.js';
import { appEvents } from './appState.js';

class ProviderStore {
  private providers: Map<string, Provider> = new Map();
  private isLoaded = false;

  async load(): Promise<void> {
    if (this.isLoaded) return;
    const providers = await getAllProviders();
    providers.forEach(p => this.providers.set(p.id, p));
    this.isLoaded = true;
    appEvents.emit('providers:loaded', this.getAll());
  }

  getAll(): Provider[] {
    return Array.from(this.providers.values());
  }

  get(id: string): Provider | undefined {
    return this.providers.get(id);
  }

  async setAquaKey(key: string): Promise<void> {
    const aqua = this._findByType('aqua');
    if (!aqua) {
      console.warn('ProviderStore: No aqua-type provider found');
      return;
    }
    aqua.apiKey = key;
    await saveProvider(aqua);
    this.providers.set(aqua.id, aqua);
    appEvents.emit('provider:updated', aqua);
  }

  async removeAquaKey(): Promise<void> {
    const aqua = this._findByType('aqua');
    if (!aqua) {
      console.warn('ProviderStore: No aqua-type provider found');
      return;
    }
    delete aqua.apiKey;
    await saveProvider(aqua);
    this.providers.set(aqua.id, aqua);
    appEvents.emit('provider:updated', aqua);
  }

  async importProviders(providers: Provider[]): Promise<void> {
    for (const p of providers) {
      await saveProvider(p);
      this.providers.set(p.id, p);
    }
    appEvents.emit('providers:loaded', this.getAll());
  }

  clearCache(): void {
    this.providers.clear();
    this.isLoaded = false;
  }

  private _findByType(type: Provider['type']): Provider | undefined {
    for (const p of this.providers.values()) {
      if (p.type === type) return p;
    }
    return undefined;
  }
}

export const providerStore = new ProviderStore();