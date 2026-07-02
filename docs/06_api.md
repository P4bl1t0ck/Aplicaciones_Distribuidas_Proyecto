# 06 - Especificación de APIs y Contratos de Comunicación

Toda la comunicación externa con los clientes (móvil y web) se realiza a través de la **API Gateway** mediante protocolos HTTP/REST sobre HTTPS. La API Gateway inyecta la autenticación validando el token en la cabecera `Authorization: Bearer <JWT>`.

---

## 1. Servicio de Autenticación (`auth-service`)

### Registro de Usuario
* **Método/Ruta**: `POST /api/v1/auth/register`
* **Request Body**:
```json
{
  "username": "pablomont10",
  "email": "pablo@quitoquest.com",
  "password": "PasswordSegura123!"
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente.",
  "userId": "c35be8fd-534d-44aa-9c9c-b17b686d1a58"
}
```

### Inicio de Sesión
* **Método/Ruta**: `POST /api/v1/auth/login`
* **Request Body**:
```json
{
  "email": "pablo@quitoquest.com",
  "password": "PasswordSegura123!"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "7290bc5b41042784cf13a968e7b9da5c...",
  "user": {
    "id": "c35be8fd-534d-44aa-9c9c-b17b686d1a58",
    "username": "pablomont10",
    "role": "TURISTA"
  }
}
```

---

## 2. Servicio de Geolocalización (`geo-service`)

### Obtener Checkpoints de Misiones Cercanas
* **Método/Ruta**: `GET /api/v1/geo/pois/nearby`
* **Query Params**: `lat=-0.2206&lng=-78.5143&radius=1000`
* **Response (200 OK)**:
```json
{
  "success": true,
  "pois": [
    {
      "poiId": "san_francisco",
      "name": "Iglesia de San Francisco",
      "distanceMeters": 45.2,
      "coordinates": {
        "lat": -0.22055,
        "lng": -78.51428
      }
    }
  ]
}
```

### Realizar Check-in (Validación Geofencing)
* **Método/Ruta**: `POST /api/v1/geo/check-in`
* **Headers**: `Authorization: Bearer <JWT>`
* **Request Body**:
```json
{
  "poiId": "san_francisco",
  "userLocation": {
    "lat": -0.22056,
    "lng": -78.51429
  }
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "verified": true,
  "message": "Ubicación verificada. Has ingresado al checkpoint de San Francisco.",
  "timestamp": "2026-07-02T01:10:45Z"
}
```
* *Nota*: Este check-in exitoso gatilla la publicación del evento `POI_VISITED` en el bus de RabbitMQ.

---

## 3. Servicio de Gamificación (`gamification-service`)

### Consultar Misiones del Usuario
* **Método/Ruta**: `GET /api/v1/gamification/missions`
* **Headers**: `Authorization: Bearer <JWT>`
* **Response (200 OK)**:
```json
{
  "success": true,
  "missions": [
    {
      "missionId": "m1_san_francisco",
      "title": "El Misterio de San Francisco",
      "description": "Visita la iglesia de San Francisco y descifra la leyenda de Cantuña.",
      "status": "IN_PROGRESS",
      "xpReward": 150,
      "poiId": "san_francisco"
    }
  ]
}
```

### Consultar Tabla de Posiciones (Leaderboard)
* **Método/Ruta**: `GET /api/v1/gamification/leaderboard`
* **Response (200 OK)**:
```json
{
  "success": true,
  "leaderboard": [
    { "rank": 1, "username": "pablomont10", "xp": 4500, "level": 12 },
    { "rank": 2, "username": "patriciosaa", "xp": 3950, "level": 10 },
    { "rank": 3, "username": "carlosmoreta", "xp": 3200, "level": 8 }
  ]
}
```

---

## 4. Servicio de Recompensas (`reward-service`)

### Ver Catálogo de Cupones del Marketplace
* **Método/Ruta**: `GET /api/v1/rewards/catalog`
* **Response (200 OK)**:
```json
{
  "success": true,
  "rewards": [
    {
      "rewardId": "rew_cafe_gratis",
      "partnerName": "Café Plaza Mayor",
      "title": "Café Americano Gratis",
      "description": "Canjeable en el local presentando el código QR.",
      "xpCost": 300
    }
  ]
}
```

### Canjear Recompensa
* **Método/Ruta**: `POST /api/v1/rewards/redeem`
* **Headers**: `Authorization: Bearer <JWT>`
* **Request Body**:
```json
{
  "rewardId": "rew_cafe_gratis"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "coupon": {
    "code": "QQ-CAF-9021",
    "rewardId": "rew_cafe_gratis",
    "partnerName": "Café Plaza Mayor",
    "status": "ACTIVE",
    "expiresAt": "2026-08-02T23:59:59Z"
  }
}
```
