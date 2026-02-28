import raw from "./data.json";

function normalizeRisk(v) {
  const x = String(v ?? "").toLowerCase().trim();

  if (["critical", "crit", "high", "danger", "urgent", "red", "حرج", "عالي"].includes(x)) return "critical";
  if (["medium", "med", "moderate", "yellow", "متوسط"].includes(x)) return "medium";
  if (["low", "green", "stable", "منخفض", "مستقر"].includes(x)) return "low";

  return "low";
}

function n(v, fallback = null) {
  const num = Number(v);
  return Number.isFinite(num) ? num : fallback;
}

export function GET() {
  const data = Array.isArray(raw) ? raw : (raw?.data ?? []);

  const normalized = data.map((p, idx) => ({
    id: p.id ?? idx + 1,
    name: p.name ?? p.fullName ?? "غير مسمى",
    age: p.age ?? p.Age ?? null,
    location: p.location ?? p.zone ?? p.area ?? "غير محدد",
    temperature: n(p.temperature ?? p.temp ?? p.bodyTemp, null),
    heartRate: n(p.heartRate ?? p.hr ?? p.pulse, null),
    risk: normalizeRisk(p.risk ?? p.riskLevel ?? p.level ?? p.status),
  }));

  return Response.json(normalized, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
