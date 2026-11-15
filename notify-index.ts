// La Belle Appli — envoi des notifications (Supabase Edge Function « notify »)
// Secrets à définir dans Supabase : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
import webpush from "npm:web-push@3.6.7";

const SB_URL = "https://bhrzxvcgnywaeuyleewi.supabase.co";
const SB_KEY = "sb_publishable_I-GmnDzldQRnTscqJHKWOA_AJGFfn5I";
const APP_URL = "https://gurvan-kerian.github.io/xp-jdr/";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function jour(iso: string, sl: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${JOURS[wd]} ${d} ${MOIS[m - 1]}, ${sl === "J" ? "journée" : "soirée"}`;
}
async function rpc(fn: string, args: Record<string, unknown>) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`${fn} ${r.status}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
function demainParis() {
  const f = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
  return f.format(new Date(Date.now() + 24 * 3600 * 1000));
}
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let p: any = {};
  try { p = await req.json(); } catch { return json({ error: "requête invalide" }, 400); }
  const code = String(p.code || "");
  let rows: any[];
  try { rows = await rpc("xp_list", { p_code: code }); } catch { return json({ error: "code de table refusé" }, 403); }

  const players = rows.filter((r) => r.coll === "players");
  const planning = (rows.find((r) => r.coll === "meta" && r.id === "planning") || { data: { dates: [] } }).data;
  const dates: any[] = Array.isArray(planning.dates) ? planning.dates : [];
  const nom = (id: string) => (players.find((r) => r.id === id)?.data?.nom) || "Quelqu'un";

  let msg: { title: string; body: string; tag: string; url: string } | null = null;
  let exclude: string | null = null;
  if (p.kind === "prop") {
    const d = dates.find((x) => x.id === p.dateId);
    if (!d) return json({ error: "date introuvable" }, 404);
    exclude = d.by || p.from || null;
    msg = {
      title: "Nouvelle date proposée",
      body: `${nom(d.by)} propose ${jour(d.date, d.sl)}${d.type ? " (" + d.type + ")" : ""}. Tu viens ?`,
      tag: "prop-" + d.id, url: APP_URL + "#dates",
    };
  } else if (p.kind === "reminder") {
    const dm = demainParis();
    const d = dates.filter((x) => x.status === "valid" && x.date === dm).sort((a, b) => a.sl.localeCompare(b.sl))[0];
    if (!d) return json({ sent: 0, info: "pas de partie demain" });
    msg = {
      title: "Partie demain !",
      body: `Rappel : ${jour(d.date, d.sl)}${d.type ? " (" + d.type + ")" : ""}.`,
      tag: "rappel-" + d.id, url: APP_URL + "#dates",
    };
  } else return json({ error: "type inconnu" }, 400);

  webpush.setVapidDetails(APP_URL, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);
  let sent = 0, failed = 0;
  for (const r of players) {
    if (r.id === exclude || r.data?.parti) continue;
    const subs: any[] = Array.isArray(r.data?.push) ? r.data.push : [];
    if (!subs.length) continue;
    const dead: string[] = [];
    for (const s of subs) {
      try { await webpush.sendNotification(s, JSON.stringify(msg), { TTL: 86400 }); sent++; }
      catch (e: any) { failed++; if (e?.statusCode === 404 || e?.statusCode === 410) dead.push(s.endpoint); }
    }
    if (dead.length) {
      const data = { ...r.data, push: subs.filter((s) => !dead.includes(s.endpoint)) };
      try { await rpc("xp_set", { p_code: code, p_coll: "players", p_id: r.id, p_data: data }); } catch { /* sans gravité */ }
    }
  }
  return json({ sent, failed });
});
