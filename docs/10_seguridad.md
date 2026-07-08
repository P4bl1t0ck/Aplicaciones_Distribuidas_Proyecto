# 10 - Seguridad Distribuida y Control de Acceso

La seguridad de **QuitoQuest** abarca la protección de la identidad de los usuarios, el cifrado de datos en tránsito, la restricción de llamadas a las APIs y la validación de la integridad física de las operaciones (evitando fraudes de geolocalización).

---

## 1. Flujo de Autenticación y Autorización (JWT + RBAC)

La autenticación se realiza mediante tokens JWT firmados digitalmente usando algoritmos simétricos HMAC-SHA256 (con una llave secreta de entorno) o asimétricos RS256.

```
[ Cliente ] ── (Credenciales) ──> [ Auth Service ] ── (Firma) ──> [ Genera JWT ]
     │                                                                   │
     └───────── (Bearer Token en Headers) ──> [ API Gateway ] <──────────┘
                                                    │
                                         (JWT OK: Inyecta Roles)
                                                    ▼
                                           [ Core Services ]
```

* **Access Token**: Tiene una validez de 15 minutos. Contiene en su payload:
```json
{
  "userId": "c35be8fd-534d-44aa-9c9c-b17b686d1a58",
  "username": "pablomont10",
  "role": "TURISTA"
}
```
* **Refresh Token**: Almacenado en la base de datos `UsersDB`. Se requiere para solicitar un nuevo Access Token una vez expirado el anterior. Permite la invalidación de sesiones de forma remota (borrando el Refresh Token de la base de datos).
* **Control de Acceso Basado en Roles (RBAC)**:
  * El API Gateway verifica la validez del token.
  * El middleware de cada microservicio valida los privilegios del rol inyectado. Por ejemplo:
    - `/api/v1/rewards/validate` requiere rol `PARTNER`.
    - `/api/v1/events` (POST) requiere rol `ADMIN_MUNICIPIO`.
    - `/api/v1/gamification/missions` requiere rol `TURISTA`.

---

## 2. Limitación de Consumo (Rate Limiting)

Para evitar la saturación de los microservicios por ataques de fuerza bruta o raspado masivo de datos (scraping malicioso), se implementa un middleware de **Rate Limiting** en el API Gateway:
* **Tecnología**: Redis utilizando el algoritmo de Ventana Deslizante (*Sliding Window Counter*).
* **Regla**: Máximo 100 peticiones por minuto por dirección IP.
* **Respuesta ante Exceso**: Retorna código HTTP `429 Too Many Requests` con la cabecera `Retry-After`.

---

## 3. Algoritmo Antifraude de Ubicación (Anti-Spoofing GPS)

En aplicaciones gamificadas con premios reales, los usuarios podrían intentar engañar al GPS mediante emuladores (*GPS Spoofing*) para hacer check-in en múltiples puntos turísticos de Quito en pocos segundos sin moverse físicamente.

El **Geo Service** implementa reglas de sanidad para validar la veracidad de la ubicación:
1. **Validación de Rango Geofence**: Para considerar un check-in como válido, la distancia calculada (fórmula del Haversine) entre la coordenada reportada por el teléfono y el checkpoint del POI debe ser menor a **50 metros**.
2. **Cálculo de Vector de Velocidad (Sanity Checks)**:
   - Al registrar un check-in exitoso en un POI A (ej. Panecillo) y posteriormente solicitar check-in en un POI B (ej. Mitad del Mundo, a 30 km de distancia), el sistema calcula el tiempo transcurrido entre ambos eventos.
   - Si la velocidad requerida para viajar entre A y B supera los **120 km/h** (límite físico vehicular terrestre coherente), la transacción se bloquea temporalmente, se marca como sospechosa y no se otorga XP ni cupones.
3. **Mínimo Tiempo de Permanencia**: En ciertos checkpoints (como museos), el check-in requiere que el usuario permanezca en el radio del geofence un mínimo de 5 minutos, previniendo check-ins desde vehículos en movimiento rápido.
