import { scenarioStore, characterStore, appEvents, appState, chatStore } from '../stores/index.js';
import { SidePanel } from './SidePanel.js';
import { Modal } from './Modal.js';
import { appIcons } from '../assets/icons/index.js';
import { generateImage } from '../services/providers.js';

export class ChatView {
  private container: HTMLElement;
  private scenario: any;
  private sidePanel: SidePanel | null = null;
  private modal: Modal;
  private messageContainer: HTMLElement | null = null;
  private streamingMessageId: string | null = null;

  constructor(container: HTMLElement, scenario: any) {
    this.container = container;
    this.scenario = scenario;
    this.modal = new Modal();
    this.render();
    this.setupEventListeners();
    this.loadMessages();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="chat-view">
        <header class="chat-header">
          <div class="header-left">
            <button class="btn-back" id="btn-back">${appIcons.arrowLeft({ size: 20 })}</button>
            <div class="scenario-info">
              <h2>${this.scenario.name}</h2>
              <span class="character-count">${this.scenario.characterIds.length} characters</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-auto-scenario" id="btn-auto-scenario" title="Auto Scenario">${appIcons.play({ size: 18 })}</button>
            <button class="btn-sidepanel" id="btn-sidepanel" title="Director Console">${appIcons.menu({ size: 20 })}</button>
          </div>
        </header>
        <div class="chat-layout">
          <div class="messages-container" id="messages"></div>
          <div class="input-area">
            <div class="input-toolbar">
              <button class="btn-mic" id="btn-mic" title="Voice">${appIcons.mic({ size: 18 })}</button>
              <button class="btn-auto-improve" id="btn-auto-improve" title="Auto Improve">${appIcons.sparkles({ size: 18 })}</button>
            </div>
            <div class="input-container">
              <textarea id="message-input" placeholder="Type your message..." rows="1"></textarea>
              <button class="btn-send" id="btn-send">${appIcons.send({ size: 20 })}</button>
            </div>
            <div class="input-hint"><span>Use *actions* and "dialogue"</span></div>
          </div>
        </div>
        <div class="side-panel-container" id="side-panel"></div>
      </div>
    `;

    this.messageContainer = this.container.querySelector('#messages');
    const sidePanelContainer = this.container.querySelector('#side-panel');
    if (sidePanelContainer) {
      this.sidePanel = new SidePanel(sidePanelContainer as HTMLElement, this.scenario);
    }
  }

  private async loadMessages(): Promise<void> {
    await chatStore.loadMessages(this.scenario.id);
    const messages = chatStore.getMessages();
    messages.forEach(msg => this.renderMessage(msg));
  }

  private renderMessage(msg: any, streaming = false): void {
    if (!this.messageContainer) return;

    const character = characterStore.get(msg.characterId);
    const color = character?.color || '#888';

    const msgEl = document.createElement('div');
    msgEl.className = `message ${character?.isUser ? 'user' : ''} ${streaming ? 'streaming' : ''}`;
    msgEl.id = `msg-${msg.id}`;
    msgEl.style.setProperty('--character-color', color);

    const actions = msg.actions?.map((a: string) => `<span class="action">*${a}*</span>`).join(' ') || '';
    const dialogue = msg.dialogue ? `<span class="dialogue" style="color: ${color}">"${msg.dialogue}"</span>` : '';

    msgEl.innerHTML = `
      <div class="message-header">
        <span class="message-author" style="color: ${color}">${character?.name || 'Unknown'}</span>
        ${msg.edited ? '<span class="edited">edited</span>' : ''}
      </div>
      <div class="message-content">
        ${actions ? `<div class="actions">${actions}</div>` : ''}
        ${dialogue ? `<div class="dialogue-wrapper">${dialogue}</div>` : ''}
        ${!actions && !dialogue ? `<div class="raw-content">${msg.content}</div>` : ''}
      </div>
      <div class="message-actions">
        ${streaming ? '<span class="streaming-indicator">...</span>' : ''}
        <button class="btn-msg-action" data-action="image" title="Generate Image">${appIcons.image({ size: 14 })}</button>
        <button class="btn-msg-action" data-action="voice" title="Voice">${appIcons.volume({ size: 14 })}</button>
        <button class="btn-msg-action" data-action="regenerate" title="Regenerate">${appIcons.refresh({ size: 14 })}</button>
        <button class="btn-msg-action" data-action="branch" title="Branch">${appIcons.branch({ size: 14 })}</button>
      </div>
    `;

    msgEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleMessageAction((e.currentTarget as HTMLElement).dataset.action!, msg));
    });

    this.messageContainer.appendChild(msgEl);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  private setupEventListeners(): void {
    this.container.querySelector('#btn-back')?.addEventListener('click', () => appState.setView('dashboard'));

    const sendBtn = this.container.querySelector('#btn-send');
    const input = this.container.querySelector('#message-input') as HTMLTextAreaElement;

    sendBtn?.addEventListener('click', () => this.sendMessage(input?.value || ''));
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(input.value);
      }
    });

    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
    });

    this.container.querySelector('#btn-sidepanel')?.addEventListener('click', () => appState.toggleSidePanel());
    this.container.querySelector('#btn-auto-scenario')?.addEventListener('click', () => {
      chatStore.toggleAutoScenario();
    });

    appEvents.on('chat:message-added', (msg) => this.renderMessage(msg));
    appEvents.on('streaming:start', ({ messageId, characterId }) => {
      this.streamingMessageId = messageId;
      this.renderMessage({ id: messageId, characterId, content: '', actions: [], dialogue: '', timestamp: Date.now() }, true);
    });
    appEvents.on('streaming:chunk', ({ messageId, chunk }) => {
      if (messageId !== this.streamingMessageId) return;
      const msgEl = this.container.querySelector(`#msg-${messageId}`);
      const content = msgEl?.querySelector('.raw-content, .dialogue-wrapper');
      if (content) content.textContent += chunk;
    });
    appEvents.on('streaming:end', ({ messageId }) => {
      const msgEl = this.container.querySelector(`#msg-${messageId}`);
      if (msgEl) {
        msgEl.classList.remove('streaming');
        msgEl.querySelector('.streaming-indicator')?.remove();
      }
      this.streamingMessageId = null;
    });
  }

  private async sendMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    const input = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    if (input) input.value = '';

    const actions: string[] = [];
    let dialogue = '';
    let text = content;

    const actionRegex = /\*([^*]+)\*/g;
    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      actions.push(match[1].trim());
      text = text.replace(match[0], '');
    }

    const dialogueRegex = /"([^"]+)"/g;
    while ((match = dialogueRegex.exec(content)) !== null) {
      dialogue = match[1];
      text = text.replace(match[0], '');
    }

    await chatStore.sendUserMessage(content.trim(), dialogue, actions);
  }

  private async handleMessageAction(action: string, msg: any): Promise<void> {
    switch (action) {
      case 'image':
        try {
          appEvents.emit('toast', { message: 'Generating...', type: 'info' });
          const url = await generateImage(`Scene: ${msg.content.slice(0, 200)}`);
          this.modal.show({ title: 'Generated', content: `<img src="${url}" style="max-width: 100%; border-radius: 8px;" />`, showCancel: false, confirmText: 'Close' });
        } catch (e) {
          appEvents.emit('toast', { message: 'Image failed', type: 'error' });
        }
        break;
      case 'branch':
        try {
          const branched = await scenarioStore.branch(this.scenario.id);
          appEvents.emit('toast', { message: `Created "${branched?.name}"`, type: 'success' });
        } catch (e) {
          appEvents.emit('toast', { message: 'Branch failed', type: 'error' });
        }
        break;
      case 'voice':
        try {
          appEvents.emit('toast', { message: 'Generating voice...', type: 'info' });
          // Voice generation will be wired up when providers are ready
          appEvents.emit('toast', { message: 'Voice coming soon', type: 'info' });
        } catch (e) {
          appEvents.emit('toast', { message: 'Voice failed', type: 'error' });
        }
        break;
      case 'regenerate':
        appEvents.emit('toast', { message: 'Regenerate coming soon', type: 'info' });
        break;
      default:
        appEvents.emit('toast', { message: 'Coming soon', type: 'info' });
    }
  }

  destroy(): void {
    this.modal.destroy();
    this.sidePanel?.destroy();
    this.container.innerHTML = '';
  }
}