# 07 - Desarrollo de Clientes (Móvil y Web)

**QuitoQuest** implementa una separación clara de interfaces: una aplicación nativa móvil enfocada en la experiencia ágil del usuario final en la calle, y un panel administrativo web enfocado en la analítica pesada y gestión de promociones.

---

## 1. Cliente Móvil: Flutter (Alternativa a .NET MAUI)

### Arquitectura Conceptual: MVVM + Clean Architecture
La aplicación móvil se estructura en capas separadas para garantizar desacoplamiento y facilitar pruebas unitarias:

```
lib/
├── core/
│   ├── theme/          # Paleta de colores e iconografía
│   ├── network/        # Cliente HTTP (Dio) con inyección de JWT
│   └── navigation/     # Configuración de GoRouter
└── features/
    ├── authentication/ # Login, Registro e intereses
    ├── map/            # Vista de mapas e interacción GPS
    ├── missions/       # Lista de misiones activas
    ├── leaderboard/    # Tablas de clasificación
    └── marketplace/    # Inventario de cupones y canje
```

* **Gestión de Estados (Riverpod)**: Se utilizan `StateNotifierProviders` para manejar el estado reactivo del mapa y la sincronización offline.
* **Componente de Mapa (flutter_map / Leaflet)**: Consume tiles de OpenStreetMap locales o de Mapbox para renderizar las zonas geofenced sin costo. Dibuja marcadores animados (Pins) para las iglesias, museos y cafés aliados.
* **Estrategia Sincronización Offline**:
  - Al perder red celular, el `StateNotifier` intercepta el fallo HTTP y encola la petición en una base de datos local SQLite (usando Hive o Isar).
  - Un worker periódico monitorea la red; al reconectarse, envía en lote (*batch*) los check-ins acumulados al Gateway.

---

## 2. Panel Administrativo: React.js

Diseñado como una Single Page Application (SPA) optimizada para navegadores web de escritorio, utilizando Vite como empaquetador y Vanilla CSS para estilizado premium.

### Secciones Principales
1. **Dashboard de Negocio (Vista Partner)**:
   - **Métricas de Rendimiento**: KPIs de cupones emitidos vs canjeados, afluencia horaria del local y volumen de clientes nuevos.
   - **Editor de Ofertas**: Formulario para crear un cupón (ej. "2x1 en postres de 4 PM a 6 PM") que impacta dinámicamente al servicio de recompensas.
2. **Dashboard de Gestión Urbana (Vista Municipio)**:
   - **Event Manager**: CRUD para añadir conciertos, desfiles o eventos de la "Semana del Patrimonio".
   - **Analítica de Distribución Turística**: Mapa interactivo de calor (Heatmap) que recopila las visitas agregadas en tiempo real.
3. **Control del Sistema (Vista Admin Central)**:
   - Moderación de perfiles, logs de incidencias y balanceo de misiones activas.

### Librerías Utilizadas
* **Visualización de Mapas**: `react-leaflet` y `leaflet-heatmap` para renderizar de manera eficiente los puntos de concurrencia peatonal agregados por el Analytics Service.
* **Gráficos**: `Recharts` o `Chart.js` para diagramas de barra de afluencia por día de la semana y gráficos de dona para categorización de cupones.
