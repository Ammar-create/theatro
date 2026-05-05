import { initializeStores, appEvents } from '../stores/index.js';
import { Dashboard } from './Dashboard.js';
import { ChatView } from './ChatView.js';
import { SettingsView } from './SettingsView.js';
import type { Scenario } from '../types/index.js';

export class App {
  private container: HTMLElement;
  private dashboard: Dashboard | null = null;
  private chatView: ChatView | null = null;
  private settingsView: SettingsView | null = null;
  private currentView: 'dashboard' | 'chat' | 'settings' = 'dashboard';
  private toastContainer: HTMLElement | null = null;

  constructor() {
    const el = document.getElementById('app');
    if (!el) throw new Error('App container not found');
    this.container = el;
    this.createToastContainer();
  }

  private createToastContainer() {
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container';
    document.body.appendChild(this.toastContainer);
  }

  async init(): Promise<void> {
    await initializeStores();
    this.injectStyles();
    this.setupGlobalListeners();
    this.renderDashboard();
  }

  private injectStyles(): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/app.css';
    document.head.appendChild(link);
  }

  private setupGlobalListeners(): void {
    appEvents.on('navigate:chat', (scenario: Scenario) => {
      this.renderChat(scenario);
    });

    appEvents.on('navigate:dashboard', () => {
      this.renderDashboard();
    });

    appEvents.on('navigate:settings', () => {
      this.renderSettings();
    });

    appEvents.on('view:changed', ({ view }: { view: 'dashboard' | 'chat' | 'settings', scenario?: Scenario }) => {
      if (view === 'settings') this.renderSettings();
      if (view === 'dashboard') this.renderDashboard();
      if (view === 'chat' && view.scenario) this.renderChat(view.scenario);
    });

    appEvents.on('toast', ({ message, type }: { message: string; type: string }) => {
      this.showToast(message, type as any);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.currentView === 'chat' || this.currentView === 'settings') {
          this.renderDashboard();
        }
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  private renderDashboard(): void {
    this.cleanupViews();
    this.currentView = 'dashboard';
    this.container.innerHTML = '';
    this.container.className = 'theatro-layout dashboard-view';
    this.dashboard = new Dashboard(this.container);
  }

  private renderChat(scenario: Scenario): void {
    this.cleanupViews();
    this.currentView = 'chat';
    this.container.innerHTML = '';
    this.container.className = 'theatro-layout chat-view';
    this.chatView = new ChatView(this.container, scenario);
  }

  private renderSettings(): void {
    this.cleanupViews();
    this.currentView = 'settings';
    this.container.innerHTML = '';
    this.container.className = 'theatro-layout settings-view';
    this.settingsView = new SettingsView(this.container);
  }

  private cleanupViews(): void {
    this.dashboard?.destroy();
    this.chatView?.destroy();
    this.settingsView?.destroy();
    this.dashboard = null;
    this.chatView = null;
    this.settingsView = null;
  }
}
