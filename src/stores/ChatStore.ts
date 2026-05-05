/** Send a message from the user's character into the active turn queue */
  async sendUserMessage(
    content: string,
    dialogue: string,
    actions: string[]
  ): Promise<void> {
    if (!this.currentScenario || !this.turnQueue) {
      appEvents.emit('toast', { message: 'No active scenario', type: 'error' });
      return;
    }

    // Detect the user character — lazy import to avoid circular deps
    const { characterStore } = await import('./CharacterStore.js');
    const userChar = await characterStore.getUserCharacter();
    const userCharId = userChar?.id || this.currentScenario.characterIds[0];

    // Push into turn queue — the TurnQueueManager will create the message
    this.turnQueue.addToQueue({
      id: `user_${Date.now()}`,
      type: 'user',
      characterId: userCharId,
      content,
      actions,
      dialogue,
      timestamp: Date.now()
    });

    appEvents.emit('message:sent', { content, dialogue, actions });
  }