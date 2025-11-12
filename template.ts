import { html } from 'lit';
import { ObstetricTimeline, EVENT_COLORS, EVENT_LABELS } from './component.js';
import type { GroupedEvent, ObstetricEvent } from './component.js';

/**
 * Renderiza el encabezado con información del embarazo
 */
function renderHeader(this: ObstetricTimeline) {
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
function renderFilters(this: ObstetricTimeline) {
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
 * Renderiza las marcas de semana en el eje temporal
 */
function renderWeekMarkers() {
  const weeks = [];
  for (let week = 0; week <= 46; week++) {
    weeks.push(week);
  }

  return html`
    <div class="week-markers">
      ${weeks.map(
    (week) => html`
          <div class="week-marker" style="left: ${(week / 46) * 100}%">
            ${week % 4 === 0
        ? html`<span class="week-label">${week}</span>`
        : html`<span class="week-tick">|</span>`}
          </div>
        `
  )}
    </div>
  `;
}

/**
 * Renderiza el eje temporal principal
 */
function renderTimeAxis(this: ObstetricTimeline) {
  return html`
    <div class="time-axis">
      <!-- Línea base del timeline -->
      <div class="timeline-line"></div>

      <!-- Zona de Puerperi (semanas 41-46) -->
      <div class="puerperium-zone" style="left: ${(41 / 46) * 100}%; width: ${(5 / 46) * 100}%">
        <span class="puerperium-label">Puerperi</span>
      </div>

      <!-- Línea vertical "Hoy" -->
      ${this.todayWeek >= 0 && this.todayWeek <= 46
      ? html`
            <div class="today-line" style="left: ${(this.todayWeek / 46) * 100}%">
              <span class="today-label">Hoy</span>
            </div>
          `
      : ''}

      <!-- Línea vertical "Parto previsto" en semana 40 -->
      <div class="expected-delivery-line" style="left: ${(40 / 46) * 100}%">
        <span class="expected-delivery-label">Parto previsto</span>
      </div>
    </div>
  `;
}

/**
 * Renderiza un evento individual
 */
function renderEvent(this: ObstetricTimeline, event: ObstetricEvent, index: number, total: number) {
  const color = EVENT_COLORS[event.type];
  const offsetY = total > 1 ? (index % 3) * 30 - 30 : 0; // Staggering vertical

  return html`
    <div
      class="event-marker"
      style="
        left: ${(event.week / 46) * 100}%;
        background-color: ${color};
        border-color: ${color};
        transform: translateY(${offsetY}px);
      "
      @click=${(e: MouseEvent) => this.handleEventClick(event, e)}
      title="${EVENT_LABELS[event.type]}: ${event.title}"
    ></div>
  `;
}

/**
 * Renderiza un grupo de eventos (badge con +n)
 */
function renderEventGroup(this: ObstetricTimeline, group: GroupedEvent) {
  if (group.events.length === 0) return '';

  // Si hay 3 o menos eventos, renderizarlos individualmente con staggering
  if (group.events.length <= 3) {
    return html`
      ${group.events.map((event, index) => renderEvent.call(this, event, index, group.events.length))}
    `;
  }

  // Si hay más de 3, mostrar un badge agrupado
  const primaryColor = EVENT_COLORS[group.events[0].type];
  return html`
    <div
      class="event-group-marker"
      style="
        left: ${(group.week / 46) * 100}%;
        background-color: ${primaryColor};
        border-color: ${primaryColor};
      "
      @click=${(e: MouseEvent) => this.handleGroupClick(group, e)}
    >
      <span class="event-badge">+${group.events.length}</span>
    </div>
  `;
}

/**
 * Renderiza todos los eventos en el timeline
 */
function renderEvents(this: ObstetricTimeline) {
  return html`
    <div class="events-container">
      ${Array.from(this.groupedEvents.values()).map((group) => renderEventGroup.call(this, group))}
    </div>
  `;
}

/**
 * Renderiza el overlay con detalles del evento
 */
function renderOverlay(this: ObstetricTimeline) {
  if (!this.selectedEvent && !this.selectedGroup) return '';

  // Overlay para evento individual
  if (this.selectedEvent) {
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

  // Overlay para grupo de eventos
  if (this.selectedGroup) {
    const group = this.selectedGroup;

    return html`
      <div class="overlay-backdrop" @click=${() => this.closeOverlay()}>
        <div
          class="event-overlay event-overlay-group"
          @click=${(e: Event) => e.stopPropagation()}
          style="
            ${this.overlayPosition
        ? `left: ${this.overlayPosition.x}px; top: ${this.overlayPosition.y}px;`
        : ''}
          "
        >
          <button class="overlay-close" @click=${() => this.closeOverlay()}>×</button>

          <div class="overlay-header">
            <h3 class="overlay-title">Eventos en semana ${group.week}</h3>
            <div class="overlay-count">${group.events.length} eventos</div>
          </div>

          <div class="overlay-content">
            <div class="event-list">
              ${group.events.map(
          (event) => {
            const color = EVENT_COLORS[event.type];
            return html`
                    <div class="event-list-item" @click=${(e: MouseEvent) => this.handleEventClick(event, e)}>
                      <div class="event-list-marker" style="background-color: ${color}"></div>
                      <div class="event-list-content">
                        <div class="event-list-type">${EVENT_LABELS[event.type]}</div>
                        <div class="event-list-title">${event.title}</div>
                        <div class="event-list-date">${this.formatDate(event.date)}</div>
                      </div>
                    </div>
                  `;
          }
        )}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return '';
}

/**
 * Template principal del Timeline Obstétrico
 */
export function template(this: ObstetricTimeline) {
  return html`
    <div class="obstetric-timeline" @click=${() => this.handleBackgroundClick()}>
      ${renderHeader.call(this)} ${renderFilters.call(this)}

      <div class="timeline-container">
        ${renderWeekMarkers()} ${renderTimeAxis.call(this)} ${renderEvents.call(this)}
      </div>

      ${renderOverlay.call(this)}
    </div>
  `;
}
