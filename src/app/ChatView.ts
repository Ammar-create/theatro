// ===== CHAT VIEW - Main Chat Interface =====
import type { Character, Scenario, Message } from '../types/index.js';
import { 
  scenarioStore, 
  characterStore, 
  chatStore,
  appEvents 
} from '../stores/index.js';
import { renderIcon, ICONS } from '../assets/icons/index.js';
import { SidePanel } from './SidePanel.js';

export class ChatView {
  private container: HTMLElement;
  private scenario: Scenario;
  private characters: Map<string, Character> = new Map();
  private userCharacter: Character | null = null;
  private sidePanel: SidePanel | null = null;
  private isSidePanelOpen = false;
  private isAutoScenario = false;
  private streamingMessageId: string | null = null;
  private unsubscribeFns: Array<() => void> = [];
  private messagesContainer: HTMLElement | null = null;

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
    this.sidePanel?.destroy();
  }

  private loadCharacters() {
    this.userCharacter = characterStore.getUserCharacter();
    this.scenario.characterIds.forEach(id => {
      const char = characterStore.get(id);
      if (char) this.characters.set(id, char);
    });
  }

  private setupEventListeners() {
    this.unsubscribeFns.push(
      appEvents.on('message:new', (message: Message) => {
        if (message.scenarioId === this.scenario.id) {
          this.appendMessage(message);
        }
      }),
      appEvents.on('streaming:start', ({ messageId, characterId }: { messageId: string; characterId: string }) => {
        this.streamingMessageId = messageId;
        this.showTypingIndicator(messageId, characterId);
      }),
      appEvents.on('streaming:chunk', ({ messageId, chunk }: { messageId: string; chunk: string }) => {
        this.updateStreamingMessage(messageId, chunk);
      }),
      appEvents.on('streaming:end', ({ messageId, content }: { messageId: string; content: string }) => {
        this.finalizeStreamingMessage(messageId, content);
        this.streamingMessageId = null;
      }),
      appEvents.on('streaming:error', ({ messageId, error }: { messageId: string; error: Error }) => {
        this.handleStreamingError(messageId, error);
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
          <div class="side-panel-container" id="side-panel-container"></div>
        </div>
      </div>
    `;

    // Initialize side panel in its container
    const sidePanelContainer = this.container.querySelector('#side-panel-container');
    if (sidePanelContainer) {
      this.sidePanel = new SidePanel(sidePanelContainer as HTMLElement, this.scenario);
    }

    this.attachEventHandlers();
    this.messagesContainer = this.container.querySelector('#messages-container');
  }

  private renderHeader(): string {
    const characterPills = Array.from(this.characters.values()).map(c => `
      <div class="character-pill" style="--char-color: ${c.color}">
        <span class="pill-avatar" style="background: ${c.color}30; color: ${c.color}">
          ${c.avatar ? `<img src="${c.avatar}" alt="">` : c.name.charAt(0).toUpperCase()}
        </span>
        <span class="pill-name">${this.escapeHtml(c.name)}</span>
      </div>
    `).join('');

    return `
      <header class="chat-header">
        <div class="header-left">
          <button class="header-btn" id="back-btn" title="Back to Dashboard">
            ${renderIcon(ICONS.arrowLeft, 18, 18)}
          </button>
          <div class="scenario-title-group">
            <h1 class="scenario-title">${this.escapeHtml(this.scenario.name)}</h1>
            <div class="scenario-meta">
              <span class="meta-participants">${this.characters.size + (this.userCharacter ? 1 : 0)} participants</span>
              <span class="meta-dot">•</span>
              <span class="meta-status ${this.scenario.isActive ? 'status-active' : 'status-paused'}">
                ${this.scenario.isActive ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>
        </div>
        <div class="character-pills">
          ${characterPills}
          ${this.userCharacter ? `
            <div class="character-pill user-pill" style="--char-color: ${this.userCharacter.color}">
              <span class="pill-avatar" style="background: ${this.userCharacter.color}30; color: ${this.userCharacter.color}">
                ${this.userCharacter.avatar ? `<img src="${this.userCharacter.avatar}" alt="">` : this.userCharacter.name.charAt(0).toUpperCase()}
              </span>
              <span class="pill-name">You</span>
            </div>
          ` : ''}
        </div>
        <div class="header-actions">
          <button class="header-btn ${this.isAutoScenario ? 'active' : ''}" id="auto-scenario-btn" title="Auto Scenario">
            ${renderIcon(ICONS.autoPlay, 18, 18)}
          </button>
          <button class="header-btn ${this.isSidePanelOpen ? 'active' : ''}" id="side-panel-btn" title="Director's Console">
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
        <span class="banner-text">Auto Scenario Active — Characters speaking autonomously</span>
        <button class="btn btn-sm btn-outline" id="pause-auto-btn">
          ${renderIcon(ICONS.pause, 14, 14)}
          <span>Pause</span>
        </button>
      </div>
    `;
  }

  private renderInputArea(): string {
    return `
      <div class="input-area">
        <div class="input-toolbar">
          <div class="toolbar-left">
            <button class="toolbar-btn" id="mic-btn" title="Voice Input (Whisper)">
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
            placeholder="Enter the scene... describe your actions and dialogue..."
            rows="1"
          ></textarea>
          <button class="input-send-btn" id="send-btn" title="Send Message">
            ${renderIcon(ICONS.send, 20, 20)}
          </button>
        </div>
      </div>
    `;
  }

  private async loadMessages() {
    const messages = await chatStore.getMessages(this.scenario.id);
    const messagesList = this.container.querySelector('#messages-list');
    if (messagesList) {
      messagesList.innerHTML = messages.map(m => this.renderMessage(m)).join('');
      this.scrollToBottom();
    }
  }

  private renderMessage(message: Message): string {
    const isUser = message.characterId === this.userCharacter?.id;
    const character = isUser ? this.userCharacter : this.characters.get(message.characterId || '');
    if (!character) return '';

    const isStreaming = message.id === this.streamingMessageId;
    const hasImage = !!message.imageUrl;
    const hasAudio = !!message.audioUrl;

    // Parse content into actions and dialogue
    const { actions, dialogue, fullContent } = this.parseContent(message.content);

    return `
      <div class="message-wrapper ${isUser ? 'user-message' : 'character-message'} ${isStreaming ? 'streaming' : ''}" 
           data-message-id="${message.id}" 
           style="--char-color: ${character.color}">
        <div class="message-avatar" style="background: ${character.color}20; border-color: ${character.color}40">
          ${character.avatar ? `<img src="${character.avatar}" alt="${character.name}">` : character.name.charAt(0).toUpperCase()}
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author" style="color: ${character.color}">${this.escapeHtml(character.name)}</span>
            <span class="message-time">${this.formatTime(message.timestamp)}</span>
            ${isStreaming ? '<span class="streaming-badge">typing...</span>' : ''}
          </div>
          ${actions.length > 0 ? `
            <div class="message-actions-text">
              ${actions.map(a => `<em class="action-line">${this.escapeHtml(a)}</em>`).join('')}
            </div>
          ` : ''}
          <div class="message-bubble">
            ${dialogue ? `<p class="message-dialogue">"${this.escapeHtml(dialogue)}"</p>` : ''}
            ${!dialogue && fullContent ? `<p class="message-text">${this.escapeHtml(fullContent)}</p>` : ''}
            ${hasImage ? `<div class="message-image"><img src="${message.imageUrl}" alt="Generated image"></div>` : ''}
          </div>
          ${isStreaming ? `
            <div class="streaming-cursor"></div>
          ` : ''}
          <div class="message-footer-actions">
            ${renderIcon(ICONS.image, 14, 14, 'var(--text-muted)', 1.5)}
            ${renderIcon(ICONS.volume, 14, 14, 'var(--text-muted)', 1.5)}
            ${renderIcon(ICONS.refreshCw, 14, 14, 'var(--text-muted)', 1.5)}
            ${renderIcon(ICONS.gitBranch, 14, 14, 'var(--text-muted)', 1.5)}
          </div>
        </div>
      </div>
    `;
  }

  private parseContent(content: string): { actions: string[]; dialogue: string; fullContent: string } {
    const actions: string[] = [];
    let dialogue = '';
    let fullContent = content;

    // Extract actions between ** or *
    const actionRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      actions.push(match[1] || match[2]);
    }

    // Extract dialogue between ""
    const dialogueRegex = /"([^"]+)"/;
    const dialogueMatch = content.match(dialogueRegex);
    if (dialogueMatch) {
      dialogue = dialogueMatch[1];
    }

    return { actions, dialogue, fullContent };
  }

  private showTypingIndicator(messageId: string, characterId: string) {
    const character = this.characters.get(characterId);
    if (!character) return;

    const placeholder: Message = {
      id: messageId,
      scenarioId: this.scenario.id,
      characterId,
      content: '',
      actions: [],
      dialogue: '',
      timestamp: Date.now()
    };

    const messagesList = this.container.querySelector('#messages-list');
    if (messagesList) {
      messagesList.insertAdjacentHTML('beforeend', this.renderMessage(placeholder));
      this.scrollToBottom();
    }
  }

  private updateStreamingMessage(messageId: string, chunk: string) {
    const element = this.container.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      const bubble = element.querySelector('.message-bubble');
      if (bubble) {
        const current = bubble.textContent || '';
        bubble.textContent = current + chunk;
      }
    }
  }

  private finalizeStreamingMessage(messageId: string, content: string) {
    const element = this.container.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      element.classList.remove('streaming');
      const { actions, dialogue, fullContent } = this.parseContent(content);
      
      // Re-render with proper formatting
      element.outerHTML = this.renderMessage({
        id: messageId,
        scenarioId: this.scenario.id,
        characterId: element.getAttribute('data-character-id') || '',
        content,
        actions,
        dialogue,
        timestamp: Date.now()
      });
    }
  }

  private handleStreamingError(messageId: string, error: Error) {
    const element = this.container.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      element.classList.add('error');
      const bubble = element.querySelector('.message-bubble');
      if (bubble) {
        bubble.innerHTML = `<span class="error-text">Error: ${this.escapeHtml(error.message)}</span>`;
      }
    }
  }

  private appendMessage(message: Message) {
    const messagesList = this.container.querySelector('#messages-list');
    if (messagesList) {
      messagesList.insertAdjacentHTML('beforeend', this.renderMessage(message));
      this.scrollToBottom();
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

    // Auto scenario toggle
    this.container.querySelector('#auto-scenario-btn')?.addEventListener('click', () => {
      this.toggleAutoScenario();
    });

    // Send message
    this.container.querySelector('#send-btn')?.addEventListener('click', () => {
      this.sendMessage();
    });

    // Textarea auto-resize
    const textarea = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    if (textarea) {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
      });
      
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  }

  private toggleSidePanel() {
    this.isSidePanelOpen = !this.isSidePanelOpen;
    this.sidePanel?.setOpen(this.isSidePanelOpen);
    this.container.querySelector('#side-panel-btn')?.classList.toggle('active', this.isSidePanelOpen);
  }

  private toggleAutoScenario() {
    this.isAutoScenario = !this.isAutoScenario;
    this.container.querySelector('#auto-scenario-btn')?.classList.toggle('active', this.isAutoScenario);
    
    if (this.isAutoScenario) {
      scenarioStore.startAutoScenario();
    } else {
      scenarioStore.pauseAutoScenario();
    }
    
    // Re-render to show/hide banner
    this.render();
  }

  private async sendMessage() {
    const textarea = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    if (!textarea || !textarea.value.trim()) return;

    const content = textarea.value.trim();
    textarea.value = '';
    textarea.style.height = 'auto';

    if (!this.userCharacter) {
      appEvents.emit('toast', { message: 'Create your character first', type: 'warning' });
      return;
    }

    await chatStore.sendMessage(this.scenario.id, this.userCharacter.id, content);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
