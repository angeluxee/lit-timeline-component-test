import { html } from 'lit';
import { ObstetricTimelineHighcharts, EVENT_COLORS, EVENT_LABELS } from './component.js';

const CLINICAL_TYPES = ['visita', 'prueba', 'urgencia', 'ingreso'] as const;

export function template(this: ObstetricTimelineHighcharts) {
  return html`
    <div class="obstetric-timeline" @click=${() => this.closeOverlay()}>
      <!-- Header -->
      <div class="timeline-header">
        <h1 class="timeline-title">
          Embarazo actual
          <span class="timeline-dates">
            (inicio: ${this.formatDate(this.startDate)} – parto previsto: ${this.formatDate(this.expectedDeliveryDate)})
          </span>
        </h1>
      </div>

      <!-- Chart with legend -->
      <div class="chart-wrapper">
        <div class="legend-container">
          ${CLINICAL_TYPES.map(type => html`
            <div
              class="legend-item ${this.activeFilters.has(type) ? 'active' : 'inactive'}"
              @click=${() => this.toggleFilter(type)}
            >
              <span class="legend-marker" style="background-color: ${EVENT_COLORS[type]}"></span>
              <span class="legend-label">${EVENT_LABELS[type]}</span>
            </div>
          `)}
        </div>
        <div id="chart-container" class="chart-container"></div>
      </div>

      <!-- Event overlay -->
      ${this.selectedEvent ? html`
        <div class="overlay-backdrop" @click=${() => this.closeOverlay()}>
          <div
            class="event-overlay"
            @click=${(e: Event) => e.stopPropagation()}
            style="
              --event-color: ${EVENT_COLORS[this.selectedEvent.type]};
              ${this.overlayPosition ? `left: ${this.overlayPosition.x}px; top: ${this.overlayPosition.y}px;` : ''}
            "
          >
            <button class="overlay-close" @click=${() => this.closeOverlay()}>×</button>
            <div class="overlay-header">
              <div class="overlay-type" style="background-color: ${EVENT_COLORS[this.selectedEvent.type]}">
                ${EVENT_LABELS[this.selectedEvent.type]}
              </div>
              <div class="overlay-date">Semana ${this.selectedEvent.week} - ${this.formatDate(this.selectedEvent.date)}</div>
            </div>
            <div class="overlay-content">
              <h3 class="overlay-title">${this.selectedEvent.title}</h3>
              <p class="overlay-description">${this.selectedEvent.description}</p>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
