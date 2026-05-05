import { initializeDefaults, getDB, saveCharacter, getAllCharacters, getAllScenarios, getUserCharacter } from '../core/storage.js';
import type { AppState, Character } from '../types/index.js';

export class App {
  private container: HTMLElement;
  private state: AppState;

  constructor() {
    this.container = document.getElementById('app')!;
    this.state = {
      sidePanel: { isOpen: false, activeTab: 'next' },
      isAutoScenarioRunning: false,
      selectedCharacters: [],
      pendingTurnQueue: []
    };
  }

  async init(): Promise<void> {
    await initializeDefaults();
    await getDB();
    this.injectStyles();
    this.renderDashboard();
    this.setupGlobalListeners();
  }

  private injectStyles(): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/app.css';
    document.head.appendChild(link);
  }

  private setupGlobalListeners(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.state.sidePanel.isOpen = false;
        this.renderDashboard();
      }
    });
  }

  private renderDashboard(): void {
    this.container.innerHTML = '';
    this.container.className = 'theatro-layout';
    
    this.container.innerHTML = this.getDashboardHTML();
    this.attachDashboardListeners();
  }

  private getDashboardHTML(): string {
    return `
      <nav class="theatro-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-logo">Theatro</span>
        </div>
        <div class="sidebar-nav">
          <div class="nav-section">
            <div class="nav-section-title">Main</div>
            <a class="nav-item active" href="#dashboard">
              ${this.iconHome()} Dashboard
            </a>
            <a class="nav-item" href="#characters">
              ${this.iconUsers()} Characters
            </a>
          </div>
          <div class="nav-section">
            <div class="nav-section-title">Settings</div>
            <a class="nav-item" href="#settings">
              ${this.iconSettings()} App Settings
            </a>
          </div>
        </div>
      </nav>
      
      <main class="dashboard-main">
        <div class="dashboard-content">
          <header class="dashboard-header">
            <h1 class="theatro-title">Theatro</h1>
            <p class="theatro-tagline">Where AI characters with souls interact in evolving narratives</p>
          </header>

          <div class="scenarios-section">
            <div class="section-header">
              <h2>Your Scenarios</h2>
              <button class="btn btn-primary" id="btn-new-scenario">
                ${this.iconPlus()} New Scenario
              </button>
            </div>
            <div class="empty-state-card" id="scenarios-empty">
              ${this.iconBookOpen()}
              <h3>No Scenarios Yet</h3>
              <p>Create your first scenario to begin your narrative journey.</p>
            </div>
          </div>

          <div class="characters-section">
            <div class="section-header">
              <h2>Your Characters</h2>
              <button class="btn btn-outline" id="btn-new-character">New Character</button>
            </div>
            <div id="characters-list"></div>
          </div>
        </div>
      </main>
    `;
  }

  private iconHome(): string {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  }

  private iconUsers(): string {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  }

  private iconSettings(): string {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
  }

  private iconPlus(): string {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
  }

  private iconBookOpen(): string {
    return `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
  }

  private async attachDashboardListeners(): Promise<void> {
    const btnNewScenario = this.container.querySelector('#btn-new-scenario');
    btnNewScenario?.addEventListener('click', () => {
      this.showToast('New Scenario - feature coming soon', 'info');
    });

    const btnNewCharacter = this.container.querySelector('#btn-new-character');
    btnNewCharacter?.addEventListener('click', () => {
      this.renderCharacterModal();
    });

    // Load and display characters
    await this.loadCharacters();
  }

  private async loadCharacters(): Promise<void> {
    const characters = await getAllCharacters();
    const container = this.container.querySelector('#characters-list');
    if (!container) return;

    if (characters.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <p>No characters created yet. Add characters to bring your stories to life.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="characters-grid">
        ${characters.map(c => `
          <div class="character-card" data-id="${c.id}">
            <div class="character-avatar" style="background: ${c.color}20; border-color: ${c.color}; color: ${c.color}">
              ${c.name.charAt(0)}
            </div>
            <div class="character-info">
              <div class="character-name">${c.name} ${c.isUser ? '<span class="user-badge">YOU</span>' : ''}</div>
              <div class="character-meta">${c.modelId}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderCharacterModal(): void {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Create Character</h2>
          <button class="modal-close" id="btn-close-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form id="character-form">
          <div class="form-group">
            <label>Name</label>
            <input type="text" name="name" class="form-input" placeholder="Character name" required>
          </div>
          <div class="form-group">
            <label>Color</label>
            <input type="color" name="color" value="#8b5cf6" class="form-color">
          </div>
          <div class="form-group">
            <label>Personality</label>
            <textarea name="personality" class="form-input" rows="3" placeholder="Describe their personality..."></textarea>
          </div>
          <div class="form-group">
            <label>Appearance</label>
            <textarea name="appearance" class="form-input" rows="2" placeholder="Physical description..."></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Create</button>
            <button type="button" class="btn btn-outline" id="btn-cancel">Cancel</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#btn-close-modal')?.addEventListener('click', closeModal);
    modal.querySelector('#btn-cancel')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector('#character-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      
      const character: Character = {
        id: crypto.randomUUID(),
        name: formData.get('name') as string,
        color: formData.get('color') as string,
        personality: formData.get('personality') as string,
        appearance: formData.get('appearance') as string,
        modelId: 'llama-scout',
        providerId: 'pollinations-p',
        avatarType: 'upload',
        isUser: false,
        speechPatterns: [],
        defaultMood: 'neutral',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await saveCharacter(character);
      closeModal();
      this.showToast(`Character "${character.name}" created!`, 'success');
      await this.loadCharacters();
    });
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
