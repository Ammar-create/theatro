import { appEvents, appState, scenarioStore, characterStore } from '../stores/index.js';
import { Modal } from './Modal.js';
import { appIcons } from '../assets/icons/index.js';
import { exportAllData, downloadJSON } from '../core/exportImport.js';

export class Dashboard {
  private container: HTMLElement;
  private modal: Modal;

  constructor(container: HTMLElement) {
    this.container = container;
    this.modal = new Modal();
    this.render();
    this.setupListeners();
  }

  private render(): void {
    const scenarios = scenarioStore.getAll();
    const characters = characterStore.getAll();
    const userChar = characters.find(c => c.isUser);

    this.container.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <div class="logo">
            <span class="logo-icon">🎭</span>
            <h1>Theatro</h1>
          </div>
          <div class="header-actions">
            <button class="btn-settings" id="btn-settings" title="Settings">
              ${appIcons.settings({ size: 20 })}
            </button>
          </div>
        </header>
        
        <main class="dashboard-content">
          <!-- Scenarios Section -->
          <section class="dashboard-section">
            <div class="section-header">
              <h2>Scenarios</h2>
              <button class="btn-primary" id="btn-new-scenario">
                ${appIcons.plus({ size: 16 })}
                New Scenario
              </button>
            </div>
            <div class="scenario-grid">
              ${scenarios.length === 0 ? `
                <div class="empty-state">
                  <p>No scenarios yet</p>
                  <span>Create your first story world</span>
                </div>
              ` : scenarios.map(s => `
                <div class="scenario-card" data-scenario-id="${s.id}">
                  <div class="scenario-info">
                    <h3>${s.name}</h3>
                    <p>${s.characterIds.length} characters</p>
                  </div>
                  <div class="scenario-actions">
                    <button class="btn-enter">Enter</button>
                    <button class="btn-menu" data-action="menu">${appIcons.more({ size: 16 })}</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
          
          <!-- Characters Section -->
          <section class="dashboard-section">
            <div class="section-header">
              <h2>Characters</h2>
              <button class="btn-secondary" id="btn-new-character">
                ${appIcons.plus({ size: 16 })}
                New Character
              </button>
            </div>
            <div class="character-list">
              ${characters.length === 0 ? `
                <div class="empty-state">
                  <p>No characters yet</p>
                </div>
              ` : characters.map(c => `
                <div class="character-item ${c.isUser ? 'is-user' : ''}" data-char-id="${c.id}">
                  <div class="char-avatar" style="background: ${c.color}20; border-color: ${c.color}">
                    ${c.avatar ? `<img src="${c.avatar}" />` : `<span style="color: ${c.color}">${c.name[0]}</span>`}
                  </div>
                  <div class="char-info">
                    <h4>${c.name} ${c.isUser ? '(You)' : ''}</h4>
                    <p>${c.personality.slice(0, 60)}...</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
          
          ${!userChar ? `
            <div class="banner">
              <span>Tip: Create a character and mark "This is me" to join scenarios</span>
            </div>
          ` : ''}
        </main>
      </div>
    `;
  }

  private setupListeners(): void {
    // Settings
    this.container.querySelector('#btn-settings')?.addEventListener('click', () => {
      appState.setView('settings');
    });

    // New scenario
    this.container.querySelector('#btn-new-scenario')?.addEventListener('click', () => {
      const chars = characterStore.getAll();
      if (chars.length === 0) {
        appEvents.emit('toast', { message: 'Create a character first!', type: 'warning' });
        return;
      }
      this.showNewScenarioModal(chars);
    });

    // New character
    this.container.querySelector('#btn-new-character')?.addEventListener('click', () => {
      this.showNewCharacterModal();
    });

    // Enter scenario
    this.container.querySelectorAll('.scenario-card').forEach(card => {
      card.querySelector('.btn-enter')?.addEventListener('click', () => {
        const id = (card as HTMLElement).dataset.scenarioId;
        const scenario = scenarioStore.get(id!);
        if (scenario) {
          appState.setView('chat', scenario);
        }
      });
    });
  }

  private showNewScenarioModal(characters: any[]): void {
    const userChar = characters.find(c => c.isUser);
    const otherChars = characters.filter(c => !c.isUser);

    this.modal.show({
      title: 'Create New Scenario',
      content: `
        <div class="form-group">
          <label>Scenario Name</label>
          <input type="text" id="scenario-name" placeholder="e.g., The Midnight Train" />
        </div>
        <div class="form-group">
          <label>Lore / Setting</label>
          <textarea id="scenario-lore" rows="4" placeholder="Describe the world, time period, circumstances..."></textarea>
        </div>
        <div class="form-group">
          <label>Characters</label>
          <div class="character-select">
            ${characters.map(c => `
              <label class="char-checkbox">
                <input type="checkbox" value="${c.id}" ${c.isUser ? 'checked disabled' : ''} />
                <span style="color: ${c.color}">${c.name}</span>
                ${c.isUser ? '<small>(You)</small>' : ''}
              </label>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="ai-knows-user" ${userChar ? '' : 'disabled'} />
            <span>AI characters know who the real user is</span>
          </label>
        </div>
      `,
      confirmText: 'Create Scenario',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const name = (document.querySelector('#scenario-name') as HTMLInputElement)?.value;
        const lore = (document.querySelector('#scenario-lore') as HTMLTextAreaElement)?.value;
        const aiKnows = (document.querySelector('#ai-knows-user') as HTMLInputElement)?.checked;

        if (!name) {
          appEvents.emit('toast', { message: 'Name required', type: 'warning' });
          return false;
        }

        const charIds: string[] = [];
        document.querySelectorAll('.char-checkbox input:checked').forEach((el: any) => {
          charIds.push(el.value);
        });

        if (charIds.length < 2) {
          appEvents.emit('toast', { message: 'Select at least 2 characters', type: 'warning' });
          return false;
        }

        const scenario = await scenarioStore.create({
          name,
          lore,
          characterIds: charIds,
          settings: { aiKnowsUser: aiKnows }
        });

        appEvents.emit('toast', { message: `Created "${name}"`, type: 'success' });
        this.render();
        this.setupListeners();
      }
    });
  }

  private showNewCharacterModal(): void {
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

    this.modal.show({
      title: 'Create Character',
      content: `
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="char-name" placeholder="Character name" />
        </div>
        <div class="form-group">
          <label>Color</label>
          <div class="color-picker">
            ${colors.map(c => `
              <button class="color-btn" data-color="${c}" style="background: ${c}"></button>
            `).join('')}
          </div>
          <input type="hidden" id="char-color" value="${colors[0]}" />
        </div>
        <div class="form-group">
          <label>Personality</label>
          <textarea id="char-personality" rows="3" placeholder="Who are they? What drives them?"></textarea>
        </div>
        <div class="form-group">
          <label>Appearance</label>
          <textarea id="char-appearance" rows="2" placeholder="Physical description, clothing, distinguishing marks..."></textarea>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="char-is-user" />
            <span>This is me (my character)</span>
          </label>
        </div>
      `,
      confirmText: 'Create Character',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const name = (document.querySelector('#char-name') as HTMLInputElement)?.value;
        const color = (document.querySelector('#char-color') as HTMLInputElement)?.value;
        const personality = (document.querySelector('#char-personality') as HTMLTextAreaElement)?.value;
        const appearance = (document.querySelector('#char-appearance') as HTMLTextAreaElement)?.value;
        const isUser = (document.querySelector('#char-is-user') as HTMLInputElement)?.checked;

        if (!name || !personality) {
          appEvents.emit('toast', { message: 'Name and personality required', type: 'warning' });
          return false;
        }

        if (isUser) {
          await characterStore.setAsUser(''); // Unset existing
        }

        await characterStore.create({
          name,
          color,
          personality,
          appearance,
          isUser
        });

        appEvents.emit('toast', { message: `Created ${name}`, type: 'success' });
        this.render();
        this.setupListeners();
      }
    });

    // Color picker
    setTimeout(() => {
      document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          (document.querySelector('#char-color') as HTMLInputElement)!.value = (btn as HTMLElement).dataset.color!;
        });
      });
    }, 10);
  }

  destroy(): void {
    this.modal.destroy();
    this.container.innerHTML = '';
  }
}
