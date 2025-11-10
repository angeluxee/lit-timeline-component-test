import { html } from 'lit';
import { ObstetricTimelineHighcharts, EVENT_COLORS, EVENT_LABELS } from './component.js';
import type { ObstetricEvent } from './component.js';

/**
 * Renderiza el encabezado con información del embarazo
 */
function renderHeader(this: ObstetricTimelineHighcharts) {
  return html`
    <div class="timeline-header">
      <h1 class="timeline-title">
        Embarazo actual
        <span class="timeline-dates">
          (inicio: ${this.formatDate(this.startDate)} – parto previsto: ${this.formatDate(this.expectedDeliveryDate)})
        </span>
      </h1>
    </div>
  `;
}

/**
 * Renderiza la barra de filtros
 */
function renderFilters(this: ObstetricTimelineHighcharts) {
  const filterButtons = [
    { type: 'visita', label: 'Visitas' },
    { type: 'prueba', label: 'Pruebas' },
    { type: 'urgencia', label: 'Urgencias' },
    { type: 'ingreso', label: 'Ingresos' },
  ] as const;

  return html`
    <div class="filter-bar">
      ${filterButtons.map(
        ({ type, label }) => html`
          <button
            class="filter-button ${this.activeFilters.has(type) ? 'active' : ''}"
            @click=${() => this.toggleFilter(type)}
            style="--filter-color: ${EVENT_COLORS[type]}"
          >
            <span class="filter-checkbox">${this.activeFilters.has(type) ? '☑' : '☐'}</span>
            ${label}
          </button>
        `
      )}
      <button
        class="filter-button ${this.showHistorical ? 'active' : ''}"
        @click=${() => this.toggleHistorical()}
      >
        <span class="filter-checkbox">${this.showHistorical ? '☑' : '☐'}</span>
        Histórico
      </button>
    </div>
  `;
}

/**
 * Renderiza la leyenda de tipos de eventos
 */
function renderLegend(this: ObstetricTimelineHighcharts) {
  return html`
    <div class="legend-container">
      ${Object.entries(EVENT_COLORS).map(
        ([type, color]) => html`
          <div class="legend-item">
            <span class="legend-marker" style="background-color: ${color}"></span>
            <span class="legend-label">${EVENT_LABELS[type as keyof typeof EVENT_LABELS]}</span>
          </div>
        `
      )}
    </div>
  `;
}

/**
 * Renderiza el overlay con detalles del evento
 */
function renderOverlay(this: ObstetricTimelineHighcharts) {
  if (!this.selectedEvent) return '';

  const event = this.selectedEvent;
  const color = EVENT_COLORS[event.type];

  return html`
    <div class="overlay-backdrop" @click=${() => this.closeOverlay()}>
      <div
        class="event-overlay"
        @click=${(e: Event) => e.stopPropagation()}
        style="
          --event-color: ${color};
          ${this.overlayPosition
            ? `left: ${this.overlayPosition.x}px; top: ${this.overlayPosition.y}px;`
            : ''}
        "
      >
        <button class="overlay-close" @click=${() => this.closeOverlay()}>×</button>

        <div class="overlay-header">
          <div class="overlay-type" style="background-color: ${color}">
            ${EVENT_LABELS[event.type]}
          </div>
          <div class="overlay-date">Semana ${event.week} - ${this.formatDate(event.date)}</div>
        </div>

        <div class="overlay-content">
          <h3 class="overlay-title">${event.title}</h3>
          <p class="overlay-description">${event.description}</p>
        </div>

        <div class="overlay-actions">
          <button class="btn-primary">Ver informe</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Template principal del Timeline Obstétrico con Highcharts
 */
export function template(this: ObstetricTimelineHighcharts) {
  return html`
    <div class="obstetric-timeline" @click=${() => this.closeOverlay()}>
      ${renderHeader.call(this)}
      ${renderFilters.call(this)}

      <div class="chart-wrapper">
        ${renderLegend.call(this)}
        <div id="chart-container" class="chart-container"></div>
      </div>

      ${renderOverlay.call(this)}
    </div>
  `;
}
