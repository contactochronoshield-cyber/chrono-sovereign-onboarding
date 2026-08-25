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

---

## 🛡️ Nueva Mejora Integrada: ChronoPulse Guard
Se ha añadido el módulo de telemetría de autodefensa (`core/security/pulse_guard.py`), diseñado para vigilar los contenedores aislados de 256MB RAM, emitir alertas por Webhook en tiempo real y blindar la infraestructura soberana ante anomalías.

---

## 🛡️ Sentinel Core & Mesh Network (Anti-Corporate AI)
Módulo integrado de inteligencia defensiva que analiza las conexiones en tiempo real, expulsando automáticamente intentos de intrusión de grandes nubes centralizadas (AWS, Azure, etc.) y unificando cada dispositivo como un nodo hermano descentralizado en Latinoamérica.

---

## analyst: Technical Compliance & Security Baseline
El sistema incluye rutinas automáticas de *Hardening* (`core/audit/security_audit.py`) para validar el cifrado en tránsito, el aislamiento de contenedores y la integridad de la red mesh antes de aceptar tráfico de producción.

---

## ⚡ Chrono Mesh Architecture — Las 7 Capas Maestras
1. **ChronoMesh Network P2P:** Red mallada descentralizada (Latam) con alta disponibilidad y redirección automática entre nodos hermanos (Beelink N100).
2. **ChronoPulse Guard & Sentinel AI:** IA local anti-corporativa con *Ghost Mode* para auto-defensa contra bots de AWS/Azure.
3. **Marketplace Soberano PYME:** Freelance gig-economy libre de intermediarios corporativos (Stripe/PayPal), con pagos on-chain y perfiles verificados.
4. **Autonomous A/B Testing & Rollback:** Despliegues ligeros con control de versiones inmutable y reversión en <10 segundos.
5. **Edge AI Content Optimizer & SEO:** Generación automática de metadatos y optimización de rendimiento en contenedores aislados.
6. **Nodos en el Subsuelo (Ghost Backups):** Resiliencia total con respaldos cifrados descentralizados independientes de la red principal.
7. **Governance & Community Bounty:** Gobernanza soberana para decidir el rumbo de la energía y el desarrollo de la red.

---

## 🌌 Capa 8: Chrono Quantum-Shield & Radio-Mesh (PQC)
Implementación experimental de criptografía post-cuántica ligera optimizada para nodos móviles (Termux) y hardware de borde (N100), garantizando que la red soberana de Latinoamérica sea inmune a la futura intercepción por computación cuántica, con capacidad de operar fuera de línea mediante mallas de radiofrecuencia.

---

## 🎓 Academic Mesh Routing (Lab-Grade P2P)
Módulo de enrutamiento mallado dinámico inspirado en investigaciones de redes ad-hoc de laboratorios universitarios (como protocolos de optimización de enlaces de vecinos), garantizando que la red de nodos hermanos en Latinoamérica mantenga alta disponibilidad sin depender de la infraestructura tradicional de Internet.

---

## 🧬 Ephemeral & Immutable Container Architecture
Sistema de orquestación de contenedores de borde donde cada instancia desplegada para PyMEs es totalmente efímera, destruyéndose y regenerándose criptográficamente de manera automática cada 24 horas a partir de una imagen base inmutable. Esto elimina por completo la persistencia de ataques y la necesidad de parches manuales.

---

## 🤖 ChronoArch Agent (AI Sovereign Bridge)
Integración nativa con la red de islas latinas **Archipelag.io** mediante una interfaz compatible con OpenAI, combinada con un *fallback* automático a **Ollama** en el nodo local (Beelink N100 / Termux). Permite procesamiento de IA distribuida sin depender de corporaciones estadounidenses o garras de Big Tech.
