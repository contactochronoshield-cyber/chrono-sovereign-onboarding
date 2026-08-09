/**
 * Chrono Sovereign Cloud — Onboarding Server
 * ------------------------------------------
 * Fase 1: hosting gratis sobre hardware propio (Beelink N100 / mini PC)
 *
 * v0.2 — agrega:
 *   - Persistencia real en SQLite (node:sqlite nativo, sin compilar nada)
 *   - Validación de formato de email
 *   - Rate limiting anti-abuso (por IP) en /register y /upload
 */

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 4000;
const DOMAIN_BASE = process.env.DOMAIN_BASE || "chronoshield.cloud";
const UPLOAD_DIR = path.join(__dirname, "sites");
const CADDY_ADMIN_URL = process.env.CADDY_ADMIN_URL || "http://localhost:2019";

const CONTAINER_LIMITS = { memory: "256m", cpus: "0.5", storageQuotaMB: 500 };

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(path.join(__dirname, "chrono_sovereign.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    fullDomain TEXT NOT NULL,
    apiKey TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_upload',
    containerName TEXT,
    hostPort INTEGER,
    createdAt TEXT NOT NULL,
    deployedAt TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS rate_limit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    route TEXT NOT NULL,
    ts INTEGER NOT NULL
  )
`);

function insertUser(user) {
  const stmt = db.prepare(`
    INSERT INTO users (userId, email, subdomain, fullDomain, apiKey, status, containerName, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(user.userId, user.email, user.subdomain, user.fullDomain, user.apiKey, user.status, user.containerName, user.createdAt);
}

function getUserById(userId) {
  return db.prepare("SELECT * FROM users WHERE userId = ?").get(userId);
}

function isSubdomainTaken(subdomain) {
  return !!db.prepare("SELECT 1 FROM users WHERE subdomain = ?").get(subdomain);
}

function markDeployed(userId, hostPort) {
  db.prepare("UPDATE users SET status = 'deployed', hostPort = ?, deployedAt = ? WHERE userId = ?").run(hostPort, new Date().toISOString(), userId);
}

const RATE_LIMITS = {
  "/register": { max: 5, windowMs: 60 * 60 * 1000 },
  "/upload": { max: 20, windowMs: 60 * 60 * 1000 },
};

function rateLimit(routeKey) {
  const rule = RATE_LIMITS[routeKey];
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();
    const windowStart = now - rule.windowMs;

    db.prepare("DELETE FROM rate_limit_log WHERE ip = ? AND route = ? AND ts < ?").run(ip, routeKey, windowStart);

    const count = db.prepare("SELECT COUNT(*) as c FROM rate_limit_log WHERE ip = ? AND route = ? AND ts >= ?").get(ip, routeKey, windowStart).c;

    if (count >= rule.max) {
      return res.status(429).json({ error: `Demasiadas solicitudes desde esta IP. Máximo ${rule.max} por hora en ${routeKey}. Intenta más tarde.` });
    }

    db.prepare("INSERT INTO rate_limit_log (ip, route, ts) VALUES (?, ?, ?)").run(ip, routeKey, now);
    next();
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email) {
  return typeof email === "string" && email.length <= 254 && EMAIL_REGEX.test(email);
}

function slugify(name) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30);
}

app.post("/register", rateLimit("/register"), (req, res) => {
  const { email, siteName } = req.body;

  if (!email || !siteName) return res.status(400).json({ error: "email y siteName son requeridos" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "el formato del email no es válido" });
  if (siteName.trim().length < 2) return res.status(400).json({ error: "siteName debe tener al menos 2 caracteres" });

  let subdomain = slugify(siteName);
  if (!subdomain) return res.status(400).json({ error: "siteName no genera un subdominio válido, usa letras o números" });

  let suffix = 0;
  let candidate = subdomain;
  while (isSubdomainTaken(candidate)) {
    suffix += 1;
    candidate = `${subdomain}-${suffix}`;
  }
  subdomain = candidate;

  const userId = crypto.randomUUID();
  const apiKey = crypto.randomBytes(16).toString("hex");
  const fullDomain = `${subdomain}.${DOMAIN_BASE}`;

  insertUser({ userId, email, subdomain, fullDomain, apiKey, status: "pending_upload", containerName: `csc-${subdomain}`, createdAt: new Date().toISOString() });

  res.json({ userId, apiKey, subdomain: fullDomain, nextStep: `Sube tu sitio con POST /upload/${userId} (multipart/form-data, campo "site", header x-api-key)` });
});

