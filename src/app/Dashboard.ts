import { Component } from './Component.js';
import { appState, scenarioStore, characterStore, appEvents } from '../stores/index.js';
import { exportAllData } from '../core/storage.js';

export class Dashboard extends Component {
  constructor(container: HTMLElement) {
    super(container, 'dashboard-root');
    this.render();
    this.setupListeners();
  }

  private setupListeners() {
    appEvents.on('scenarios:loaded', () => this.render());
    appEvents.on('characters:loaded', () => this.render());
  }

  render() {
    const scenarios = scenarioStore.getAll();
    const characters = characterStore.getAll();

    this.container.innerHTML = `
      <div class="dashboard-layout">
        <aside class="dashboard-sidebar">
          <div class="sidebar-header">
            <div class="logo">
              <span class="logo-icon">${this.getIcon('theatro', 24)}</span>
              <h1>Theatro</h1>
            </div>
          </div>
          
          <nav class="sidebar-nav">
            <button class="nav-item active" data-view="dashboard">
              ${this.getIcon('home', 20)}
              <span>Scenarios</span>
            </button>
            <button class="nav-item" data-view="characters">
              ${this.getIcon('users', 20)}
              <span>Characters</span>
            </button>
            <button class="nav-item" data-view="settings">
              ${this.getIcon('settings', 20)}
              <span>Settings</span>
            </button>
          </nav>

          <div class="sidebar-footer">
            <button class="btn btn-ghost btn-block" id="btn-export">
              ${this.getIcon('download', 18)}
              <span>Export Data</span>
            </button>
            <button class="btn btn-ghost btn-block" id="btn-import">
              ${this.getIcon('upload', 18)}
              <span>Import Data</span>
            </button>
          </div>
        </aside>

        <main class="dashboard-content">
          <header class="content-header">
            <div class="header-titles">
              <h2>My Scenarios</h2>
              <p>Continue your stories or create a new arc.</p>
            </div>
            <button class="btn btn-primary" id="btn-new-scenario">
              ${this.getIcon('plus', 18)}
              <span>Create Scenario</span>
            </button>
          </header>

          <div class="scenario-grid">
            ${scenarios.length ? scenarios.map(s => this.renderScenarioCard(s)).join('') : this.renderEmptyState('scenarios')}
          </div>

          <section class="character-section">
            <header class="section-header">
              <div class="header-titles">
                <h3>Characters</h3>
                <p>Manage your cast of actors.</p>
              </div>
              <button class="btn btn-outline" id="btn-new-character">
                ${this.getIcon('user-plus', 18)}
                <span>New Character</span>
              </button>
            </header>
            <div class="character-list">
              ${characters.length ? characters.map(c => this.renderCharacterCard(c)).join('') : this.renderEmptyState('characters')}
            </div>
          </section>
        </main>
      </div>
    `;

    this.bindEvents();
  }

  private renderScenarioCard(scenario: any) {
    return `
      <div class="scenario-card" data-id="${scenario.id}">
        <div class="card-glow" style="background: ${this.getScenarioColor(scenario)}"></div>
        <div class="card-content">
          <h3>${scenario.name}</h3>
          <p>${scenario.lore.slice(0, 80)}...</p>
          <div class="card-meta">
            <span>${scenario.characterIds.length} Characters</span>
            <span>${new Date(scenario.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-icon btn-start" title="Play">
            ${this.getIcon('play', 20)}
          </button>
        </div>
      </div>
    `;
  }

  private renderCharacterCard(character: any) {
    return `
      <div class="character-card" data-id="${character.id}">
        <div class="char-avatar" style="border-color: ${character.color}">
          ${character.avatar ? `<img src="${character.avatar}" />` : this.getIcon('user', 24)}
        </div>
        <div class="char-info">
          <h4>${character.name}</h4>
          <span class="char-model">${character.modelId}</span>
        </div>
        <button class="btn-icon">
          ${this.getIcon('edit', 18)}
        </button>
      </div>
    `;
  }

  private renderEmptyState(type: string) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${this.getIcon(type === 'scenarios' ? 'film' : 'users', 48)}</div>
        <p>No ${type} found. Start by creating one!</p>
      </div>
    `;
  }

  private bindEvents() {
    this.container.querySelectorAll('.scenario-card').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        if (id) scenarioStore.setActive(id);
      });
    });

    this.container.querySelector('#btn-export')?.addEventListener('click', async () => {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `theatro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    });

    this.container.querySelector('#btn-import')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (re: any) => {
          try {
            const data = JSON.parse(re.target.result);
            // Handle import logic
            appEvents.emit('toast', { message: 'Import successful', type: 'success' });
            window.location.reload();
          } catch (err) {
            appEvents.emit('toast', { message: 'Invalid file format', type: 'error' });
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }

  private getScenarioColor(scenario: any) {
    return '#8b5cf6'; // Default, could be derived from first character
  }

  private getIcon(name: string, size: number) {
    return `<svg width="${size}" height="${size}"><use href="#icon-${name}"></use></svg>`;
  }
}
