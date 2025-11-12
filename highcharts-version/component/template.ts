import { html } from 'lit';
import { ObstetricTimelineHighcharts, EVENT_COLORS, EVENT_LABELS } from './component.js';

const CLINICAL_TYPES = ['visita', 'prueba', 'urgencia', 'ingreso'] as const;

export function template(this: ObstetricTimelineHighcharts) {
  return html`
    <div class="obstetric-timeline" @click=${() => this.closeOverlay()}>
      <!-- Chart with integrated header -->
      <div class="chart-wrapper">
        <div class="integrated-header">
          <div class="medical-info">
            <div class="info-item">
              <span class="info-label">DUR</span>
              <span class="info-value">${this.formatDate(this.startDate)}</span>
              <span class="info-description">Data última regla</span>
            </div>
            <div class="info-separator">•</div>
            <div class="info-item">
              <span class="info-label">DPP</span>
              <span class="info-value">${this.formatDate(this.expectedDeliveryDate)}</span>
              <span class="info-description">Data prevista part</span>
            </div>
          </div>
          <div class="legends-group">
            <div class="line-legend">
              <div class="line-legend-item">
                <span class="line-legend-marker" style="background-color: rgba(135, 206, 250, 0.8);"></span>
                <span class="line-legend-label">Línia actual</span>
              </div>
              <div class="line-legend-item">
                <span class="line-legend-marker" style="background-color: rgba(255, 239, 153, 0.9);"></span>
                <span class="line-legend-label">Part previst</span>
              </div>
            </div>
            <div class="legend-separator"></div>
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
          </div>
        </div>
        <div class="chart-area">
          <div id="chart-container" class="chart-container"></div>
        </div>
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
              <div class="overlay-date">Setmana ${this.selectedEvent.week} - ${this.formatDate(this.selectedEvent.date)}</div>
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
