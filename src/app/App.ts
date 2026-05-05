import { initializeStores, appEvents } from '../stores/index.js';
import { Dashboard } from './Dashboard.js';
import type { Scenario } from '../types/index.js';

export class App {
  private container: HTMLElement;
  private dashboard: Dashboard | null = null;
  private currentView: 'dashboard' | 'chat' = 'dashboard';

  constructor() {
    const el = document.getElementById('app');
    if (!el) throw new Error('App container not found');
    this.container = el;
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

    // Escape key handling
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentView === 'chat') {
        this.renderDashboard();
      }
    });
  }

  private renderDashboard(): void {
    this.currentView = 'dashboard';
    this.container.innerHTML = '';
    this.container.className = 'theatro-layout dashboard-view';
    
    // Clean up previous dashboard
    if (this.dashboard) {
      this.dashboard.destroy();
    }
    
    this.dashboard = new Dashboard(this.container);
  }

  private renderChat(scenario: Scenario): void {
    this.currentView = 'chat';
    this.container.innerHTML = '';
    this.container.className = 'theatro-layout chat-view';

    // Placeholder chat view - will be built in next iteration
    this.container.innerHTML = `
      <div class="chat-placeholder">
        <div class="chat-header">
          <button class="btn btn-outline" id="back-to-dashboard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h2>${scenario.name}</h2>
        </div>
        <div class="chat-messages">
          <p>Chat view for "${scenario.name}" coming next...</p>
        </div>
      </div>
    `;

    // Back button handler
    this.container.querySelector('#back-to-dashboard')?.addEventListener('click', () => {
      this.renderDashboard();
    });
  }
}
