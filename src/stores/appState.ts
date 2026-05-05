// ===== APP STATE & EVENTS =====
import { Character, Scenario } from '../types/index.js';

export class EventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(cb => {
      try { cb(data); } catch (e) { console.error(`Event handler error for ${event}:`, e); }
    });
  }

  once(event: string, callback: Function): void {
    const wrapped = (data: any) => { this.off(event, wrapped); callback(data); };
    this.on(event, wrapped);
  }
}

export const appEvents = new EventEmitter();

// ===== APP STATE MANAGER =====
class AppStateManager {
  private currentView: 'dashboard' | 'chat' | 'settings' = 'dashboard';
  private currentScenario: Scenario | null = null;
  private sidePanelOpen = false;
  private sidePanelTab: 'next' | 'details' | 'matrix' | 'memory' | 'debug' | 'characters' | 'settings' = 'next';
  private debugMode = false;

  setView(view: 'dashboard' | 'chat' | 'settings', scenario?: Scenario): void {
    this.currentView = view;
    if (scenario) this.currentScenario = scenario;
    appEvents.emit('view:changed', { view, scenario });
  }

  getView(): string { return this.currentView; }
  getCurrentScenario(): Scenario | null { return this.currentScenario; }

  toggleSidePanel(tab?: typeof this.sidePanelTab): void {
    if (tab) { this.sidePanelTab = tab; this.sidePanelOpen = true; } 
    else { this.sidePanelOpen = !this.sidePanelOpen; }
    appEvents.emit('sidepanel:changed', { isOpen: this.sidePanelOpen, tab: this.sidePanelTab });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    appEvents.emit('sidepanel:changed', { isOpen: false, tab: this.sidePanelTab });
  }

  setSidePanelTab(tab: typeof this.sidePanelTab): void {
    this.sidePanelTab = tab;
    if (!this.sidePanelOpen) this.sidePanelOpen = true;
    appEvents.emit('sidepanel:changed', { isOpen: this.sidePanelOpen, tab });
  }

  isSidePanelOpen(): boolean { return this.sidePanelOpen; }
  getSidePanelTab(): string { return this.sidePanelTab; }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    appEvents.emit('debug:changed', enabled);
  }
  isDebugMode(): boolean { return this.debugMode; }
}

export const appState = new AppStateManager();
