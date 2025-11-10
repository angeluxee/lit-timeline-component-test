import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { template } from './template.js';
import stylesText from './styles.scss?inline';

/**
 * Tipos de eventos obstétricos
 */
export type EventType = 'visita' | 'prueba' | 'urgencia' | 'ingreso' | 'parto' | 'puerperio';

/**
 * Interfaz para eventos obstétricos
 */
export interface ObstetricEvent {
  id: string;
  type: EventType;
  date: Date;
  title: string;
  description: string;
  week: number;
}

/**
 * Interfaz para eventos agrupados en la misma semana
 */
export interface GroupedEvent {
  week: number;
  events: ObstetricEvent[];
  position: number; // Para staggering vertical
}

/**
 * Configuración de colores por tipo de evento
 */
export const EVENT_COLORS: Record<EventType, string> = {
  visita: '#2196F3',      // Azul
  prueba: '#4CAF50',      // Verde
  urgencia: '#F44336',    // Rojo
  ingreso: '#FF9800',     // Naranja
  parto: '#FFD700',       // Dorado
  puerperio: '#CE93D8',   // Lila
};

/**
 * Etiquetas legibles por tipo de evento
 */
export const EVENT_LABELS: Record<EventType, string> = {
  visita: 'Visita',
  prueba: 'Prueba',
  urgencia: 'Urgencia',
  ingreso: 'Ingreso',
  parto: 'Parto',
  puerperio: 'Puerperio',
};

/**
 * Timeline Obstétrico Component
 * Componente profesional para visualizar el timeline de un embarazo
 */
@customElement('obstetric-timeline')
export class ObstetricTimeline extends LitElement {
  static styles = unsafeCSS(stylesText);

  // Propiedades públicas
  @property({ type: Object })
  startDate: Date = new Date('2025-02-12');

  @property({ type: Object })
  expectedDeliveryDate: Date = new Date('2025-11-20');

  @property({ type: Number })
  currentWeek: number = 16;

  @property({ type: Array })
  events: ObstetricEvent[] = [];

  // Estado interno
  @state()
  private activeFilters: Set<EventType> = new Set(['visita', 'prueba', 'urgencia', 'ingreso', 'parto', 'puerperio']);

  @state()
  private showHistorical: boolean = true;

  @state()
  private selectedEvent: ObstetricEvent | null = null;

  @state()
  private selectedGroup: GroupedEvent | null = null;

  @state()
  private overlayPosition: { x: number; y: number } | null = null;

  /**
   * Calcula la semana de gestación para una fecha dada
   */
  getWeekFromDate(date: Date): number {
    const diffTime = date.getTime() - this.startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
  }

  /**
   * Obtiene la fecha actual
   */
  get today(): Date {
    return new Date();
  }

  /**
   * Calcula la semana actual basada en hoy
   */
  get todayWeek(): number {
    return this.getWeekFromDate(this.today);
  }

  /**
   * Filtra eventos según los filtros activos
   */
  get filteredEvents(): ObstetricEvent[] {
    return this.events.filter(event => {
      const typeMatch = this.activeFilters.has(event.type);
      const dateMatch = this.showHistorical || event.date <= this.today;
      return typeMatch && dateMatch;
    });
  }

  /**
   * Agrupa eventos por semana y calcula posiciones para staggering
   */
  get groupedEvents(): Map<number, GroupedEvent> {
    const groups = new Map<number, GroupedEvent>();

    this.filteredEvents.forEach(event => {
      if (!groups.has(event.week)) {
        groups.set(event.week, {
          week: event.week,
          events: [],
          position: 0,
        });
      }
      groups.get(event.week)!.events.push(event);
    });

    // Calcular posiciones para staggering
    groups.forEach((group, week) => {
      group.events.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    return groups;
  }

  /**
   * Maneja el toggle de filtros de tipo de evento
   */
  toggleFilter(type: EventType) {
    if (this.activeFilters.has(type)) {
      this.activeFilters.delete(type);
    } else {
      this.activeFilters.add(type);
    }
    this.activeFilters = new Set(this.activeFilters);
    this.requestUpdate();
  }

  /**
   * Maneja el toggle del filtro histórico
   */
  toggleHistorical() {
    this.showHistorical = !this.showHistorical;
    this.requestUpdate();
  }

  /**
   * Maneja el clic en un evento individual
   */
  handleEventClick(event: ObstetricEvent, clickEvent: MouseEvent) {
    clickEvent.stopPropagation();
    const target = clickEvent.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.selectedEvent = event;
    this.selectedGroup = null;
    this.overlayPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top,
    };
    this.requestUpdate();
  }

  /**
   * Maneja el clic en un grupo de eventos
   */
  handleGroupClick(group: GroupedEvent, clickEvent: MouseEvent) {
    clickEvent.stopPropagation();
    const target = clickEvent.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.selectedGroup = group;
    this.selectedEvent = null;
    this.overlayPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top,
    };
    this.requestUpdate();
  }

  /**
   * Cierra el overlay
   */
  closeOverlay() {
    this.selectedEvent = null;
    this.selectedGroup = null;
    this.overlayPosition = null;
    this.requestUpdate();
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Maneja el clic en el fondo para cerrar overlay
   */
  handleBackgroundClick() {
    this.closeOverlay();
  }

  render() {
    return template.call(this);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'obstetric-timeline': ObstetricTimeline;
  }
}
