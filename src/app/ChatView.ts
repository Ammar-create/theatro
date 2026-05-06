import { scenarioStore, characterStore, appEvents, appState, chatStore } from '../stores/index.js';
import { SidePanel } from './SidePanel.js';
import { Modal } from './Modal.js';
import { appIcons } from '../assets/icons/index.js';
import { generateImage } from '../services/providers.js';
import { Message, Character, LayoutMode } from '../types/index.js';

export class ChatView {
  private container: HTMLElement;
  private scenario: any;
  private sidePanel: SidePanel | null = null;
  private modal: Modal;
  private messageContainer: HTMLElement | null = null;
  private streamingMessageId: string | null = null;
  private layoutMode: LayoutMode = 'group';
  private isWhisperMode = false;
  private whisperTargetIds: string[] = [];
  private isProcessingBackground = false;

  constructor(container: HTMLElement, scenario: any) {
    this.container = container;
    this.scenario = scenario;
    this.modal = new Modal();
    this.detectLayoutMode();
    this.render();
    this.setupEventListeners();
    this.loadMessages();
  }

  /** Detect DM (2 chars) vs Group (3+) layout */
  private detectLayoutMode(): void {
    const charCount = this.scenario.characterIds.length;
    this.layoutMode = charCount === 2 ? 'dm' : 'group';
  }

  private render(): void {
    var that = this;
    
    // Build whisper target options
    var whisperOptionsHtml = '';
    this.scenario.characterIds.forEach(function(id: string) {
      var c = characterStore.get(id);
      if (c && !c.isUser) {
        whisperOptionsHtml += 
          '<button class="whisper-target-btn" data-char-id="' + c.id + '" style="--target-color: ' + c.color + '">' +
            '<span class="target-dot" style="background: ' + c.color + '"></span>' +
            '<span class="target-name">' + c.name + '</span>' +
          '</button>';
      }
    });

    this.container.innerHTML =
      '<div class="chat-view layout-' + this.layoutMode + '">' +
        '<header class="chat-header">' +
          '<div class="header-left">' +
            '<button class="btn-back" id="btn-back">' + appIcons.arrowLeft({ size: 20 }) + '</button>' +
            '<div class="scenario-info">' +
              '<h2>' + that.scenario.name + '</h2>' +
              '<span class="character-count">' + that.scenario.characterIds.length + ' characters · ' + 
                (this.layoutMode === 'dm' ? 'Direct Message' : 'Group Chat') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="header-actions">' +
            '<button class="btn-auto-scenario" id="btn-auto-scenario" title="Auto Scenario">' + appIcons.play({ size: 18 }) + '</button>' +
            '<button class="btn-sidepanel" id="btn-sidepanel" title="Director Console">' + appIcons.menu({ size: 20 }) + '</button>' +
          '</div>' +
        '</header>' +
        '<div class="chat-layout">' +
          '<div class="messages-container" id="messages"></div>' +
          '<div class="background-indicator" id="bg-indicator" style="display: none;">' +
            '<div class="indicator-spinner"></div>' +
            '<span class="indicator-text">Characters chatting...</span>' +
            '<button class="btn-pause-bg" id="btn-pause-bg">' + appIcons.pause({ size: 14 }) + ' Pause</button>' +
          '</div>' +
          '<div class="input-area">' +
            '<div class="whisper-indicator" id="whisper-indicator" style="display: none;">' +
              '<span class="whisper-icon">' + appIcons.lock({ size: 14 }) + '</span>' +
              '<span class="whisper-text">Whispering to <strong id="whisper-target-name"></strong></span>' +
              '<button class="btn-cancel-whisper" id="btn-cancel-whisper">' + appIcons.close({ size: 14 }) + '</button>' +
            '</div>' +
            '<div class="input-toolbar">' +
              '<div class="toolbar-left">' +
                '<button class="btn-mic" id="btn-mic" title="Voice">' + appIcons.mic({ size: 18 }) + '</button>' +
                '<button class="btn-whisper" id="btn-whisper" title="Whisper (Private Message)">' + appIcons.lock({ size: 18 }) + '</button>' +
              '</div>' +
              '<button class="btn-auto-improve" id="btn-auto-improve" title="Auto Improve">' + appIcons.sparkles({ size: 18 }) + '</button>' +
            '</div>' +
            '<div class="input-container">' +
              '<textarea id="message-input" placeholder="' + (this.layoutMode === 'dm' ? 'Message privately...' : 'Type your message...') + '" rows="1"></textarea>' +
              '<button class="btn-send" id="btn-send">' + appIcons.send({ size: 20 }) + '</button>' +
            '</div>' +
            '<div class="input-hint"><span>Use *actions* and "dialogue"</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="side-panel-container" id="side-panel"></div>' +
        '<div class="whisper-picker-overlay" id="whisper-picker-overlay" style="display: none;">' +
          '<div class="whisper-picker">' +
            '<div class="whisper-picker-header">' +
              '<h4>Select Whisper Target</h4>' +
              '<button class="btn-close-picker" id="btn-close-whisper-picker">' + appIcons.close({ size: 16 }) + '</button>' +
            '</div>' +
            '<div class="whisper-picker-body">' + whisperOptionsHtml + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    this.messageContainer = this.container.querySelector('#messages');
    var sidePanelContainer = this.container.querySelector('#side-panel');
    if (sidePanelContainer) {
      this.sidePanel = new SidePanel(sidePanelContainer as HTMLElement, this.scenario);
    }
  }

