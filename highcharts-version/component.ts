import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import * as Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';
import { template } from './template.js';
import stylesText from './styles.scss?inline';

// Inicializar módulos de Highcharts
HighchartsMore(Highcharts);

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
 * Configuración de colores por tipo de evento (tonos pastel)
 */
export const EVENT_COLORS: Record<EventType, string> = {
  visita: 'rgba(135, 206, 250, 0.7)',      // Azul cielo pastel
  prueba: 'rgba(152, 251, 152, 0.7)',      // Verde pastel
  urgencia: 'rgba(255, 182, 193, 0.7)',    // Rosa pastel
  ingreso: 'rgba(255, 218, 185, 0.7)',     // Melocotón pastel
  parto: 'rgba(255, 239, 153, 0.7)',       // Amarillo pastel
  puerperio: 'rgba(221, 160, 221, 0.7)',   // Lila pastel
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
   * Prepara los datos para Highcharts con posiciones Y dinámicas y agrupación
   */
  private prepareChartData() {
    const series: any[] = [];
    const eventsByType: Record<string, any[]> = {
      visita: [],
      prueba: [],
      urgencia: [],
      ingreso: [],
      parto: [],
      puerperio: [],
    };

    // Agrupar eventos por tipo
    this.filteredEvents.forEach(event => {
      if (!eventsByType[event.type]) {
        eventsByType[event.type] = [];
      }
      eventsByType[event.type].push(event);
    });

    // Determinar qué tipos existen y asignarles posiciones Y dinámicas
    // Orden de prioridad para las filas (de arriba a abajo)
    const typeOrder: EventType[] = ['visita', 'prueba', 'urgencia', 'ingreso', 'parto', 'puerperio'];
    const existingTypes = typeOrder.filter(type => eventsByType[type].length > 0);
    const dynamicYPositions: Record<string, number> = {};

    existingTypes.forEach((type, index) => {
      dynamicYPositions[type] = existingTypes.length - 1 - index;
    });

    // Crear series para cada tipo de evento que existe
    existingTypes.forEach(type => {
      const yPosition = dynamicYPositions[type];

      // Agrupar eventos del mismo tipo por semana
      const eventsByWeek: Record<number, ObstetricEvent[]> = {};
      eventsByType[type].forEach(event => {
        if (!eventsByWeek[event.week]) {
          eventsByWeek[event.week] = [];
        }
        eventsByWeek[event.week].push(event);
      });

      // Crear puntos agrupados
      const data = Object.entries(eventsByWeek).map(([week, events]) => {
        const weekNum = parseInt(week);
        const isGrouped = events.length > 1;

        return {
          x: weekNum,
          y: yPosition,
          name: isGrouped ? `${events.length} eventos` : events[0].title,
          description: isGrouped
            ? events.map(e => e.title).join(', ')
            : events[0].description,
          date: this.formatDate(events[0].date),
          eventData: events[0],
          groupedEvents: events, // Almacenar todos los eventos del grupo
          isGrouped: isGrouped,
          count: events.length,
          marker: {
            fillColor: EVENT_COLORS[type],
            lineWidth: 2,
            lineColor: 'rgba(255, 255, 255, 0.8)',
            radius: isGrouped ? 12 : 9, // Marcador más grande si está agrupado
          },
          dataLabels: {
            enabled: isGrouped,
            format: '{point.count}',
            style: {
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 'bold',
              textOutline: 'none',
            },
            y: 1,
          },
        };
      });

      series.push({
        type: 'scatter',
        name: EVENT_LABELS[type],
        data: data,
        color: EVENT_COLORS[type],
        marker: {
          symbol: 'circle',
        },
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
        },
      });
    });

    return { series, rowCount: existingTypes.length };
  }

  /**
   * Crea o actualiza el gráfico de Highcharts
   */
  private createChart() {
    if (!this.chartContainer) return;

    const self = this;
    const { series, rowCount } = this.prepareChartData();

    // Calcular altura dinámica: 80px base + 60px por fila
    const dynamicHeight = Math.max(250, 80 + rowCount * 60);

    this.chart = Highcharts.chart(this.chartContainer, {
      chart: {
        type: 'scatter',
        height: dynamicHeight,
        backgroundColor: '#ffffff',
        spacing: [20, 20, 20, 20],
      },
      title: {
        text: '',
      },
      credits: {
        enabled: false,
      },
      legend: {
        enabled: false,
      },
      xAxis: {
        min: 0,
        max: 46,
        tickInterval: 4,
        gridLineWidth: 1,
        gridLineColor: '#e1e8ed',
        lineColor: '#e1e8ed',
        tickColor: '#e1e8ed',
        title: {
          text: 'Semanas de gestación',
          style: {
            color: '#7b8a9a',
            fontSize: '13px',
            fontWeight: '600',
          },
        },
        labels: {
          style: {
            color: '#2c3e50',
            fontSize: '12px',
            fontWeight: '600',
          },
        },
        plotBands: [
          {
            from: 41,
            to: 46,
            color: 'rgba(221, 160, 221, 0.2)',
            label: {
              text: 'Puerperio',
              align: 'center',
              verticalAlign: 'top',
              y: -10,
              style: {
                color: 'rgba(156, 39, 176, 0.9)',
                fontWeight: '600',
                fontSize: '13px',
              },
            },
          },
        ],
        plotLines: [
          {
            value: this.todayWeek,
            color: 'rgba(135, 206, 250, 0.8)',
            width: 3,
            zIndex: 5,
            label: {
              text: 'Hoy',
              style: {
                color: '#ffffff',
                backgroundColor: 'rgba(135, 206, 250, 0.9)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: '600',
              },
            },
          },
          {
            value: 40,
            color: 'rgba(255, 239, 153, 0.9)',
            width: 3,
            zIndex: 4,
            label: {
              text: 'Parto previsto',
              style: {
                color: '#5a5a5a',
                backgroundColor: 'rgba(255, 239, 153, 0.95)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: '600',
              },
            },
          },
        ],
      },
      yAxis: {
        title: {
          text: '',
        },
        min: -0.5,
        max: rowCount - 0.5,
        gridLineWidth: 1,
        gridLineColor: '#f0f0f0',
        labels: {
          enabled: false,
        },
      },
      tooltip: {
        useHTML: true,
        backgroundColor: '#ffffff',
        borderColor: '#e1e8ed',
        borderRadius: 8,
        padding: 12,
        shadow: true,
        formatter: function () {
          const point: any = this.point;

          if (point.isGrouped && point.groupedEvents) {
            // Tooltip para eventos agrupados
            const eventsList = point.groupedEvents
              .map((event: ObstetricEvent) => `
                <div style="padding: 4px 0; border-bottom: 1px solid #f0f0f0;">
                  <div style="font-weight: 600; color: #2c3e50; font-size: 12px;">
                    ${event.title}
                  </div>
                  <div style="color: #7b8a9a; font-size: 11px;">
                    ${self.formatDate(event.date)}
                  </div>
                </div>
              `)
              .join('');

            return `
              <div style="min-width: 220px; max-width: 300px;">
                <div style="background: ${point.marker.fillColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">
                  ${this.series.name} - Semana ${point.x}
                </div>
                <div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px; font-size: 13px;">
                  ${point.count} eventos
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                  ${eventsList}
                </div>
              </div>
            `;
          } else {
            // Tooltip para evento individual
            return `
              <div style="min-width: 200px;">
                <div style="background: ${point.marker.fillColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">
                  ${this.series.name}
                </div>
                <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">
                  ${point.name}
                </div>
                <div style="color: #7b8a9a; font-size: 12px;">
                  Semana ${point.x} - ${point.date}
                </div>
              </div>
            `;
          }
        },
      },
      plotOptions: {
        scatter: {
          jitter: {
            x: 0,
            y: 0,
          },
          marker: {
            states: {
              hover: {
                enabled: true,
                lineColor: '#666',
                lineWidth: 2,
                radiusPlus: 4,
              },
            },
          },
          point: {
            events: {
              click: function (e: any) {
                const eventData = (this as any).options.eventData;
                if (eventData) {
                  self.selectedEvent = eventData;
                  self.overlayPosition = {
                    x: e.pageX,
                    y: e.pageY,
                  };
                  self.requestUpdate();
                }
              },
            },
          },
        },
      },
      series: series,
    } as any);
  }

  /**
   * Actualiza el gráfico con nuevos datos
   */
  private updateChart() {
    if (this.chart) {
      const { series, rowCount } = this.prepareChartData();

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
