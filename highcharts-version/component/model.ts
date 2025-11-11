import * as Highcharts from 'highcharts';

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
  endDate?: Date; // Fecha de fin para eventos con duración (ej: ingresos)
  title: string;
  description: string;
  week: number;
  weekEnd?: number; // Semana de fin para eventos con duración
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
 * Resultado de preparación de datos del gráfico
 */
export interface ChartDataResult {
  series: any[];
  rowCount: number;
}

/**
 * Opciones para preparar los datos del gráfico
 */
export interface PrepareChartDataOptions {
  filteredEvents: ObstetricEvent[];
  formatDate: (date: Date) => string;
}

/**
 * Prepara los datos para Highcharts con posiciones Y dinámicas y agrupación
 */
export function prepareChartData(options: PrepareChartDataOptions): ChartDataResult {
  const { filteredEvents, formatDate } = options;
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
  filteredEvents.forEach(event => {
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

    // Separar eventos con duración de eventos puntuales
    const eventsWithDuration: ObstetricEvent[] = [];
    const pointEvents: ObstetricEvent[] = [];

    eventsByType[type].forEach(event => {
      if (event.weekEnd && event.weekEnd > event.week) {
        eventsWithDuration.push(event);
      } else {
        pointEvents.push(event);
      }
    });

    // Serie de líneas horizontales para eventos con duración (xrange)
    if (eventsWithDuration.length > 0) {
      const rangeData = eventsWithDuration.map(event => ({
        x: event.week,
        x2: event.weekEnd,
        y: yPosition,
        name: event.title,
        description: event.description,
        date: formatDate(event.date),
        endDate: event.endDate ? formatDate(event.endDate) : '',
        eventData: event,
        color: EVENT_COLORS[type],
        dataLabels: {
          enabled: false,
        },
      }));

      series.push({
        type: 'xrange',
        name: EVENT_LABELS[type],
        data: rangeData,
        borderRadius: 4,
        pointWidth: 18,
        color: EVENT_COLORS[type],
        cursor: 'pointer',
        stickyTracking: false,
        dataLabels: {
          enabled: false,
        },
      });
    }

    // Serie de puntos para eventos puntuales (scatter)
    if (pointEvents.length > 0) {
      // Agrupar eventos puntuales por semana
      const eventsByWeek: Record<number, ObstetricEvent[]> = {};
      pointEvents.forEach(event => {
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
          date: formatDate(events[0].date),
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
            y: 5,
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
        stickyTracking: false,
        dataLabels: {
          enabled: true,
        },
      });
    }
  });

  return { series, rowCount: existingTypes.length };
}

/**
 * Opciones para crear el gráfico de Highcharts
 */
export interface CreateChartOptions {
  container: HTMLElement;
  series: any[];
  rowCount: number;
  todayWeek: number;
  formatDate: (date: Date) => string;
  onPointClick: (eventData: ObstetricEvent, pageX: number, pageY: number) => void;
}

/**
 * Crea la configuración del gráfico de Highcharts
 */
export function createChartConfig(options: CreateChartOptions): Highcharts.Options {
  const { series, rowCount, todayWeek, formatDate, onPointClick } = options;

  // Calcular altura dinámica: 80px base + 60px por fila
  const dynamicHeight = Math.max(250, 80 + rowCount * 60);

  return {
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
      tickInterval: 1,
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
          value: todayWeek,
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
      shared: false,
      snap: 0,
      formatter: function () {
        const point: any = this.point;

        // Tooltip para eventos con duración (xrange)
        if (this.series.type === 'xrange') {
          return `
            <div style="min-width: 200px;">
              <div style="background: ${point.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">
                ${this.series.name}
              </div>
              <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">
                ${point.name}
              </div>
              <div style="color: #7b8a9a; font-size: 12px; margin-bottom: 4px;">
                <strong>Inicio:</strong> Semana ${point.x} - ${point.date}
              </div>
              <div style="color: #7b8a9a; font-size: 12px;">
                <strong>Fin:</strong> Semana ${point.x2} - ${point.endDate}
              </div>
            </div>
          `;
        }

        if (point.isGrouped && point.groupedEvents) {
          // Tooltip para eventos agrupados
          const eventsList = point.groupedEvents
            .map((event: ObstetricEvent) => `
              <div style="padding: 4px 0; border-bottom: 1px solid #f0f0f0;">
                <div style="font-weight: 600; color: #2c3e50; font-size: 12px;">
                  ${event.title}
                </div>
                <div style="color: #7b8a9a; font-size: 11px;">
                  ${formatDate(event.date)}
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
                onPointClick(eventData, e.pageX, e.pageY);
              }
            },
          },
        },
      },
      xrange: {
        point: {
          events: {
            click: function (e: any) {
              const eventData = (this as any).options.eventData;
              if (eventData) {
                onPointClick(eventData, e.pageX, e.pageY);
              }
            },
          },
        },
      },
    },
    series: series,
  } as any;
}
