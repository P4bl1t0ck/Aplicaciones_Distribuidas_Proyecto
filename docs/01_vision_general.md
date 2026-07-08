# 01 - Visión General del Proyecto

## 1. Definición del Problema

La ciudad de Quito posee una enorme riqueza cultural, gastronómica e histórica. Sin embargo, los turistas y los propios residentes a menudo experimentan dificultades para descubrir y disfrutar estas experiencias debido a dos problemas principales:
- **Dispersión de Información**: Las actividades culturales y la oferta turística están fragmentadas en blogs, sitios municipales, redes sociales y plataformas de mapas independientes. El usuario final debe buscar en múltiples fuentes para planificar un recorrido, lo cual consume tiempo y reduce la espontaneidad.
- **Falta de Incentivos y Personalización**: Las aplicaciones turísticas convencionales ofrecen guías estáticas, descripciones genéricas y carecen de dinámicas que motiven al usuario a explorar zonas menos concurridas o a interactuar de manera lúdica con el entorno urbano.

Esto genera una distribución desigual del flujo turístico: los visitantes se concentran casi en su totalidad en los sitios más icónicos y tradicionales (como la Plaza Grande o la Virgen del Panecillo), mientras que decenas de museos comunitarios, emprendimientos de comida local, cafeterías artesanales y pequeños operadores quedan invisibilizados, perdiendo oportunidades clave de desarrollo económico.

---

## 2. Justificación de la Solución

**QuitoQuest** aborda esta problemática transformando la exploración de la ciudad en un **juego interactivo y personalizado**. Al fusionar principios de gamificación (niveles, misiones, logros, tablas de clasificación) con geolocalización en tiempo real y motores de recomendación inteligente, la aplicación estimula a los visitantes a salir de su zona de confort, explorar rutas alternativas y conocer la historia viva de Quito.

A nivel de negocio y comunidad, el sistema introduce un modelo transaccional donde los puntos de experiencia (XP) obtenidos en el juego se convierten en beneficios tangibles (descuentos, promociones, entradas gratuitas) provistos por comercios locales adheridos (cafés, galerías, tiendas artesanales), impulsando de forma directa la economía de proximidad y creando un círculo virtuoso de turismo inteligente y sostenible.

---

## 3. Objetivos

### Objetivo General
Diseñar y desarrollar una plataforma inteligente distribuida orientada a la gamificación del turismo urbano en Quito, combinando microservicios autónomos, geolocalización en tiempo real, análisis de preferencias y alianzas con la economía local.

### Objetivos Específicos
1. **Desacoplar la lógica del negocio** en una arquitectura de microservicios tolerante a fallos, implementando un Gateway unificado y persistencia políglota (PostgreSQL, MongoDB, Redis).
2. **Implementar geolocalización segura (Geofencing)** para validar check-ins físicos del usuario y prevenir fraude de GPS (GPS Spoofing).
3. **Construir un motor de recomendación inteligente** que aprenda de las preferencias del usuario para sugerir rutas y actividades acordes a sus gustos.
4. **Habilitar procesamiento asíncrono y distribuido** mediante brokers de mensajería (RabbitMQ/Kafka) para notificaciones y recompensas en tiempo real.
5. **Ofrecer una interfaz visual interactiva** en formato web (React) y móvil (Flutter) que represente el progreso del usuario y el impacto económico en los comercios aliados.

---

## 4. Alcance del Proyecto

La plataforma está diseñada para conectar de forma distribuida a tres usuarios fundamentales:
- **Turistas / Residentes**: Exploran, compiten y canjean premios a través de una aplicación dinámica.
- **Comercios Aliados (Partners B2B)**: Crean retos específicos en sus establecimientos y validan las recompensas de los usuarios, accediendo a métricas de afluencia.
- **Municipio / Administradores**: Supervisan la carga de eventos culturales de la ciudad y analizan mapas de calor turísticos.

---

## 5. Definición del Producto Mínimo Viable (MVP)

El MVP se enfocará en demostrar la integración de la arquitectura distribuida mediante el siguiente conjunto de características núcleo:
* **Autenticación Segura**: Registro y login de usuarios mediante token JWT.
* **Mapa de Quito Interactivo**: Visualización de puntos clave y retos cercanos.
* **Geofencing & Check-in**: Botón para simular ubicación física y reclamar check-in de una misión en la Plaza de San Francisco.
* **Gamificación Central**: Sistema de XP, niveles, e historial de progreso básico.
* **Marketplace B2B**: Lista de cupones ganados y formulario para que un comercio simule el canje.
* **Dashboard Administrativo**: Panel en React para visualizar métricas clave de visitas agregadas.

---

## 6. Hitos del Proyecto (Roadmap de Alto Nivel)

```
Hito 1: Definición e Infraestructura Básica (Semana 1)
Hito 2: Core Microservicios y Autenticación (Semanas 2-3)
Hito 3: Geolocalización, Eventos y Gamificación (Semanas 4-5)
Hito 4: Integración del Bus de Eventos (RabbitMQ) (Semana 6)
Hito 5: Frontend React (Admin) y Maqueta Móvil (Semana 7)
Hito 6: Pruebas, Refinamiento y Demo (Semana 8)
```
