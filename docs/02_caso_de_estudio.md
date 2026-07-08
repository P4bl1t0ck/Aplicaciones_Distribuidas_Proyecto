# 02 - Caso de Estudio: QuitoQuest

## 1. Contexto Actual de Quito

Quito es una ciudad patrimonial de gran importancia histórica y turística (declarada Primer Patrimonio Cultural de la Humanidad por la UNESCO en 1978). La urbe cuenta con una vasta cantidad de atractivos concentrados principalmente en el Centro Histórico y en zonas modernas como La Mariscal o La Carolina, además de corredores gastronómicos y naturales como Guápulo o el Teleférico.

Actualmente, las principales fuentes de información turística y cultural en Quito son:
- **Páginas Oficiales**: [Quito Turismo](https://visitquito.ec/) y [Municipio de Quito](https://visitquito.ec/es/eventos/).
- **Redes Sociales**: Canales municipales que anuncian eventos locales de última hora en Facebook/Instagram.
- **Plataformas de Mapas**: TripAdvisor, Google Maps y guías tradicionales impresas o en PDF.
- **Redes de Museos**: Sitios independientes de la Fundación Museos de la Ciudad y teatros locales.

### El Problema de la Fragmentación
Toda esta información está aislada. Un turista que llega a Quito no tiene un canal que asocie, por ejemplo, que después de visitar el Museo de la Ciudad (evento cultural), hay una cafetería tradicional a 50 metros con una promoción especial de colada morada e higos con queso (economía local), y que completar esa visita le otorgará una insignia digital de "Explorador Colonial" (gamificación). Esta desconexión resulta en la pérdida de clientes para los negocios pequeños y una menor retención turística para la ciudad.

---

## 2. Actores Potenciales del Sistema

El ecosistema de QuitoQuest involucra una red de actores interdependientes:

| Actor | Descripción | Motivación |
| --- | --- | --- |
| **Turistas Nacionales / Internacionales** | Viajeros de ocio o negocios. Buscan exprimir el tiempo y vivir experiencias auténticas en la ciudad. | Quieren rutas personalizadas, recomendaciones confiables y descubrir la gastronomía típica ahorrando dinero. |
| **Residentes Locales** | Habitantes que buscan planes diferentes de fin de semana, eventos culturales y ocio nocturno cercano. | Quieren descubrir secretos de su propia ciudad y competir en rankings de exploración. |
| **Comercios Aliados (B2B)** | Cafeterías, restaurantes, museos privados, tiendas de artesanías y hostales locales. | Buscan visibilidad digital, atraer tráfico físico a sus locales y lanzar cupones en horas de baja demanda. |
| **Municipio / Entidades Públicas** | Quito Turismo, Museos Municipales y gestores culturales. | Buscan descentralizar los flujos de visitantes, difundir la agenda cultural y capturar estadísticas agregadas del turismo. |

---

## 3. Variables y Parámetros Operativos

El sistema distribuido procesa y evalúa una serie de variables para generar su comportamiento lúdico e inteligente:
* **Ubicación GPS**: Coordenadas latitud/longitud del dispositivo del usuario (geofencing).
* **Intereses del Perfil**: Preferencias seleccionadas (Gastronomía, Historia, Museos, Aventura, Vida Nocturna).
* **Horarios y Clima**: Estado meteorológico de Quito (a través de OpenWeather API) y horarios de apertura de los museos para filtrar sugerencias en tiempo real.
* **Presupuesto y Promociones**: Filtros para mostrar retos que sean de bajo costo o que tengan cupones activos.
* **Nivel de Interacción**: Frecuencia de check-ins e insignias desbloqueadas que modifican el ranking global del usuario.

---

## 4. Restricciones Técnicas e Identificadas

Para garantizar la viabilidad del proyecto, se deben mitigar las siguientes limitaciones:
1. **Conectividad Intermitente (Modo Offline)**: En el Centro Histórico de Quito o en áreas montañosas (como el Pichincha), la cobertura celular 3G/4G/5G puede ser inestable. Las misiones y check-ins completados deben registrarse localmente en el dispositivo y sincronizarse asincrónicamente mediante una cola al recuperar internet.
2. **Precisión del GPS en Entornos Urbanos**: La presencia de calles estrechas y cañones urbanos en el casco colonial puede alterar la precisión del GPS de los smartphones. El radio de geofencing debe tolerar un margen de error (entre 20 y 50 metros).
3. **Consumo de APIs de Terceros**: Las APIs de mapas de Google pueden generar altos costos si se realizan peticiones masivas. El sistema debe cachear los datos de mapas (mediante OpenStreetMap o capas optimizadas) y utilizar Redis para evitar consultas repetitivas al backend.
4. **Protección de Datos Personales**: De acuerdo con la Ley Orgánica de Protección de Datos Personales de Ecuador (LOPDP), el sistema no almacenará historiales de ubicación continua del usuario, solo los timestamps exactos de los check-ins aprobados por el usuario.
