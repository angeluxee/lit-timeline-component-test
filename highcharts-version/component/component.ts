import { LitElement, unsafeCSS } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import * as Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsXRange from 'highcharts/modules/xrange';
import { template } from './template.js';
import stylesText from './styles.scss?inline';
import {
  ObstetricEvent,
  EventType,
  EVENT_COLORS,
  EVENT_LABELS,
  prepareChartData,
  createChartConfig,
} from './model.js';

// Inicializar módulos de Highcharts
HighchartsMore(Highcharts);
HighchartsXRange(Highcharts);

// Re-exportar tipos y constantes para uso externo
export type { ObstetricEvent, EventType };
export { EVENT_COLORS, EVENT_LABELS };

/**
 * Timeline Obstétrico Component con Highcharts
 */
@customElement('obstetric-timeline-highcharts')
export class ObstetricTimelineHighcharts extends LitElement {
  static styles = unsafeCSS(stylesText);

  @query('#chart-container')
  chartContainer!: HTMLElement;

  private chart: Highcharts.Chart | null = null;

  // Propiedades públicas
  @property({ type: Object })
  startDate: Date = new Date('2025-02-12');

  @property({ type: Object })
  expectedDeliveryDate: Date = new Date('2025-11-20');

  @property({ type: Number })
  currentWeek: number = 16;

  @property({ type: Array })
  events: ObstetricEvent[] = [];

  // Estado interno - Solo eventos clínicos filtrables (parto y puerperio siempre visibles)
  @state()
  private activeFilters: Set<EventType> = new Set(['visita', 'prueba', 'urgencia', 'ingreso']);

  @state()
  private showHistorical: boolean = true;

  @state()
  private selectedEvent: ObstetricEvent | null = null;

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
   * Los eventos de parto y puerperio siempre se muestran (no filtrables)
   */
  get filteredEvents(): ObstetricEvent[] {
    return this.events.filter(event => {
      // Parto y puerperio siempre visibles (hitos únicos)
      const isAlwaysVisible = event.type === 'parto' || event.type === 'puerperio';
      const typeMatch = isAlwaysVisible || this.activeFilters.has(event.type);
      const dateMatch = this.showHistorical || event.date <= this.today;
      return typeMatch && dateMatch;
    });
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
    this.updateChart();
  }

  /**
   * Maneja el toggle del filtro histórico
   */
  toggleHistorical() {
    this.showHistorical = !this.showHistorical;
    this.updateChart();
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
   * Cierra el overlay
   */
  closeOverlay() {
    this.selectedEvent = null;
    this.overlayPosition = null;
  }

  /**
   * Callback cuando se hace click en un punto del gráfico
   */
  private handlePointClick = (eventData: ObstetricEvent, pageX: number, pageY: number) => {
    this.selectedEvent = eventData;
    this.overlayPosition = { x: pageX, y: pageY };
    this.requestUpdate();
  };

  /**
   * Crea o actualiza el gráfico de Highcharts
   */
  private createChart() {
    if (!this.chartContainer) return;

    const { series, rowCount } = prepareChartData({
      filteredEvents: this.filteredEvents,
      formatDate: this.formatDate.bind(this),
    });

    const config = createChartConfig({
      container: this.chartContainer,
      series,
      rowCount,
      todayWeek: this.todayWeek,
      formatDate: this.formatDate.bind(this),
      onPointClick: this.handlePointClick,
    });

    this.chart = Highcharts.chart(this.chartContainer, config);
  }

  /**
   * Actualiza el gráfico con nuevos datos
   */
  private updateChart() {
    if (this.chart) {
      const { series, rowCount } = prepareChartData({
        filteredEvents: this.filteredEvents,
        formatDate: this.formatDate.bind(this),
      });

      // Actualizar altura del gráfico dinámicamente
      const dynamicHeight = Math.max(250, 80 + rowCount * 60);
      this.chart.setSize(undefined, dynamicHeight, false);

      // Actualizar el eje Y con el nuevo rango
      this.chart.yAxis[0].update({
        min: -0.5,
        max: rowCount - 0.5,
      }, false);

      // Remover series existentes
      while (this.chart.series.length > 0) {
        this.chart.series[0].remove(false);
      }

      // Añadir nuevas series
      series.forEach(s => {
        this.chart!.addSeries(s, false);
      });

      this.chart.redraw();
    }
  }

  /**
   * Lifecycle: Después de primera actualización
   */
  protected firstUpdated() {
    this.createChart();
  }

  /**
   * Lifecycle: Cuando se actualiza
   */
  protected updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('events')) {
      this.updateChart();
    }
  }

  /**
   * Lifecycle: Desconectar
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  render() {
    return template.call(this);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'obstetric-timeline-highcharts': ObstetricTimelineHighcharts;
  }
}
