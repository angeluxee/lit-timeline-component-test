# 🏥 Timeline Obstétrico Clínico

Prototipo de componente web profesional para visualizar la línea temporal de un embarazo en estaciones de trabajo médicas.

## 📋 Características

### Diseño Clínico Profesional
- ✅ Interfaz limpia y sanitaria con colores suaves (blancos, azules claros)
- ✅ Tipografía moderna y legible (Inter/Roboto)
- ✅ Vista horizontal optimizada para estaciones de trabajo médicas
- ✅ Responsive y adaptable a diferentes resoluciones

### Vista Temporal
- 🗓️ Eje temporal de 0 a 46 semanas de gestación
- 📊 Marcadores cada 4 semanas (0, 4, 8, 12, ..., 40, 46)
- 📍 Líneas indicadoras entre semanas (|)
- 📌 Línea vertical "Hoy" (azul) mostrando la semana actual
- 👶 Línea vertical "Parto previsto" (dorada) en semana 40
- 🌸 Zona de puerperio (semanas 41-46) con fondo lila claro

### Tipos de Eventos
- 🩺 **Visitas** - Azul (#2196F3)
- 🧪 **Pruebas** - Verde (#4CAF50)
- 🚨 **Urgencias** - Rojo (#F44336)
- 🏥 **Ingresos** - Naranja (#FF9800)
- 👶 **Parto** - Dorado (#FFD700)
- 🌸 **Puerperio** - Lila (#CE93D8)

### Gestión de Solapamientos
- ✅ Staggering vertical automático para 2-3 eventos en la misma semana
- ✅ Badge "+n" para grupos de más de 3 eventos
- ✅ Popover con listado de eventos al hacer clic en un grupo

### Filtrado Interactivo
- 🔍 Filtros por tipo de evento (Visitas, Pruebas, Urgencias, Ingresos)
- 📅 Filtro histórico (mostrar/ocultar eventos pasados)
- ⚡ Actualización en tiempo real

### Interacción
- 🖱️ Click en evento → Overlay con detalles completos
- 🖱️ Click en grupo → Popover con lista de eventos
- 📄 Botón "Ver informe" para acceder a documentación
- ❌ Cierre fácil de overlays (botón X o click fuera)

## 🏗️ Arquitectura

El componente está construido con **Lit** (Web Components) y sigue una arquitectura modular:

```
component.ts     - Lógica del componente, propiedades y estado
template.ts      - Estructura HTML y renderizado
styles.scss      - Estilos profesionales con SCSS
```

### Estructura de Archivos

```
├── component.ts      # Componente principal con lógica
├── template.ts       # Template HTML separado
├── styles.scss       # Estilos SCSS
├── index.html        # Ejemplo de uso
└── README.md         # Documentación
```

## 🚀 Uso

### Instalación

```bash
# Instalar dependencias de Lit
npm install lit

# Para desarrollo con TypeScript
npm install -D typescript @types/node
```

### Ejemplo de uso

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="./component.js"></script>
</head>
<body>
  <obstetric-timeline id="timeline"></obstetric-timeline>

  <script type="module">
    const timeline = document.getElementById('timeline');

    // Configurar fechas
    timeline.startDate = new Date('2025-02-12');
    timeline.expectedDeliveryDate = new Date('2025-11-20');
    timeline.currentWeek = 16;

    // Añadir eventos
    timeline.events = [
      {
        id: 'v1',
        type: 'visita',
        date: new Date('2025-03-12'),
        week: 4,
        title: 'Primera visita prenatal',
        description: 'Confirmación de embarazo y analítica básica.'
      },
      // ... más eventos
    ];
  </script>
</body>
</html>
```

### Propiedades del Componente

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `startDate` | `Date` | Fecha de inicio del embarazo (FUR) |
| `expectedDeliveryDate` | `Date` | Fecha prevista de parto (FPP) |
| `currentWeek` | `number` | Semana actual de gestación |
| `events` | `ObstetricEvent[]` | Array de eventos obstétricos |

### Interfaz ObstetricEvent

```typescript
interface ObstetricEvent {
  id: string;                    // ID único del evento
  type: EventType;                // 'visita' | 'prueba' | 'urgencia' | 'ingreso' | 'parto' | 'puerperio'
  date: Date;                     // Fecha del evento
  week: number;                   // Semana de gestación
  title: string;                  // Título del evento
  description: string;            // Descripción detallada
}
```

## 🎨 Personalización

### Colores

Puedes personalizar los colores editando las variables CSS en `component.ts`:

```typescript
export const EVENT_COLORS: Record<EventType, string> = {
  visita: '#2196F3',      // Azul
  prueba: '#4CAF50',      // Verde
  urgencia: '#F44336',    // Rojo
  ingreso: '#FF9800',     // Naranja
  parto: '#FFD700',       // Dorado
  puerperio: '#CE93D8',   // Lila
};
```

### Estilos

Los estilos están organizados en secciones en `styles.scss`:

- Encabezado
- Barra de filtros
- Timeline (eje temporal)
- Marcadores de semana
- Eventos
- Overlays
- Responsive

## 🔧 Compilación para Producción

```bash
# Compilar TypeScript
tsc

# Procesar SCSS
sass styles.scss styles.css

# Usar con bundler (Vite, Webpack, etc.)
npm run build
```

## 📱 Responsive

El componente es completamente responsive:

- **Desktop**: Vista horizontal completa con todos los detalles
- **Tablet**: Scroll horizontal para timeline largo
- **Mobile**: Overlays adaptados a pantalla completa (90vw)

## 🌟 Casos de Uso

Este componente está diseñado para:

- ✅ Sistemas de historia clínica electrónica (HCE)
- ✅ Aplicaciones de gestión obstétrica
- ✅ Portales de pacientes
- ✅ Dashboards médicos
- ✅ Sistemas de seguimiento prenatal

## 📄 Licencia

Este es un prototipo para demostración. Adapta según necesites para tu proyecto.

## 🤝 Contribuciones

Mejoras sugeridas:

- [ ] Exportar timeline a PDF/imagen
- [ ] Modo de edición de eventos
- [ ] Integración con API backend
- [ ] Múltiples embarazos comparativos
- [ ] Gráficas de tendencias (peso, presión arterial, etc.)
- [ ] Notificaciones de próximos eventos
- [ ] Impresión optimizada

## 📞 Soporte

Para preguntas o mejoras, crea un issue en el repositorio.

---

**Desarrollado con Lit** ⚡ | **Diseño sanitario profesional** 🏥
