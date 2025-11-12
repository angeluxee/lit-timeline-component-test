import * as Highcharts from 'highcharts';

export type EventType = 'visita' | 'prueba' | 'urgencia' | 'ingreso' | 'parto' | 'puerperio';

export interface ObstetricEvent {
  id: string;
  type: EventType;
  date: Date;
  endDate?: Date;
  title: string;
  description: string;
  week: number;
  weekEnd?: number;
}

export const EVENT_COLORS: Record<EventType, string> = {
  visita: 'rgba(135, 206, 250, 0.7)',
  prueba: 'rgba(152, 251, 152, 0.7)',
  urgencia: 'rgba(255, 182, 193, 0.7)',
  ingreso: 'rgba(255, 218, 185, 0.7)',
  parto: 'rgba(255, 239, 153, 0.7)',
  puerperio: 'rgba(221, 160, 221, 0.7)',
};

export const EVENT_LABELS: Record<EventType, string> = {
  visita: 'Visita',
  prueba: 'Prueba',
  urgencia: 'Urgencia',
  ingreso: 'Ingreso',
  parto: 'Parto',
  puerperio: 'Puerperio',
};

const TYPE_ORDER: EventType[] = ['visita', 'prueba', 'urgencia', 'ingreso', 'parto', 'puerperio'];

export interface ChartDataResult {
  series: any[];
  rowCount: number;
}

export interface PrepareChartDataOptions {
  filteredEvents: ObstetricEvent[];
  formatDate: (date: Date) => string;
}

export function prepareChartData(options: PrepareChartDataOptions): ChartDataResult {
  const { filteredEvents, formatDate } = options;

  // Agrupar eventos por tipo
  const eventsByType = filteredEvents.reduce((acc, event) => {
    if (!acc[event.type]) acc[event.type] = [];
    acc[event.type].push(event);
    return acc;
  }, {} as Record<string, ObstetricEvent[]>);

  // Tipos existentes y posiciones Y
  const existingTypes = TYPE_ORDER.filter(type => eventsByType[type]?.length > 0);
  const yPositions = Object.fromEntries(
    existingTypes.map((type, i) => [type, existingTypes.length - 1 - i])
  );

  const series: any[] = [];

  existingTypes.forEach(type => {
    const events = eventsByType[type];
    const yPos = yPositions[type];
    const color = EVENT_COLORS[type];

    // Separar eventos con/sin duración
    const [durationEvents, pointEvents] = events.reduce(
      ([dur, pnt], e) => (e.weekEnd && e.weekEnd > e.week ? [[...dur, e], pnt] : [dur, [...pnt, e]]),
      [[] as ObstetricEvent[], [] as ObstetricEvent[]]
    );

    // Series xrange para eventos con duración
    if (durationEvents.length > 0) {
      series.push({
        type: 'xrange',
        name: EVENT_LABELS[type],
        data: durationEvents.map(e => ({
          x: e.week,
          x2: e.weekEnd,
          y: yPos,
          name: e.title,
          date: formatDate(e.date),
          endDate: e.endDate ? formatDate(e.endDate) : '',
          eventData: e,
          color,
        })),
        borderRadius: 4,
        pointWidth: 18,
        color,
        cursor: 'pointer',
        stickyTracking: false,
        dataLabels: { enabled: false },
      });
    }

    // Series scatter para eventos puntuales (con agrupación)
    if (pointEvents.length > 0) {
      const byWeek = pointEvents.reduce((acc, e) => {
        if (!acc[e.week]) acc[e.week] = [];
        acc[e.week].push(e);
        return acc;
      }, {} as Record<number, ObstetricEvent[]>);

      series.push({
        type: 'scatter',
        name: EVENT_LABELS[type],
        data: Object.entries(byWeek).map(([week, evs]) => ({
          x: +week,
          y: yPos,
          name: evs.length > 1 ? `${evs.length} eventos` : evs[0].title,
          date: formatDate(evs[0].date),
          eventData: evs[0],
          groupedEvents: evs,
          isGrouped: evs.length > 1,
          count: evs.length,
          marker: {
            fillColor: color,
            lineWidth: 2,
            lineColor: 'rgba(255, 255, 255, 0.8)',
            radius: evs.length > 1 ? 12 : 9,
          },
          dataLabels: {
            enabled: evs.length > 1,
            format: '{point.count}',
            style: { color: '#fff', fontSize: '11px', fontWeight: 'bold', textOutline: 'none' },
            y: 5,
          },
        })),
        color,
        marker: { symbol: 'circle' },
        cursor: 'pointer',
        stickyTracking: false,
        dataLabels: { enabled: true },
      });
    }
  });

  return { series, rowCount: existingTypes.length };
}