const TMP_UPLOAD_DIR = path.join(__dirname, "tmp-uploads");
if (!fs.existsSync(TMP_UPLOAD_DIR)) fs.mkdirSync(TMP_UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: TMP_UPLOAD_DIR, limits: { fileSize: CONTAINER_LIMITS.storageQuotaMB * 1024 * 1024 } });

app.post("/upload/:userId", rateLimit("/upload"), upload.single("site"), (req, res) => {
  const { userId } = req.params;
  const user = getUserById(userId);

  if (!user) return res.status(404).json({ error: "usuario no encontrado" });
  if (req.headers["x-api-key"] !== user.apiKey) return res.status(403).json({ error: "api key inválida" });
  if (!req.file) return res.status(400).json({ error: "falta el archivo 'site'" });

  const siteDir = path.join(UPLOAD_DIR, user.subdomain);
  fs.mkdirSync(siteDir, { recursive: true });

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext === ".zip") {
    exec(`unzip -o "${req.file.path}" -d "${siteDir}"`, (err) => {
      if (err) return res.status(500).json({ error: "error descomprimiendo el sitio" });
      deployContainer(user, siteDir, res);
    });
  } else {
    fs.copyFileSync(req.file.path, path.join(siteDir, "index.html"));
    deployContainer(user, siteDir, res);
  }
});

function findFreePort(callback) {
  const net = require("net");
  const srv = net.createServer();
  srv.listen(0, () => {
    const port = srv.address().port;
    srv.close(() => callback(port));
  });
}

function deployContainer(user, siteDir, res) {
  findFreePort((hostPort) => {
    const dockerCmd = [
      "docker run -d", `--name ${user.containerName}`, `--memory=${CONTAINER_LIMITS.memory}`,
      `--cpus=${CONTAINER_LIMITS.cpus}`, "--restart unless-stopped", `-p 127.0.0.1:${hostPort}:80`,
      `-v ${siteDir}:/usr/share/nginx/html:ro`, "nginx:alpine",
    ].join(" ");

    exec(`docker rm -f ${user.containerName} 2>/dev/null; ${dockerCmd}`, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr);
        return res.status(500).json({ error: "error desplegando contenedor", detail: stderr });
      }
      markDeployed(user.userId, hostPort);
      const updatedUser = getUserById(user.userId);
      updateCaddyRoute(updatedUser)
        .then(() => res.json({ status: "deployed", url: `https://${updatedUser.fullDomain}` }))
        .catch((e) => res.status(500).json({ error: "contenedor desplegado pero fallo el proxy", detail: e.message }));
    });
  });
}

async function updateCaddyRoute(user) {
  const route = {
    "@id": `route-${user.subdomain}`,
    match: [{ host: [user.fullDomain] }],
    handle: [{ handler: "reverse_proxy", upstreams: [{ dial: `127.0.0.1:${user.hostPort}` }] }],
  };

  const res = await fetch(`${CADDY_ADMIN_URL}/id/route-${user.subdomain}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(route),
  }).catch(() => null);

  if (!res || !res.ok) {
    await fetch(`${CADDY_ADMIN_URL}/config/apps/http/servers/srv0/routes`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(route),
    });
  }
}

app.get("/status/:userId", (req, res) => {
  const user = getUserById(req.params.userId);
  if (!user) return res.status(404).json({ error: "no encontrado" });
  const { apiKey, ...publicData } = user;
  res.json(publicData);
});

app.listen(PORT, () => {
  console.log(`Chrono Sovereign Cloud — onboarding server en puerto ${PORT}`);
  console.log(`Dominio base: ${DOMAIN_BASE}`);
  console.log(`Base de datos: chrono_sovereign.db (SQLite)`);
});