  private async loadMessages(): Promise<void> {
    await chatStore.loadMessages(this.scenario.id);
    var messages = chatStore.getMessages();
    messages.forEach((msg: Message) => { this.renderMessage(msg); });
  }

  private renderMessage(msg: Message, streaming?: boolean): void {
    if (!this.messageContainer) return;
    var s = streaming || false;

    var character = msg.characterId ? characterStore.get(msg.characterId) : undefined;
    var color = character ? character.color : '#888';
    var isUser = character ? character.isUser : false;

    var msgEl = document.createElement('div');
    msgEl.className = 'message' + (isUser ? ' user' : '') + (s ? ' streaming' : '');
    if (this.layoutMode === 'dm') {
      msgEl.classList.add(isUser ? 'msg-right' : 'msg-left');
    }
    msgEl.id = 'msg-' + msg.id;
    msgEl.style.setProperty('--character-color', color);

    // Private message styling
    var isPrivate = msg.isPrivateBetween && msg.isPrivateBetween.length > 0;
    if (isPrivate) {
      msgEl.classList.add('private-message');
    }

    var actionsHtml = '';
    if (msg.actions && msg.actions.length > 0) {
      actionsHtml = msg.actions.map(function(a: string) { return '<span class="action">*' + a + '*</span>'; }).join(' ');
    }
    var dialogueHtml = '';
    if (msg.dialogue) {
      dialogueHtml = '<span class="dialogue" style="color: ' + color + '">' + msg.dialogue + '</span>';
    }

    // Avatar for group mode only
    var avatarHtml = '';
    if (this.layoutMode === 'group' && character) {
      if (character.avatar) {
        avatarHtml = '<img class="message-avatar" src="' + character.avatar + '" alt="' + character.name + '" />';
      } else {
        avatarHtml = '<div class="message-avatar-placeholder" style="background: ' + color + '">' + 
          character.name.charAt(0).toUpperCase() + '</div>';
      }
    }

    // Private indicator
    var privateHtml = '';
    if (isPrivate && msg.isPrivateBetween) {
      var targetNames = msg.isPrivateBetween
        .map(function(id: string) { var c = characterStore.get(id); return c ? c.name : 'Unknown'; })
        .join(', ');
      privateHtml = '<div class="private-indicator">' + appIcons.lock({ size: 12 }) + ' Private with ' + targetNames + '</div>';
    }

    msgEl.innerHTML =
      (this.layoutMode === 'group' ? '<div class="message-avatar-col">' + avatarHtml + '</div>' : '') +
      '<div class="message-body">' +
        '<div class="message-header">' +
          '<span class="message-author" style="color: ' + color + '">' + (character ? character.name : 'Unknown') + '</span>' +
          (isPrivate ? '<span class="private-badge">' + appIcons.lock({ size: 10 }) + ' Private</span>' : '') +
          (msg.edited ? '<span class="edited">edited</span>' : '') +
        '</div>' +
        (privateHtml) +
        '<div class="message-content">' +
          (actionsHtml ? '<div class="actions">' + actionsHtml + '</div>' : '') +
          (dialogueHtml ? '<div class="dialogue-wrapper">' + dialogueHtml + '</div>' : '') +
          (!actionsHtml && !dialogueHtml ? '<div class="raw-content">' + msg.content + '</div>' : '') +
        '</div>' +
        '<div class="message-actions">' +
          (s ? '<span class="streaming-indicator">...</span>' : '') +
          '<button class="btn-msg-action" data-action="image" title="Generate Image">' + appIcons.image({ size: 14 }) + '</button>' +
          '<button class="btn-msg-action" data-action="voice" title="Voice">' + appIcons.volume({ size: 14 }) + '</button>' +
          '<button class="btn-msg-action" data-action="regenerate" title="Regenerate">' + appIcons.refresh({ size: 14 }) + '</button>' +
          '<button class="btn-msg-action" data-action="branch" title="Branch">' + appIcons.branch({ size: 14 }) + '</button>' +
        '</div>' +
      '</div>';

    var self = this;
    msgEl.querySelectorAll('[data-action]').forEach(function(btn: Element) {
      btn.addEventListener('click', function(e: Event) {
        self.handleMessageAction((e.currentTarget as HTMLElement).dataset.action!, msg);
      });
    });

    this.messageContainer.appendChild(msgEl);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  private setupEventListeners(): void {
    var self = this;

    this.container.querySelector('#btn-back')?.addEventListener('click', function() { appState.setView('dashboard'); });

    var sendBtn = this.container.querySelector('#btn-send');
    var input = this.container.querySelector('#message-input') as HTMLTextAreaElement;

    sendBtn?.addEventListener('click', function() { self.sendMessage(input ? input.value : ''); });
    input?.addEventListener('keydown', function(e: KeyboardEvent) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        self.sendMessage(input.value);
      }
    });

