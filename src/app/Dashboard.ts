import type { Character, Scenario, Provider } from '../types/index.js';
import { 
  characterStore, 
  scenarioStore, 
  providerStore,
  settingsStore,
  appEvents 
} from '../stores/index.js';
import { renderIcon, ICONS, characterColorStyle } from '../assets/icons/index.js';

export class Dashboard {
  private container: HTMLElement;
  private isSidebarOpen = true;
  private activeView: 'scenarios' | 'characters' | 'settings' = 'scenarios';
  private unsubscribeFns: Array<() => void> = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
  }

  destroy() {
    this.unsubscribeFns.forEach(fn => fn());
  }

  private setupEventListeners() {
    this.unsubscribeFns.push(
      appEvents.on('scenarios:changed', () => this.refreshScenariosList()),
      appEvents.on('characters:changed', () => this.refreshCharactersList())
    );
  }

  private render() {
    this.container.innerHTML = `
      <div class="theatro-dashboard">
        ${this.renderSidebar()}
        <main class="dashboard-main">
          ${this.renderHeader()}
          <div class="dashboard-content">
            ${this.renderActiveView()}
          </div>
        </main>
      </div>
    `;
    this.attachEventHandlers();
  }

  private renderSidebar(): string {
    const scenarios = scenarioStore.all;
    const characters = characterStore.all;
    const user = characterStore.user;

    return `
      <aside class="dashboard-sidebar ${this.isSidebarOpen ? 'open' : 'collapsed'}">
        <div class="sidebar-brand">
          <div class="brand-logo">
            ${renderIcon(ICONS.theaterLogo, 32, 32)}
            <span class="brand-name">Theatro</span>
          </div>
          <button class="sidebar-toggle" aria-label="Toggle sidebar">
            ${renderIcon(ICONS.chevronLeft, 20, 20)}
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-group">
            <button class="nav-item ${this.activeView === 'scenarios' ? 'active' : ''}" data-view="scenarios">
              ${renderIcon(ICONS.scenario, 20, 20)}
              <span>Scenarios</span>
              <span class="nav-badge">${scenarios.length}</span>
            </button>
            <button class="nav-item ${this.activeView === 'characters' ? 'active' : ''}" data-view="characters">
              ${renderIcon(ICONS.character, 20, 20)}
              <span>Characters</span>
              <span class="nav-badge">${characters.length}</span>
            </button>
            <button class="nav-item ${this.activeView === 'settings' ? 'active' : ''}" data-view="settings">
              ${renderIcon(ICONS.settings, 20, 20)}
              <span>Settings</span>
            </button>
          </div>

          <div class="nav-divider"></div>

          <div class="nav-group">
            <div class="nav-group-header">
              <span>Active Scenarios</span>
            </div>
            <div class="scenario-list">
              ${scenarios.slice(0, 5).map(s => `
                <button class="scenario-item ${s.isActive ? 'active' : ''}" data-scenario-id="${s.id}">
                  <div class="scenario-color-indicator" style="background: ${this.getScenarioColor(s)}"></div>
                  <div class="scenario-info">
                    <span class="scenario-name">${this.escapeHtml(s.name)}</span>
                  </div>
                </button>
              `).join('') || `<div class="empty-nav-item">No scenarios yet</div>`}
            </div>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="user-mini-profile">
            <div class="user-avatar-mini" style="${user ? characterColorStyle(user) : 'background: var(--bg-tertiary);'}">
              ${user?.avatar ? `<img src="${user.avatar}" alt="">` : (user?.name?.charAt(0).toUpperCase() || 'U')}
            </div>
            <div class="user-info">
              <span class="user-name">${this.escapeHtml(user?.name || 'Guest')}</span>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  private renderHeader(): string {
    const titles: Record<string, { title: string; subtitle: string }> = {
      scenarios: { title: 'Scenarios', subtitle: 'Your living narratives' },
      characters: { title: 'Characters', subtitle: 'The cast of your stories' },
      settings: { title: 'Settings', subtitle: 'Configure Theatro' }
    };
    const { title, subtitle } = titles[this.activeView];

    return `
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-titles">
            <h1>${title}</h1>
            <p>${subtitle}</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" id="create-new-btn">
              ${renderIcon(ICONS.plus, 16, 16)}
              <span>Create ${this.activeView === 'scenarios' ? 'Scenario' : this.activeView === 'characters' ? 'Character' : ''}</span>
            </button>
          </div>
        </div>
      </header>
    `;
  }

  private renderActiveView(): string {
    switch (this.activeView) {
      case 'scenarios': return this.renderScenariosView();
      case 'characters': return this.renderCharactersView();
      case 'settings': return this.renderSettingsView();
      default: return '';
    }
  }

  private renderScenariosView(): string {
    const scenarios = scenarioStore.all;
    if (scenarios.length === 0) {
      return this.renderEmptyState('scenario');
    }
    return `
      <div class="scenarios-grid">
        <div class="scenarios-cards">
          ${scenarios.map(s => this.renderScenarioCard(s)).join('')}
        </div>
      </div>
    `;
  }

  private renderScenarioCard(scenario: Scenario): string {
    const characters = scenario.characterIds.map(id => characterStore.get(id)).filter(Boolean) as Character[];
    return `
      <article class="scenario-card" data-scenario-id="${scenario.id}">
        <div class="scenario-card-header">
          <div class="scenario-characters-preview">
            ${characters.slice(0, 3).map((c, i) => `
              <div class="preview-avatar" style="${characterColorStyle(c)} z-index: ${3 - i}">
                ${c.avatar ? `<img src="${c.avatar}" alt="">` : c.name.charAt(0).toUpperCase()}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="scenario-card-body">
          <h3>${this.escapeHtml(scenario.name)}</h3>
          <p>${this.truncateText(scenario.lore, 100)}</p>
          <div class="scenario-card-meta">${characters.length} characters</div>
        </div>
        <div class="scenario-card-footer">
          <button class="btn btn-primary btn-sm" data-action="activate" data-scenario-id="${scenario.id}">
            ${scenario.isActive ? 'Continue' : 'Enter Scene'}
          </button>
        </div>
      </article>
    `;
  }

  private renderCharactersView(): string {
    const characters = characterStore.regular;
    const user = characterStore.user;
    return `
      <div class="characters-layout">
        ${user ? `
          <div class="user-character-card">
            <div class="user-character-avatar-large" style="${characterColorStyle(user)}">
              ${user.avatar ? `<img src="${user.avatar}" alt="">` : user.name.charAt(0).toUpperCase()}
            </div>
            <div class="user-character-info">
              <h3>${this.escapeHtml(user.name)}</h3>
              <p>${this.truncateText(user.personality, 150)}</p>
              <span class="badge badge-primary">You</span>
            </div>
          </div>
        ` : `
          <div class="create-user-prompt">
            <h3>Create Your Character</h3>
            <button class="btn btn-primary" id="create-user-btn">Create</button>
          </div>
        `}
        <div class="characters-grid">
          ${characters.map(c => `
            <article class="character-card" data-character-id="${c.id}">
              <div class="character-card-header" style="${characterColorStyle(c)}">
                <div class="character-avatar-large">${c.avatar ? `<img src="${c.avatar}" alt="">` : c.name.charAt(0).toUpperCase()}</div>
              </div>
              <div class="character-card-body">
                <h4>${this.escapeHtml(c.name)}</h4>
                <p>${this.truncateText(c.personality, 80)}</p>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderSettingsView(): string {
    return `
      <div class="settings-layout">
        <h3>Settings</h3>
        <p>Configure your experience.</p>
      </div>
    `;
  }

  private renderEmptyState(type: 'scenario' | 'character'): string {
    return `
      <div class="empty-state-container">
        <h3>No ${type}s yet</h3>
        <button class="btn btn-primary" data-action="create-${type}">Create ${type}</button>
      </div>
    `;
  }

  private attachEventHandlers() {
    this.container.querySelector('.sidebar-toggle')?.addEventListener('click', () => {
      this.isSidebarOpen = !this.isSidebarOpen;
      this.render();
    });

    this.container.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', (e) => {
        this.activeView = (e.currentTarget as HTMLElement).dataset.view as any;
        this.render();
      });
    });

    this.container.querySelectorAll('[data-action="activate"]').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.scenarioId;
        if (id) scenarioStore.activate(id);
      });
    });
  }

  private refreshScenariosList() {
    this.render();
  }

  private refreshCharactersList() {
    this.render();
  }

  private getScenarioColor(scenario: Scenario): string {
    const chars = scenario.characterIds.map(id => characterStore.get(id)).filter(Boolean) as Character[];
    return chars[0]?.color || 'var(--accent-amber)';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private truncateText(text: string, len: number): string {
    if (text.length <= len) return text;
    return text.substring(0, len).trim() + '...';
  }
}
