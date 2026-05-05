// ===== BASE COMPONENT =====
export abstract class Component {
  protected element: HTMLElement;
  protected parent: HTMLElement;
  protected isDestroyed = false;

  constructor(parent: HTMLElement, tag = 'div', className = '') {
    this.parent = parent;
    this.element = document.createElement(tag);
    if (className) {
      this.element.className = className;
    }
    parent.appendChild(this.element);
  }

  protected abstract render(): void;
  
  protected onMount(): void {}
  
  protected onUnmount(): void {}

  destroy(): void {
    if (this.isDestroyed) return;
    this.onUnmount();
    this.element.remove();
    this.isDestroyed = true;
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
