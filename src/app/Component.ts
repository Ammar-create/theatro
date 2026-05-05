// ===== BASE COMPONENT CLASS =====
export abstract class Component {
  protected element: HTMLElement;
  protected listeners: Map<HTMLElement, Map<string, Function>> = new Map();

  constructor(element: HTMLElement) {
    this.element = element;
  }

  protected attachEvent(
    target: HTMLElement, 
    event: string, 
    handler: EventListener
  ): void {
    if (!this.listeners.has(target)) {
      this.listeners.set(target, new Map());
    }
    target.addEventListener(event, handler as EventListener);
    this.listeners.get(target)!.set(event, handler);
  }

  protected removeAllListeners(): void {
    this.listeners.forEach((handlers, target) => {
      handlers.forEach((handler, event) => {
        target.removeEventListener(event, handler as EventListener);
      });
    });
    this.listeners.clear();
  }

  abstract render(): void;
  
  destroy(): void {
    this.removeAllListeners();
    this.element.innerHTML = '';
  }
}
