const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");

const FILE = path.join(__dirname, "auth-data.json");
let db = { secret: crypto.randomBytes(32).toString("hex"), accounts: [] };
try { db = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
const save = () => { fs.writeFileSync(FILE + ".tmp", JSON.stringify(db)); fs.renameSync(FILE + ".tmp", FILE); };
save();

const sign = (p) => crypto.createHmac("sha256", db.secret).update(p).digest("base64url");
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString("hex");
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

function makeToken(aid) {
  const p = Buffer.from(JSON.stringify({ aid, exp: Date.now() + 7 * 864e5 })).toString("base64url");
  return p + "." + sign(p);
}
function readToken(req) {
  const h = req.get("authorization") || "";
  const [p, s] = (h.startsWith("Bearer ") ? h.slice(7) : "").split(".");
  if (!p || !s || !same(s, sign(p))) return null;
  try { const d = JSON.parse(Buffer.from(p, "base64url")); return d.exp > Date.now() ? d.aid : null; } catch { return null; }
}

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const a = (hits.get(ip) || []).filter((t) => now - t < 9e5);
  a.push(now); hits.set(ip, a);
  return a.length > 10;
}

const router = express.Router();
router.post("/auth/signup", (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Demasiados intentos, espera unos minutos" });
  const { email, password } = req.body || {};
  if (!/^\S+@\S+\.\S+$/.test(email || "") || (password || "").length < 10)
    return res.status(400).json({ error: "Correo válido y contraseña de mínimo 10 caracteres" });
  const e = email.toLowerCase();
  if (db.accounts.some((a) => a.email === e)) return res.status(409).json({ error: "Ese correo ya tiene cuenta" });
  const salt = crypto.randomBytes(16).toString("hex");
  const acc = { id: crypto.randomUUID(), email: e, salt, hash: hashPw(password, salt), userIds: [] };
  db.accounts.push(acc); save();
  res.json({ token: makeToken(acc.id) });
});
router.post("/auth/login", (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Demasiados intentos, espera unos minutos" });
  const { email, password } = req.body || {};
  const acc = db.accounts.find((a) => a.email === String(email || "").toLowerCase());
  if (!acc || !same(acc.hash, hashPw(String(password || ""), acc.salt)))
    return res.status(401).json({ error: "Correo o contraseña incorrectos" });
  res.json({ token: makeToken(acc.id), userIds: acc.userIds });
});
router.get("/auth/me", (req, res) => {
  const acc = db.accounts.find((a) => a.id === readToken(req));
  if (!acc) return res.status(401).json({ error: "No autenticado" });
  res.json({ email: acc.email, userIds: acc.userIds });
});

const OWNED = [
  ["GET", /^\/forms\/([^/]+)$/],
  ["POST", /^\/forms\/([^/]+)\/submit$/],
  ["POST", /^\/upload\/([^/]+)$/],
  ["DELETE", /^\/users\/([^/]+)$/],
];
function guard(req, res, next) {
  const acc = db.accounts.find((a) => a.id === readToken(req)) || null;
  const admin = process.env.ADMIN_KEY && same(req.get("x-admin-key") || "", process.env.ADMIN_KEY);
  req.account = acc;
  if (req.method === "POST" && req.path === "/register") {
    if (!acc) return res.status(401).json({ error: "Inicia sesión primero" });
    const j = res.json.bind(res);
    res.json = (b) => {
      const uid = b && (b.userId || b.id);
      if (uid && !acc.userIds.includes(uid)) { acc.userIds.push(uid); save(); }
      return j(b);
    };
    return next();
  }
  if (req.path.startsWith("/storage") && !acc && !admin) return res.status(401).json({ error: "Inicia sesión" });
if (req.method === "POST" && req.path.startsWith("/upload/") && req.get("x-api-key")) return next();
  for (const [m, re] of OWNED) {
    const x = req.method === m && re.exec(req.path);
    if (x && !admin && !(acc && acc.userIds.includes(decodeURIComponent(x[1]))))
      return res.status(acc ? 403 : 401).json({ error: "No autorizado" });
  }
  next();
}
module.exports = { router, guard };
