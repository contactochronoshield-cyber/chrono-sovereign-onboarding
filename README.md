# Chrono Sovereign Cloud — Onboarding (Fase 1)

Hosting gratis y comunitario, hecho por Chrono Shield Networks (CSN).
La idea: en vez de depender de las nubes de siempre, la gente registra su sitio
y lo despliega en infraestructura propia de CSN — empezando en hardware propio
(Beelink N100), con planes de expandir a nodos comunitarios más adelante.

## Qué hace esto
1. Un usuario se registra en `/` → recibe un subdominio (`suSitio.chronoshield.cloud`) + credenciales
2. Sube su sitio estático (html o zip) en `/subir.html`
3. Se levanta un contenedor Docker aislado (256MB RAM / 0.5 CPU) sirviéndolo
4. Caddy enruta el subdominio automáticamente hacia ese contenedor

## Seguridad y anti-abuso (v0.2)
- Persistencia real en **SQLite** (`node:sqlite`, nativo — no requiere compilar nada en Termux)
- Validación de formato de email en el registro
- **Rate limiting** por IP: máximo 5 registros/hora y 20 subidas/hora
- Límite de tamaño de subida: 500MB por sitio
- Cada sitio corre en su propio contenedor con límites duros de CPU/RAM

## Probar en local (Termux u otro entorno)
\`\`\`bash
npm install
node onboarding-server.js
\`\`\`
Abre `http://localhost:4000` para el registro, y `http://localhost:4000/subir.html`
para subir el sitio una vez tengas tu `userId` y `apiKey`.

> Nota: el paso de despliegue con Docker no funciona en Termux/Android — solo en
> un host real con Docker instalado (ver más abajo, "Cuando llegue el N100").

## Cuando llegue el N100 (o cualquier host Linux con Docker)
1. Instala Docker, Node 18+ y Caddy en el host
2. Copia este proyecto a `/opt/chrono-sovereign-cloud/`
3. Configura el DNS wildcard `*.chronoshield.cloud` → IP pública del host
4. Configura Caddy con Admin API activa en `localhost:2019` (ver comentarios en el código)
5. `npm install && node onboarding-server.js`
6. Cada registro + subida crea un sitio en vivo con su propio subdominio

## Límites de fase 1 (ajustables en `CONTAINER_LIMITS` dentro de `onboarding-server.js`)
- 256MB RAM / 0.5 CPU por sitio
- Solo contenido estático (nginx sirviendo HTML/CSS/JS)
- Sin bases de datos, sin cron jobs, sin procesos de larga duración

## Pendiente
- Conectar con Sentinel AI: loop que lea `docker stats` por contenedor y alerte
  si algo excede umbrales sostenidos (decisión de suspensión la toma un humano)
- Definir dominio final de producción
- Evaluar capa de nodos comunitarios una vez pasada la fase de hardware propio

---
Chrono Shield Networks · Bogotá, Colombia
