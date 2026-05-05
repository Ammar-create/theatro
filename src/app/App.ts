import { initializeStores, appEvents } from '../stores/index.js';
import { Dashboard } from './Dashboard.js';
import { ChatView } from './ChatView.js';
import type { Scenario } from '../types/index.js';

export class App {
  private container: HTMLElement;
  private dashboard: Dashboard | null = null;
  private chatView: ChatView | null = null;
  private currentView: 'dashboard' | 'chat' = 'dashboard';
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
    // Initialize all stores and load data
    await initializeStores();
    
    // Inject styles
    this.injectStyles();
    
    // Render initial view
    this.renderDashboard();
    
    // Setup global event listeners
    this.setupGlobalListeners();
  }

  private injectStyles(): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/app.css';
    document.head.appendChild(link);
  }

  private setupGlobalListeners(): void {
    // Listen for navigation to chat
    appEvents.on('navigate:chat', (scenario: Scenario) => {
      this.renderChat(scenario);
    });

    // Listen for back to dashboard
    appEvents.on('navigate:dashboard', () => {
      this.renderDashboard();
    });

    // Toast events
    appEvents.on('toast', ({ message, type }: { message: string; type: string }) => {
      this.showToast(message, type as any);
    });

    // Escape key handling
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentView === 'chat') {
        this.renderDashboard();
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
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  private renderDashboard(): void {
    this.currentView = 'dashboard';
    this.container.innerHTML = '';
    this.container.className = 'theatro-layout dashboard-view';
    
    // Clean up previous views
    if (this.dashboard) {
      this.dashboard.destroy();
      this.dashboard = null;
    }
    if (this.chatView) {
      this.chatView.destroy();
      this.chatView = null;
    }
    
    this.dashboard = new Dashboard(this.container);
  }

  private renderChat(scenario: Scenario): void {
    this.currentView = 'chat';
    this.container.innerHTML = '';
    this.container.className = 'theatro-layout chat-view';

    // Clean up previous views
    if (this.dashboard) {
      this.dashboard.destroy();
      this.dashboard = null;
    }
    if (this.chatView) {
      this.chatView.destroy();
    }

    this.chatView = new ChatView(this.container, scenario);
  }
}
