import { scenarioStore, characterStore, appEvents } from './index.js';

// Re-export stores
export { characterStore } from './CharacterStore.js';
export { scenarioStore } from './ScenarioStore.js';

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
  await characterStore.load();
  await scenarioStore.load();
}
