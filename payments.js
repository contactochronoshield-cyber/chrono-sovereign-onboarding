const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");

try {
  for (const l of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(l);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

// PRECIOS EN PESOS COLOMBIANOS POR MES: cámbialos aquí
const PLANS = {
  small: { name: "Semilla", cop: 29900, ram: "256 MB", cpu: "0.5 CPU" },
  medium: { name: "Escudo", cop: 69900, ram: "512 MB", cpu: "1 CPU" },
  large: { name: "Soberano", cop: 149900, ram: "1 GB", cpu: "1.5 CPU" },
};
const DAYS = 30;

const FILE = path.join(__dirname, "payments-data.json");
let db = { pending: {}, paid: {}, subs: {} };
try { db = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
db.trials = db.trials || {};
const save = () => { fs.writeFileSync(FILE + ".tmp", JSON.stringify(db)); fs.renameSync(FILE + ".tmp", FILE); };
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

const router = express.Router();

router.get("/pay/plans", (req, res) =>
  res.json(Object.entries(PLANS).map(([id, p]) => ({ id, name: p.name, cop: p.cop, ram: p.ram, cpu: p.cpu }))));

router.post("/pay/checkout", (req, res) => {
  const acc = req.account;
  if (!acc) return res.status(401).json({ error: "Inicia sesión" });
  const { userId, tier } = req.body || {};
  if (!acc.userIds.includes(userId)) return res.status(403).json({ error: "No autorizado" });
  const plan = PLANS[tier];
  if (!plan) return res.status(400).json({ error: "Plan inválido" });
  const pub = process.env.WOMPI_PUBLIC_KEY, sec = process.env.WOMPI_INTEGRITY_SECRET;
  if (!pub || !sec) return res.status(503).json({ error: "Los pagos aún no están configurados" });

  for (const k of Object.keys(db.pending)) if (Date.now() - db.pending[k].at > 2 * 864e5) delete db.pending[k];
  const cents = plan.cop * 100;
  const reference = "csn-" + crypto.randomBytes(8).toString("hex");
  db.pending[reference] = { userId, tier, cents, at: Date.now() };
  save();

  const q = new URLSearchParams({
    "public-key": pub,
    currency: "COP",
    "amount-in-cents": String(cents),
    reference,
    "signature:integrity": sha(reference + cents + "COP" + sec),
  });
  if (process.env.PUBLIC_URL) q.set("redirect-url", process.env.PUBLIC_URL + "/estado.html");
  res.json({ url: "https://checkout.wompi.co/p/?" + q.toString() });
});

router.post("/webhooks/wompi", (req, res) => {
  const ev = req.body || {};
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret || !ev.signature || !Array.isArray(ev.signature.properties)) return res.sendStatus(400);
  const get = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const calc = sha(ev.signature.properties.map((p) => get(ev.data, p)).join("") + ev.timestamp + secret);
  if (!same(calc, String(ev.signature.checksum || ""))) return res.sendStatus(401);

  if (ev.event === "transaction.updated") {
    const t = (ev.data && ev.data.transaction) || {};
    const p = db.pending[t.reference];
    if (t.status === "APPROVED" && p && !db.paid[t.id] && t.amount_in_cents === p.cents) {
      db.paid[t.id] = { reference: t.reference, userId: p.userId, tier: p.tier, cents: p.cents, at: new Date().toISOString() };
      const cur = db.subs[p.userId];
      const base = cur && new Date(cur.until) > new Date() ? new Date(cur.until) : new Date();
      db.subs[p.userId] = { tier: p.tier, until: new Date(base.getTime() + DAYS * 864e5).toISOString() };
      delete db.pending[t.reference];
      save();
    }
  }
  res.sendStatus(200);
});

router.get("/pay/status/:userId", (req, res) => {
  const acc = req.account;
  if (!acc) return res.status(401).json({ error: "Inicia sesión" });
  if (!acc.userIds.includes(req.params.userId)) return res.status(403).json({ error: "No autorizado" });
  const s = db.subs[req.params.userId];
  res.json({ active: !!s && new Date(s.until) > new Date(), tier: s && s.tier, until: s && s.until });
});

// Acceso: pago vigente, prueba gratis (una por correo) o correo exento
function access(user, create) {
  const e = String(user.email || "").toLowerCase();
  const free = (process.env.FREE_EMAILS || "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);
  if (e && free.includes(e)) return { ok: true, tier: "large", kind: "free" };
  const s = db.subs[user.userId];
  if (s && new Date(s.until) > new Date()) return { ok: true, tier: s.tier, kind: "paid", until: s.until };
  const days = Number(process.env.TRIAL_DAYS === undefined ? 7 : process.env.TRIAL_DAYS);
  if (days > 0 && e) {
    let t = db.trials[e];
    if (!t && create) { t = db.trials[e] = { userId: user.userId, until: new Date(Date.now() + days * 864e5).toISOString() }; save(); }
    if (t && t.userId === user.userId && new Date(t.until) > new Date()) return { ok: true, tier: "small", kind: "trial", until: t.until };
  }
  return { ok: false };
}
module.exports = router;
module.exports.access = access;
