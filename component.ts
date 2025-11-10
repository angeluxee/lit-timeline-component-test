import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { template } from './template.js';
import styles from './styles.scss';

/**
 * Timeline Component
 * A Lit component for displaying timeline events
 */
@customElement('timeline-component')
export class TimelineComponent extends LitElement {
  static styles = styles;

  @property({ type: String })
  title = 'Timeline';

  @property({ type: Array })
  events: Array<{ date: string; title: string; description: string }> = [];

  render() {
    return template.call(this);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'timeline-component': TimelineComponent;
  }
}
