import { scenarioStore, characterStore, chatStore, appEvents } from './index.js';
import { getDB, initializeDefaults as dbInitDefaults } from '../core/storage.js';
import { Provider } from '../types/index.js';

// Re-export stores
export { characterStore } from './CharacterStore.js';
export { scenarioStore } from './ScenarioStore.js';
export { chatStore } from './ChatStore.js';

// App state management
class AppStateManager {
  private currentView: 'dashboard' | 'chat' | 'settings' = 'dashboard';
  private sidePanelOpen = false;
  private sidePanelTab: string = 'next';
  private debugMode = false;

  setView(view: 'dashboard' | 'chat' | 'settings'): void {
    this.currentView = view;
    appEvents.emit('view:changed', view);
  }

  getView(): string {
    return this.currentView;
  }

  toggleSidePanel(tab?: string): void {
    if (tab) {
      this.sidePanelTab = tab;
      this.sidePanelOpen = true;
    } else {
      this.sidePanelOpen = !this.sidePanelOpen;
    }
    appEvents.emit('sidepanel:changed', { 
      isOpen: this.sidePanelOpen, 
      tab: this.sidePanelTab 
    });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    appEvents.emit('sidepanel:changed', { isOpen: false, tab: this.sidePanelTab });
  }

  setSidePanelTab(tab: string): void {
    this.sidePanelTab = tab;
    if (!this.sidePanelOpen) {
      this.sidePanelOpen = true;
    }
    appEvents.emit('sidepanel:changed', { isOpen: this.sidePanelOpen, tab });
  }

  isSidePanelOpen(): boolean {
    return this.sidePanelOpen;
  }

  getSidePanelTab(): string {
    return this.sidePanelTab;
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    appEvents.emit('debug:changed', enabled);
  }

  isDebugMode(): boolean {
    return this.debugMode;
  }
}

export const appState = new AppStateManager();

export async function initializeStores(): Promise<void> {
  await dbInitDefaults();
  
  // Custom initialization for Pollinations with the new key
  const db = await getDB();
  const pollProvider: Provider = {
    id: 'pollinations-p',
    name: 'Pollinations',
    baseUrl: 'https://gen.pollinations.ai/v1',
    apiKey: 'pk_LUy70Tu8OwLI1HrU', // Updated publishable key
    isDefault: true,
    type: 'pollinations'
  };
  
  const aquaProvider: Provider = {
    id: 'aqua-a',
    name: 'Aqua AI',
    baseUrl: 'https://api.aquadevs.com/v1',
    isDefault: false,
    type: 'aqua'
  };

  await db.put('providers', pollProvider);
  await db.put('providers', aquaProvider);

  await characterStore.load();
  await scenarioStore.load();
}