    input?.addEventListener('input', function() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 200) + 'px';
    });

    this.container.querySelector('#btn-sidepanel')?.addEventListener('click', function() { appState.toggleSidePanel(); });
    this.container.querySelector('#btn-auto-scenario')?.addEventListener('click', function() {
      chatStore.toggleAutoScenario();
    });

    // Whisper button
    this.container.querySelector('#btn-whisper')?.addEventListener('click', function() { self.toggleWhisperPicker(); });
    this.container.querySelector('#btn-cancel-whisper')?.addEventListener('click', function() { self.cancelWhisper(); });
    this.container.querySelector('#btn-close-whisper-picker')?.addEventListener('click', function() { self.hideWhisperPicker(); });
    this.container.querySelector('#whisper-picker-overlay')?.addEventListener('click', function(e: Event) {
      if ((e.target as HTMLElement).id === 'whisper-picker-overlay') self.hideWhisperPicker();
    });

    // Whisper target buttons
    this.container.querySelectorAll('.whisper-target-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e: Event) {
        var targetId = (e.currentTarget as HTMLElement).dataset.charId;
        if (targetId) self.selectWhisperTarget(targetId);
      });
    });

    // Background processing pause button
    this.container.querySelector('#btn-pause-bg')?.addEventListener('click', function() {
      chatStore.pauseAutoScenario(self.scenario.id);
      self.hideBackgroundIndicator();
    });

    // Event listeners for real-time updates
    appEvents.on('chat:message-added', function(msg: Message) { self.renderMessage(msg); });
    appEvents.on('streaming:start', function(data: { messageId: string; characterId: string }) {
      self.streamingMessageId = data.messageId;
      self.renderMessage({ id: data.messageId, scenarioId: self.scenario.id, characterId: data.characterId, content: '', actions: [], dialogue: '', timestamp: Date.now() } as Message, true);
    });
    appEvents.on('streaming:chunk', function(data: { messageId: string; chunk: string }) {
      if (data.messageId !== self.streamingMessageId) return;
      var msgEl = self.container.querySelector('#msg-' + data.messageId);
      var content = msgEl?.querySelector('.raw-content, .dialogue-wrapper');
      if (content) content.textContent += data.chunk;
    });
    appEvents.on('streaming:end', function(data: { messageId: string }) {
      var msgEl = self.container.querySelector('#msg-' + data.messageId);
      if (msgEl) {
        msgEl.classList.remove('streaming');
        var indicator = msgEl.querySelector('.streaming-indicator');
        if (indicator) indicator.remove();
      }
      self.streamingMessageId = null;
    });

    // Background processing indicators
    appEvents.on('auto-scenario:started', function() { self.showBackgroundIndicator(); });
    appEvents.on('auto-scenario:paused', function() { self.hideBackgroundIndicator(); });
    appEvents.on('turn-queue:processing', function(data: { isProcessing: boolean }) {
      if (data.isProcessing) {
        self.showBackgroundIndicator();
      } else {
        self.hideBackgroundIndicator();
      }
    });
  }

  /** Toggle whisper picker overlay */
  private toggleWhisperPicker(): void {
    var overlay = this.container.querySelector('#whisper-picker-overlay') as HTMLElement;
    if (overlay) {
      overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
    }
  }

  private hideWhisperPicker(): void {
    var overlay = this.container.querySelector('#whisper-picker-overlay') as HTMLElement;
    if (overlay) overlay.style.display = 'none';
  }

  /** Select whisper target and activate whisper mode */
  private selectWhisperTarget(characterId: string): void {
    this.isWhisperMode = true;
    this.whisperTargetIds = [characterId];
    
    var character = characterStore.get(characterId);
    var targetNameEl = this.container.querySelector('#whisper-target-name');
    if (targetNameEl && character) {
      targetNameEl.textContent = character.name;
    }
    
    var indicator = this.container.querySelector('#whisper-indicator') as HTMLElement;
    if (indicator) indicator.style.display = 'flex';
    
    var whisperBtn = this.container.querySelector('#btn-whisper');
    if (whisperBtn) whisperBtn.classList.add('active');
    
    var input = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    if (input) input.placeholder = 'Whisper to ' + (character ? character.name : 'character') + '...';
    
    this.hideWhisperPicker();
    appEvents.emit('toast', { message: 'Whisper mode active', type: 'info' });
  }

  /** Cancel whisper mode */
  private cancelWhisper(): void {
    this.isWhisperMode = false;
    this.whisperTargetIds = [];
    
    var indicator = this.container.querySelector('#whisper-indicator') as HTMLElement;
    if (indicator) indicator.style.display = 'none';
    
    var whisperBtn = this.container.querySelector('#btn-whisper');
    if (whisperBtn) whisperBtn.classList.remove('active');
    
    var input = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    if (input) input.placeholder = this.layoutMode === 'dm' ? 'Message privately...' : 'Type your message...';
  }

  /** Show background processing indicator */
  private showBackgroundIndicator(): void {
    this.isProcessingBackground = true;
    var indicator = this.container.querySelector('#bg-indicator') as HTMLElement;
    if (indicator) indicator.style.display = 'flex';
    
    var autoBtn = this.container.querySelector('#btn-auto-scenario');
    if (autoBtn) autoBtn.classList.add('active');
  }

  /** Hide background processing indicator */
  private hideBackgroundIndicator(): void {
    this.isProcessingBackground = false;
    var indicator = this.container.querySelector('#bg-indicator') as HTMLElement;
    if (indicator) indicator.style.display = 'none';
    
    if (!this.scenario.settings.autoScenario) {
      var autoBtn = this.container.querySelector('#btn-auto-scenario');
      if (autoBtn) autoBtn.classList.remove('active');
    }
  }

  private async sendMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    var input = this.container.querySelector('#message-input') as HTMLTextAreaElement;
    if (input) input.value = '';

    var actions: string[] = [];
    var dialogue = '';

    var actionRegex = /\*([^*]+)\*/g;
    var match;
    while ((match = actionRegex.exec(content)) !== null) {
      actions.push(match[1].trim());
    }

    var dialogueRegex = /\"([^\"]+)\"/g;
    while ((match = dialogueRegex.exec(content)) !== null) {
      dialogue = match[1];
    }

    // Pass whisper data if active
    await chatStore.sendUserMessage(
      content.trim(), 
      dialogue, 
      actions,
      this.isWhisperMode,
      this.whisperTargetIds
    );

    // Reset whisper after sending
    if (this.isWhisperMode) {
      this.cancelWhisper();
    }
  }

  private async handleMessageAction(action: string, msg: Message): Promise<void> {
    switch (action) {
      case 'image':
        try {
          appEvents.emit('toast', { message: 'Generating...', type: 'info' });
          var url = await generateImage('Scene: ' + msg.content.slice(0, 200));
          this.modal.show({ title: 'Generated', content: '<img src="' + url + '" style="max-width: 100%; border-radius: 8px;" />', showCancel: false, confirmText: 'Close' });
        } catch (e) {
          appEvents.emit('toast', { message: 'Image failed', type: 'error' });
        }
        break;
      case 'branch':
        try {
          var branched = await scenarioStore.branch(this.scenario.id);
          appEvents.emit('toast', { message: 'Created ' + (branched ? branched.name : 'branch'), type: 'success' });
        } catch (e) {
          appEvents.emit('toast', { message: 'Branch failed', type: 'error' });
        }
        break;
      case 'voice':
        appEvents.emit('toast', { message: 'Voice coming soon', type: 'info' });
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