export interface CreateChartOptions {
  container: HTMLElement;
  series: any[];
  rowCount: number;
  todayWeek: number;
  formatDate: (date: Date) => string;
  onPointClick: (eventData: ObstetricEvent, pageX: number, pageY: number) => void;
}

export function createChartConfig(options: CreateChartOptions): Highcharts.Options {
  const { series, rowCount, todayWeek, formatDate, onPointClick } = options;

  return {
    chart: {
      type: 'scatter',
      height: Math.max(250, 80 + rowCount * 60),
      backgroundColor: '#fff',
      spacing: [20, 20, 20, 20],
    },
    title: { text: '' },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      min: 0,
      max: 46,
      tickInterval: 1,
      gridLineWidth: 1,
      gridLineColor: '#e1e8ed',
      lineColor: '#e1e8ed',
      tickColor: '#e1e8ed',
      title: {
        text: 'Setmanes de gestació',
        style: { color: '#7b8a9a', fontSize: '13px', fontWeight: '600' },
      },
      labels: {
        style: { color: '#2c3e50', fontSize: '12px', fontWeight: '600' },
      },
      plotBands: [{
        from: 41,
        to: 46,
        color: 'rgba(221, 160, 221, 0.2)',
        label: {
          text: 'Puerperio',
          align: 'center',
          verticalAlign: 'top',
          y: -10,
          style: { color: 'rgba(156, 39, 176, 0.9)', fontWeight: '600', fontSize: '13px' },
        },
      }],
      plotLines: [
        {
          value: todayWeek,
          color: 'rgba(135, 206, 250, 0.8)',
          width: 3,
          zIndex: 5,
          label: {
            text: 'Avui',
            style: {
              color: '#fff',
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
            text: 'Part previst',
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
      title: { text: '' },
      min: -0.5,
      max: rowCount - 0.5,
      gridLineWidth: 1,
      gridLineColor: '#f0f0f0',
      labels: { enabled: false },
    },
    tooltip: {
      useHTML: true,
      backgroundColor: '#fff',
      borderColor: '#e1e8ed',
      borderRadius: 8,
      padding: 12,
      shadow: true,
      shared: false,
      snap: 0,
      formatter: function () {
        const p: any = this.point;

        if (this.series.type === 'xrange') {
          return `
            <div style="min-width: 200px;">
              <div style="background: ${p.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">
                ${this.series.name}
              </div>
              <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">${p.name}</div>
              <div style="color: #7b8a9a; font-size: 12px; margin-bottom: 4px;"><strong>Inici:</strong> Setmana ${p.x} - ${p.date}</div>
              <div style="color: #7b8a9a; font-size: 12px;"><strong>Fi:</strong> Setmana ${p.x2} - ${p.endDate}</div>
            </div>
          `;
        }

        if (p.isGrouped && p.groupedEvents) {
          const list = p.groupedEvents.map((e: ObstetricEvent) => `
            <div style="padding: 4px 0; border-bottom: 1px solid #f0f0f0;">
              <div style="font-weight: 600; color: #2c3e50; font-size: 12px;">${e.title}</div>
              <div style="color: #7b8a9a; font-size: 11px;">${formatDate(e.date)}</div>
            </div>
          `).join('');

          return `
            <div style="min-width: 220px; max-width: 300px;">
              <div style="background: ${p.marker.fillColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">
                ${this.series.name} - Setmana ${p.x}
              </div>
              <div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px; font-size: 13px;">${p.count} esdeveniments</div>
              <div style="max-height: 200px; overflow-y: auto;">${list}</div>
            </div>
          `;
        }

        return `
          <div style="min-width: 200px;">
            <div style="background: ${p.marker.fillColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">
              ${this.series.name}
            </div>
            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">${p.name}</div>
            <div style="color: #7b8a9a; font-size: 12px;">Setmana ${p.x} - ${p.date}</div>
          </div>
        `;
      },
    },
    plotOptions: {
      scatter: {
        jitter: { x: 0, y: 0 },
        marker: {
          states: {
            hover: { enabled: true, lineColor: '#666', lineWidth: 2, radiusPlus: 4 },
          },
        },
        point: {
          events: {
            click: function (e: any) {
              const eventData = (this as any).options.eventData;
              if (eventData) onPointClick(eventData, e.pageX, e.pageY);
            },
          },
        },
      },
      xrange: {
        point: {
          events: {
            click: function (e: any) {
              const eventData = (this as any).options.eventData;
              if (eventData) onPointClick(eventData, e.pageX, e.pageY);
            },
          },
        },
      },
    },
    series,
  } as any;
}
