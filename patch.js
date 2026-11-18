const fs = require("fs");
function apply(s, file, pairs) {
  for (const [a, b, all] of pairs) {
    if (!s.includes(a)) { console.error("NO ENCONTRADO en " + file + ": " + a.slice(0, 70)); process.exit(1); }
    s = all ? s.split(a).join(b) : s.replace(a, () => b);
  }
  return s;
}
const rd = (f) => fs.readFileSync(f, "utf8");

const pay = apply(rd("payments.js"), "payments.js", [
  ['small: { name: "Semilla", cop: 29900 },', 'small: { name: "Semilla", cop: 29900, ram: "256 MB", cpu: "0.5 CPU" },'],
  ['medium: { name: "Escudo", cop: 69900 },', 'medium: { name: "Escudo", cop: 69900, ram: "512 MB", cpu: "1 CPU" },'],
  ['large: { name: "Soberano", cop: 149900 },', 'large: { name: "Soberano", cop: 149900, ram: "1 GB", cpu: "1.5 CPU" },'],
  ["({ id, name: p.name, cop: p.cop })", "({ id, name: p.name, cop: p.cop, ram: p.ram, cpu: p.cpu })"],
  ['try { db = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}', 'try { db = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}\ndb.trials = db.trials || {};'],
  ["module.exports = router;", `// Acceso: pago vigente, prueba gratis (una por correo) o correo exento
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
module.exports.access = access;`],
]);

const srv = apply(rd("onboarding-server.js"), "onboarding-server.js", [
  ['app.use(require("./payments"));', 'const payments = require("./payments");\napp.use(payments);'],
  ["function deployContainer(user, siteDir, res) {", `function deployContainer(user, siteDir, res) {
  const access = payments.access(user, true);
  if (!access.ok) return res.status(402).json({ error: "Necesitas un plan activo para desplegar", pagar: "/pagar.html" });
  const LIM = getTier(access.tier);`],
  ["`--memory=${CONTAINER_LIMITS.memory}`", "`--memory=${LIM.memory}`, `--memory-swap=${LIM.memory}`"],
  ["`--cpus=${CONTAINER_LIMITS.cpus}`", "`--cpus=${LIM.cpus}`"],
]);

const html = apply(rd("public/pagar.html"), "public/pagar.html", [
  ["b.textContent=p.name;", 'b.textContent=p.name+(p.id==="medium"?" · Más popular":"");'],
  ['var btn=document.createElement("button");', 'var k=document.createElement("span");k.textContent=p.ram+" de RAM · "+p.cpu;var btn=document.createElement("button");'],
  ["d.appendChild(b);d.appendChild(s);d.appendChild(btn);", "d.appendChild(b);d.appendChild(s);d.appendChild(k);d.appendChild(btn);"],
]);

fs.writeFileSync("payments.js", pay);
fs.writeFileSync("onboarding-server.js", srv);
fs.writeFileSync("public/pagar.html", html);
console.log("PARCHE OK");
