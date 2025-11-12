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

// Re-exportar tipos y constantes
export type { ObstetricEvent, EventType };
export { EVENT_COLORS, EVENT_LABELS };

@customElement('obstetric-timeline-highcharts')
export class ObstetricTimelineHighcharts extends LitElement {
  static styles = unsafeCSS(stylesText);

  @query('#chart-container')
  chartContainer!: HTMLElement;

  private chart: Highcharts.Chart | null = null;

  @property({ type: Object })
  startDate: Date = new Date('2025-02-12');

  @property({ type: Object })
  expectedDeliveryDate: Date = new Date('2025-11-20');

  @property({ type: Array })
  events: ObstetricEvent[] = [];

  @state()
  private activeFilters: Set<EventType> = new Set(['visita', 'prueba', 'urgencia', 'ingreso']);

  @state()
  private showHistorical: boolean = true;

  @state()
  private selectedEvent: ObstetricEvent | null = null;

  @state()
  private overlayPosition: { x: number; y: number } | null = null;

  get todayWeek(): number {
    const diffDays = Math.floor((Date.now() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
  }

  get filteredEvents(): ObstetricEvent[] {
    const now = Date.now();
    return this.events.filter(event => {
      const isAlwaysVisible = event.type === 'parto' || event.type === 'puerperi';
      const typeMatch = isAlwaysVisible || this.activeFilters.has(event.type);
      const dateMatch = this.showHistorical || event.date.getTime() <= now;
      return typeMatch && dateMatch;
    });
  }

  toggleFilter(type: EventType) {
    this.activeFilters.has(type) ? this.activeFilters.delete(type) : this.activeFilters.add(type);
    this.activeFilters = new Set(this.activeFilters);
    this.updateChart();
  }

  toggleHistorical() {
    this.showHistorical = !this.showHistorical;
    this.updateChart();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  closeOverlay() {
    this.selectedEvent = null;
    this.overlayPosition = null;
  }

  private handlePointClick = (eventData: ObstetricEvent, pageX: number, pageY: number) => {
    this.selectedEvent = eventData;
    this.overlayPosition = { x: pageX, y: pageY };
    this.requestUpdate();
  };

  private createOrUpdateChart() {
    if (!this.chartContainer) return;

    const { series, rowCount } = prepareChartData({
      filteredEvents: this.filteredEvents,
      formatDate: this.formatDate.bind(this),
    });

    if (!this.chart) {
      const config = createChartConfig({
        container: this.chartContainer,
        series,
        rowCount,
        todayWeek: this.todayWeek,
        formatDate: this.formatDate.bind(this),
        onPointClick: this.handlePointClick,
      });
      this.chart = Highcharts.chart(this.chartContainer, config);
    } else {
      const dynamicHeight = Math.max(250, 80 + rowCount * 60);
      this.chart.setSize(undefined, dynamicHeight, false);
      this.chart.yAxis[0].update({ min: -0.5, max: rowCount - 0.5 }, false);

      while (this.chart.series.length > 0) {
        this.chart.series[0].remove(false);
      }

      series.forEach(s => this.chart!.addSeries(s, false));
      this.chart.redraw();
    }
  }

  private updateChart() {
    this.createOrUpdateChart();
  }

  protected firstUpdated() {
    this.createOrUpdateChart();
  }

  protected updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('events')) {
      this.updateChart();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.chart?.destroy();
    this.chart = null;
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
