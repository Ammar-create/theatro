import type { Character, Scenario, Message, MessageAction, ControllerDirective } from '../types/index.js';
import { 
  messageStore, 
  scenarioStore, 
  characterStore,
  settingsStore,
  appEvents 
} from '../stores/index.js';
import { renderIcon, ICONS, characterColorStyle, characterColorClass } from '../assets/icons/index.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export class ChatView {
  private container: HTMLElement;
  private scenario: Scenario;
  private characters: Map<string, Character> = new Map();
  private userCharacter: Character | null = null;
  private messagesContainer: HTMLElement | null = null;
  private inputArea: HTMLElement | null = null;
  private sidePanel: HTMLElement | null = null;
  private isSidePanelOpen = false;
  private isAutoScenario = false;
  private isRecording = false;
  private activeTab: 'next' | 'details' | 'matrix' | 'memory' | 'debug' | 'scene' = 'next';
  private streamingMessageId: string | null = null;
  private unsubscribeFns: Array<() => void> = [];

  constructor(container: HTMLElement, scenario: Scenario) {
    this.container = container;
    this.scenario = scenario;
    this.loadCharacters();
    this.render();
    this.setupEventListeners();
    this.loadMessages();
  }

  destroy() {
    this.unsubscribeFns.forEach(fn => fn());
  }

  private loadCharacters() {
    this.userCharacter = characterStore.user;
    this.scenario.characterIds.forEach(id => {
      const char = characterStore.get(id);
      if (char) this.characters.set(id, char);
    });
  }

  private setupEventListeners() {
    this.unsubscribeFns.push(
      appEvents.on('messages:added', (message: Message) => {
        if (message.scenarioId === this.scenario.id) {
          this.appendMessage(message);
          this.scrollToBottom();
        }
      }),
      appEvents.on('messages:updated', (message: Message) => {
        if (message.scenarioId === this.scenario.id) {
          this.updateMessage(message);
        }
      })
    );

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isSidePanelOpen) {
        this.toggleSidePanel();
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        this.sendMessage();
      }
    });
  }

  private render() {
    const isDM = this.characters.size <= 2;
    const layoutClass = isDM ? 'layout-dm' : 'layout-group';

    this.container.innerHTML = `
      <div class="chat-view ${layoutClass}">
        ${this.renderHeader()}
        <div class="chat-body">
          <div class="messages-wrapper">
            ${this.renderAutoModeBanner()}
            <div class="messages-container" id="messages-container">
              <div class="messages-list" id="messages-list"></div>
            </div>
            ${this.renderInputArea()}
          </div>
          ${this.renderSidePanel()}
        </div>
      </div>
    `;

    this.attachEventHandlers();
    this.messagesContainer = this.container.querySelector('#messages-container');
    this.inputArea = this.container.querySelector('.input-area');
    this.sidePanel = this.container.querySelector('.side-panel');
  }

  private renderHeader(): string {
    const characterPills = Array.from(this.characters.values()).map(c => `
      <div class="character-pill" style="border-color: ${c.color}">
        <span class="pill-color" style="background: ${c.color}"></span>
        <span>${this.escapeHtml(c.name)}</span>
      </div>
    `).join('');

    return `
      <header class="chat-header">
        <div class="header-scenario-info">
          <button class="header-btn" id="back-btn" title="Back to Dashboard">
            ${renderIcon(ICONS.arrowLeft, 18, 18)}
          </button>
          <div class="scenario-title-group">
            <h1 class="scenario-title">${this.escapeHtml(this.scenario.name)}</h1>
            <div class="scenario-meta">
              <span>${this.characters.size + (this.userCharacter ? 1 : 0)} participants</span>
              <span>•</span>
              <span>${this.scenario.isActive ? 'Active' : 'Paused'}</span>
            </div>
          </div>
        </div>
        <div class="character-pills">
          ${characterPills}
          ${this.userCharacter ? `
            <div class="character-pill user-pill">
              <span class="pill-color" style="background: ${this.userCharacter.color}"></span>
              <span>You (${this.escapeHtml(this.userCharacter.name)})</span>
            </div>
          ` : ''}
        </div>
        <div class="header-actions">
          <button class="header-btn ${this.isAutoScenario ? 'active' : ''}" id="auto-scenario-btn" title="Auto Scenario">
            ${renderIcon(ICONS.autoPlay, 18, 18)}
          </button>
          <button class="header-btn ${this.isSidePanelOpen ? 'active' : ''}" id="side-panel-btn" title="Side Panel">
            ${renderIcon(ICONS.panelRight, 18, 18)}
          </button>
        </div>
      </header>
    `;
  }

  private renderAutoModeBanner(): string {
    if (!this.isAutoScenario) return '';
    return `
      <div class="auto-mode-banner">
        <span class="streaming-indicator">
          <svg class="streaming-dots" width="20" height="20" viewBox="0 0 20 20">
            <circle cx="4" cy="10" r="2" fill="currentColor"/>
            <circle cx="10" cy="10" r="2" fill="currentColor"/>
            <circle cx="16" cy="10" r="2" fill="currentColor"/>
          </svg>
        </span>
        <span>Auto Scenario Active — Characters speaking autonomously</span>
        <button class="btn btn-sm btn-outline" id="pause-auto-btn">Pause</button>
      </div>
    `;
  }

  private renderInputArea(): string {
    return `
      <div class="input-area">
        <div class="input-toolbar">
          <div class="toolbar-left">
            <button class="toolbar-btn ${this.isRecording ? 'active' : ''}" id="mic-btn" title="Voice Input (Whisper)">
              ${renderIcon(ICONS.mic, 14, 14)}
              <span>Mic</span>
            </button>
            <button class="toolbar-btn" id="auto-improve-btn" title="Auto Improve">
              ${renderIcon(ICONS.sparkles, 14, 14)}
              <span>Auto Improve</span>
            </button>
          </div>
          <div class="toolbar-right">
            <span class="input-hint">Ctrl+Enter to send</span>
          </div>
        </div>
        <div class="input-box">
          <textarea 
            class="input-textarea" 
            id="message-input" 
            placeholder="Enter the scene..."
            rows="1"
          ></textarea>
          <button class="input-send-btn" id="send-btn" title="Send Message">
            ${renderIcon(ICONS.send, 20, 20)}
          </button>
        </div>
      </div>
    `;
  }

  private renderSidePanel(): string {
    return `
      <aside class="side-panel ${this.isSidePanelOpen ? 'open' : ''}">
        <div class="panel-header">
          <h2 class="panel-title">Director's Console</h2>
          <button class="panel-close-btn" id="close-panel-btn">
            ${renderIcon(ICONS.x, 18, 18)}
          </button>
        </div>
        <div class="panel-tabs">
          <button class="panel-tab ${this.activeTab === 'next' ? 'active' : ''}" data-tab="next">What Next</button>
          <button class="panel-tab ${this.activeTab === 'details' ? 'active' : ''}" data-tab="details">Brief Details</button>
          <button class="panel-tab ${this.activeTab === 'matrix' ? 'active' : ''}" data-tab="matrix">Matrix</button>
          <button class="panel-tab ${this.activeTab === 'memory' ? 'active' : ''}" data-tab="memory">Memory</button>
          <button class="panel-tab ${this.activeTab === 'debug' ? 'active' : ''}" data-tab="debug">Debug</button>
          <button class="panel-tab ${this.activeTab === 'scene' ? 'active' : ''}" data-tab="scene">Scene</button>
        </div>
        <div class="panel-content" id="panel-content">
          ${this.renderPanelContent()}
        </div>
      </aside>
    `;
  }

  private renderPanelContent(): string {
    switch (this.activeTab) {
      case 'next':
        return this.renderWhatNextTab();
      case 'details':
        return this.renderBriefDetailsTab();
      case 'matrix':
        return this.renderMatrixTab();
      case 'memory':
        return this.renderMemoryTab();
      case 'debug':
        return this.renderDebugTab();
      case 'scene':
        return this.renderSceneTab();
      default:
        return '';
    }
  }

  private renderWhatNextTab(): string {
    return `
      <div class="panel-section">
        <label class="form-label">What Should Happen Next</label>
        <p class="panel-description">Direct the story arc. The controllers will weave this into the narrative.</p>
        <textarea 
          class="form-textarea" 
          id="what-next-input"
          rows="6"
          placeholder="e.g., Character A discovers a secret about Character B. Tension rises. The user should feel conflicted..."
        >${this.scenario.settings.whatNext || ''}</textarea>
        <button class="btn btn-primary btn-sm" id="save-next-btn" style="margin-top: var(--space-sm);">
          Update Direction
        </button>
      </div>
    `;
  }

  private renderBriefDetailsTab(): string {
    return `
      <div class="panel-section">
        <label class="form-label">Brief Details</label>
        <p class="panel-description">Persistent style notes, reminders, and constraints for all controllers.</p>
        <textarea 
          class="form-textarea" 
          id="brief-details-input"
          rows="8"
          placeholder="Writing style: cinematic, dialogue-heavy&#10;Emoji usage: minimal&#10;Avoid: explicit violence, modern slang&#10;Tone: melancholic, mysterious"
        >${this.scenario.settings.briefDetails || ''}</textarea>
        <button class="btn btn-primary btn-sm" id="save-details-btn" style="margin-top: var(--space-sm);">
          Save Notes
        </button>
      </div>
    `;
  }

  private renderMatrixTab(): string {
    const chars = Array.from(this.characters.values());
    if (chars.length === 0) return '<p class="panel-empty">No characters in this scenario.</p>';

    let matrixHTML = '<div class="relationship-matrix">';
    chars.forEach(fromChar => {
      matrixHTML += `<div class="matrix-row">`;
      matrixHTML += `<div class="matrix-header" style="color: ${fromChar.color}">${this.escapeHtml(fromChar.name)}</div>`;
      chars.forEach(toChar => {
        if (fromChar.id === toChar.id) {
          matrixHTML += `<div class="matrix-cell matrix-self">—</div>`;
        } else {
          const relation = this.scenario.relationshipMatrix?.[fromChar.id]?.[toChar.id];
          matrixHTML += `
            <div class="matrix-cell ${relation ? 'matrix-has-data' : ''}" title="${relation ? relation.reason : 'Neutral'}">
              <span class="matrix-mood" style="color: ${relation?.mood === 'hostile' ? 'var(--accent-rose)' : relation?.mood === 'friendly' ? 'var(--accent-emerald)' : 'var(--text-secondary)'}">
                ${relation ? relation.mood.charAt(0).toUpperCase() : '○'}
              </span>
            </div>
          `;
        }
      });
      matrixHTML += `</div>`;
    });
    matrixHTML += '</div>';

    return `
      <div class="panel-section">
        <label class="form-label">Relationship Matrix</label>
        <p class="panel-description">How characters feel about each other. Updated by the Main Controller.</p>
        ${matrixHTML}
      </div>
    `;
  }

  private renderMemoryTab(): string {
    return `
      <div class="panel-section">
        <label class="form-label">Memory Summary</label>
        <p class="panel-description">Long-term summary maintained by the Main Controller.</p>
        <div class="memory-box">
          ${this.scenario.summary ? `
            <p>${this.escapeHtml(this.scenario.summary)}</p>
          ` : `
            <p class="panel-empty">No summary yet. The Main Controller will generate one after sufficient interaction.</p>
          `}
        </div>
      </div>
      <div class="panel-section">
        <label class="form-label">Edit Summary</label>
        <textarea 
          class="form-textarea" 
          id="summary-input"
          rows="4"
          placeholder="Manually edit the scenario summary..."
        >${this.scenario.summary || ''}</textarea>
        <button class="btn btn-outline btn-sm" id="save-summary-btn" style="margin-top: var(--space-sm);">
          Update Summary
        </button>
      </div>
    `;
  }

  private renderDebugTab(): string {
    return `
      <div class="panel-section">
        <label class="form-label">Controller Stream</label>
        <p class="panel-description">Live view of controller directives and decisions.</p>
        <div class="debug-stream" id="debug-stream">
          <div class="debug-entry">
            <span class="debug-timestamp">System</span>
            <span class="debug-message">Waiting for controller activity...</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderSceneTab(): string {
    const charList = Array.from(this.characters.values()).map(c => `
      <div class="scene-character">
        <div class="scene-avatar" style="${characterColorStyle(c)}">
          ${c.avatar ? `<img src="${c.avatar}" alt="">` : c.name.charAt(0).toUpperCase()}
        </div>
        <div class="scene-info">
          <span class="scene-name" style="color: ${c.color}">${this.escapeHtml(c.name)}</span>
          <span class="scene-model">${c.modelId || 'Default model'}</span>
        </div>
      </div>
    `).join('');

    return `
      <div class="panel-section">
        <label class="form-label">Active Characters</label>
        <div class="scene-characters-list">
          ${charList}
        </div>
      </div>
      <div class="panel-section">
        <label class="form-label">Scenario Settings</label>
        <div class="scene-settings">
          <div class="scene-setting">
            <span>AI Knows Real User</span>
            <span class="scene-value">${this.scenario.settings.aiKnowsUser ? 'Yes' : 'No'}</span>
          </div>
          <div class="scene-setting">
            <span>Controller Interval</span>
            <span class="scene-value">Every ${this.scenario.settings.controllerInterval || 10} messages</span>
          </div>
          <div class="scene-setting">
            <span>Auto Image Gen</span>
            <span class="scene-value">${this.scenario.settings.autoImageGen ? 'Enabled' : 'Manual'}</span>
          </div>
        </div>
      </div>
    `;
  }

  private async loadMessages() {
    const messages = await messageStore.getByScenario(this.scenario.id);
    const messagesList = this.container.querySelector('#messages-list');
    if (messagesList) {
      messagesList.innerHTML = messages.map(m => this.renderMessage(m)).join('');
      this.scrollToBottom();
    }
  }

  private renderMessage(message: Message): string {
    const isUser = message.characterId === this.userCharacter?.id;
    const character = isUser ? this.userCharacter : this.characters.get(message.characterId);
    if (!character) return '';

    const wrapperClass = isUser ? 'user-message' : 'ai-message';
    const actions = message.actions || [];

    return `
      <div class="message-wrapper ${wrapperClass}" data-message-id="${message.id}">
        <div class="message-header">
          <div class="message-avatar" style="border-color: ${character.color}; background: ${character.color}20">
            ${character.avatar ? `<img src="${character.avatar}" alt="">` : character.name.charAt(0).toUpperCase()}
          </div>
          <span class="message-author" style="color: ${character.color}">${this.escapeHtml(character.name)}</span>
          <span class="message-time">${this.formatTime(message.timestamp)}</span>
        </div>
        <div class="message-bubble" style="${isUser ? `border-color: ${character.color}40` : ''}">
          <div class="message-content">
            ${this.renderContent(message.content)}
          </div>
          ${actions.length > 0 ? `
            <div class="message-actions-inline">
              ${actions.map(a => `
                <span class="action-tag" title="${a.description}">${a.type}</span>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div class="message-actions">
          <button class="message-action-btn" title="Generate Image" data-action="image" data-msg-id="${message.id}">
            ${renderIcon(ICONS.image, 14, 14)}
          </button>
          <button class="message-action-btn" title="Generate Voice" data-action="voice" data-msg-id="${message.id}">
            ${renderIcon(ICONS.volume, 14, 14)}
          </button>
          <button class="message-action-btn" title="Regenerate" data-action="regenerate" data-msg-id="${message.id}">
            ${renderIcon(ICONS.refreshCw, 14, 14)}
          </button>
          <button class="message-action-btn" title="Branch from here" data-action="branch" data-msg-id="${message.id}">
            ${renderIcon(ICONS.gitBranch, 14, 14)}
          </button>
        </div>
      </div>
    `;
  }

  private renderContent(content: string): string {
    // Parse markdown and sanitize
    const parsed = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(parsed, { ALLOWED_TAGS: ['p', 'br', 'em', 'strong', 'span'] });
  }

  private appendMessage(message: Message) {
    const messagesList = this.container.querySelector('#messages-list');
    if (messagesList) {
      const html = this.renderMessage(message);
      messagesList.insertAdjacentHTML('beforeend', html);
    }
  }

  private updateMessage(message: Message) {
    const existing = this.container.querySelector(`[data-message-id="${message.id}"]`);
    if (existing) {
      const contentEl = existing.querySelector('.message-content');
      if (contentEl) {
        contentEl.innerHTML = this.renderContent(message.content);
      }
    }
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private attachEventHandlers() {
    // Back button
    this.container.querySelector('#back-btn')?.addEventListener('click', () => {
      appEvents.emit('navigate:dashboard');
    });

    // Side panel toggle
    this.container.querySelector('#side-panel-btn')?.addEventListener('click', () => {
      this.toggleSidePanel();
    });

    this.container.querySelector('#close-panel-btn')?.addEventListener('click', () => {
      this.toggleSidePanel();
    });

    // Auto scenario toggle
    this.container.querySelector('#auto-scenario-btn')?.addEventListener('click', () => {
      this.toggleAutoScenario();
    });

    this.container.querySelector('#pause-auto-btn')?.addEventListener('click', () => {
      this.toggleAutoScenario();
    });

    // Tab switching
    this.container.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.activeTab = (e.currentTarget as HTMLElement).dataset.tab as any;
        this.render();
      });
    });

    // Send message
    this.container.querySelector('#send-btn')?.addEventListener('click', () => {
      this.sendMessage();
    });

    const textarea = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    if (textarea) {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
      });
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Message actions
    this.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const el = e.currentTarget as HTMLElement;
        const action = el.dataset.action;
        const msgId = el.dataset.msgId;
        if (action && msgId) {
          this.handleMessageAction(action, msgId);
        }
      });
    });

    // Panel save buttons
    this.container.querySelector('#save-next-btn')?.addEventListener('click', () => {
      const input = this.container.querySelector('#what-next-input') as HTMLTextAreaElement;
      if (input) {
        scenarioStore.updateSettings(this.scenario.id, { whatNext: input.value });
        this.showToast('Direction updated', 'success');
      }
    });

    this.container.querySelector('#save-details-btn')?.addEventListener('click', () => {
      const input = this.container.querySelector('#brief-details-input') as HTMLTextAreaElement;
      if (input) {
        scenarioStore.updateSettings(this.scenario.id, { briefDetails: input.value });
        this.showToast('Notes saved', 'success');
      }
    });
  }

  private toggleSidePanel() {
    this.isSidePanelOpen = !this.isSidePanelOpen;
    this.sidePanel?.classList.toggle('open', this.isSidePanelOpen);
    this.container.querySelector('#side-panel-btn')?.classList.toggle('active', this.isSidePanelOpen);
  }

  private toggleAutoScenario() {
    this.isAutoScenario = !this.isAutoScenario;
    this.render();
    if (this.isAutoScenario) {
      this.showToast('Auto Scenario started', 'info');
      // TODO: Trigger controller loop
    } else {
      this.showToast('Auto Scenario paused', 'info');
    }
  }

  private async sendMessage() {
    const textarea = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    if (!textarea || !textarea.value.trim()) return;

    const content = textarea.value.trim();
    textarea.value = '';
    textarea.style.height = 'auto';

    if (!this.userCharacter) {
      this.showToast('Create your character first', 'error');
      return;
    }

    const message = await messageStore.add({
      scenarioId: this.scenario.id,
      characterId: this.userCharacter.id,
      content,
      actions: [],
      metadata: {},
      timestamp: Date.now()
    });

    // TODO: Trigger character response if not auto-mode
    if (!this.isAutoScenario) {
      // Request next character to respond
    }
  }

  private handleMessageAction(action: string, messageId: string) {
    switch (action) {
      case 'image':
        this.showToast('Generating image...', 'info');
        break;
      case 'voice':
        this.showToast('Generating voice...', 'info');
        break;
      case 'regenerate':
        this.showToast('Regenerating...', 'info');
        break;
      case 'branch':
        this.branchScenario(messageId);
        break;
    }
  }

  private async branchScenario(messageId: string) {
    const newScenario = await scenarioStore.branch(this.scenario.id, messageId);
    if (newScenario) {
      this.showToast(`Branched to "${newScenario.name}"`, 'success');
    }
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    appEvents.emit('toast', { message, type });
  }

  private formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
