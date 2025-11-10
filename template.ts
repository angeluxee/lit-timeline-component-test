import { html } from 'lit';
import { TimelineComponent } from './component.js';

/**
 * Template for Timeline Component
 * Contains the HTML structure of the component
 */
export function template(this: TimelineComponent) {
  return html`
    <div class="timeline-container">
      <h2 class="timeline-title">${this.title}</h2>
      
      <div class="timeline">
        ${this.events.length > 0
          ? this.events.map(
              (event) => html`
                <div class="timeline-item">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <div class="timeline-date">${event.date}</div>
                    <h3 class="timeline-item-title">${event.title}</h3>
                    <p class="timeline-description">${event.description}</p>
                  </div>
                </div>
              `
            )
          : html`<p class="timeline-empty">No events to display</p>`}
      </div>
    </div>
  `;
}
