"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/pilgrims")
      .then((res) => res.json())
      .then((d) => setData(d));
  }, []);

  const total = data.length;
  const critical = data.filter((x) => x.risk_level === "حرجة").length;
  const medium = data.filter((x) => x.risk_level === "متوسطة").length;
  const low = data.filter((x) => x.risk_level === "منخفضة").length;
  const occupancy = total ? Math.round(((critical + medium) / total) * 100) : 0;
  const maxCount = Math.max(critical, medium, low, 1);

  return (
    <main className="min-h-screen flex justify-center px-4 py-10">
      <div className="w-full max-w-6xl space-y-8">

        {/* شريط علوي بسيط */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-300 shadow-lg shadow-sky-900/50 flex items-center justify-center">
              <span className="text-xs font-semibold text-slate-950">H</span>
            </div>
            <div>
              <p className="text-xs text-slate-400">منصة تنفيذية</p>
              <h1 className="text-xl font-semibold text-slate-50">
                منصة رصد الصحة في الحج
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1">
              نموذج أولي — بيانات تجريبية
            </span>
          </div>
        </motion.header>

        {/* هيرو تنفيذي */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-700/70 bg-slate-900/70 backdrop-blur-xl px-6 py-5 shadow-[0_22px_70px_rgba(15,23,42,0.9)] flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight">
              نظرة تنفيذية على الحالة الصحية للحجاج
            </h2>
            <p className="mt-2 text-sm text-slate-300/90 max-w-xl">
              لوحة متابعة عالية الجودة لعرض مؤشرات الحالات الصحية والضغط على العيادات
              الميدانية، بصياغة مناسبة للعرض على القيادات.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end text-xs text-slate-300/80">
            <span>موسم الحج — عينة بيانات تجريبية</span>
            <span className="mt-1 text-slate-400">
              لا تمثل بيانات تشغيلية فعلية
            </span>
          </div>
        </motion.section>

        {/* لوحة رئيسية: KPIs + تحليل + جدول */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
          {/* يسار: KPIs + جدول */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-4">
              <KpiCard
                label="إجمالي الحالات في العينة"
                value={total}
                tone="neutral"
              />
              <KpiCard
                label="الحالات الحرجة"
                value={critical}
                tone="critical"
              />
              <KpiCard
                label="الحالات المتوسطة"
                value={medium}
                tone="warning"
              />
              <KpiCard
                label="نسبة الإشغال التقديرية"
                value={`${occupancy}%`}
                tone="accent"
              />
            </div>

            {/* جدول */}
            <div className="rounded-3xl border border-slate-700/70 bg-slate-900/75 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.9)] overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    سجل الحالات الصحية
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    عينة من حالات حجاج مع مواقع العيادات ومستوى الخطورة.
                  </p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300">
                  {total} حالة في العينة
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-right text-sm">
                  <thead className="bg-slate-900/90 text-xs text-slate-300">
                    <tr>
                      <Th>المعرف</Th>
                      <Th>العمر</Th>
                      <Th>الحالة الصحية</Th>
                      <Th>موقع العيادة</Th>
                      <Th>مستوى الخطورة</Th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-slate-100">
                    {data.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`border-t border-slate-800/80 ${
                          idx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"
                        } hover:bg-slate-800/40 transition-colors`}
                      >
                        <Td className="font-medium text-slate-50">{p.id}</Td>
                        <Td>{p.age}</Td>
                        <Td className="max-w-xs truncate">
                          {p.health_status}
                        </Td>
                        <Td>{p.clinic_location}</Td>
                        <Td>
                          <RiskPill level={p.risk_level} />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* يمين: تحليل بصري + ملاحظة تنفيذية */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* رسم بياني */}
            <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-b from-sky-500/18 via-slate-900/85 to-slate-950/95 backdrop-blur-2xl p-5 shadow-[0_22px_70px_rgba(8,47,73,0.9)]">
              <h3 className="text-sm font-semibold text-slate-50 mb-1.5">
                توزيع الحالات حسب مستوى الخطورة
              </h3>
              <p className="text-xs text-slate-200/80 mb-4">
                تمثيل بصري مبسط لعدد الحالات في كل مستوى خطورة ضمن عينة
                البيانات الحالية.
              </p>

              <div className="flex items-end gap-4 h-44">
                <Bar
                  label="منخفضة"
                  value={low}
                  max={maxCount}
                  barClass="from-emerald-400 to-emerald-500"
                />
                <Bar
                  label="متوسطة"
                  value={medium}
                  max={maxCount}
                  barClass="from-amber-300 to-amber-400"
                />
                <Bar
                  label="حرجة"
                  value={critical}
                  max={maxCount}
                  barClass="from-rose-400 to-rose-500"
                />
              </div>
            </div>

            {/* ملاحظة تنفيذية */}
            <div className="rounded-3xl border border-slate-700/70 bg-slate-900/85 backdrop-blur-xl p-5 text-xs text-slate-300 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
              <p className="mb-2 font-semibold text-slate-100">
                ملاحظة تنفيذية
              </p>
              <p className="mb-1">
                هذه المنصة تمثل{" "}
                <span className="font-semibold">نموذجًا أوليًا تنفيذيًا</span>{" "}
                لعرض مؤشرات صحية للحجاج، ويمكن ربطها لاحقًا بمصادر بيانات
                تشغيلية حقيقية وأنظمة الوزارة.
              </p>
              <p className="text-slate-400">
                الأرقام المعروضة هنا لأغراض العرض والتجربة فقط، ولا يجوز
                الاعتماد عليها في أي قرار تشغيلي فعلي.
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

function KpiCard({ label, value, tone }) {
  let border = "border-slate-600/60";
  let bg = "bg-slate-900/70";
  let text = "text-slate-100";

  if (tone === "critical") {
    border = "border-rose-500/45";
    bg = "bg-rose-500/8";
    text = "text-rose-100";
  } else if (tone === "warning") {
    border = "border-amber-400/45";
    bg = "bg-amber-400/8";
    text = "text-amber-100";
  } else if (tone === "accent") {
    border = "border-sky-400/45";
    bg = "bg-sky-400/8";
    text = "text-sky-100";
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl border ${border} ${bg} ${text} shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/6 via-transparent to-white/0 pointer-events-none" />
      <div className="relative px-4 py-3.5">
        <p className="text-[11px] text-slate-300/85 mb-1">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-2.5 text-[11px] font-medium border-b border-slate-800/80">
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-2 align-middle text-slate-200 ${className}`}>
      {children}
    </td>
  );
}

function RiskPill({ level }) {
  let classes =
    "bg-emerald-500/10 text-emerald-200 border border-emerald-400/40";

  if (level === "متوسطة") {
    classes = "bg-amber-500/10 text-amber-200 border border-amber-400/40";
  } else if (level === "حرجة") {
    classes = "bg-rose-500/10 text-rose-200 border border-rose-400/40";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] ${classes}`}
    >
      <span className="ml-1 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {level}
    </span>
  );
}

function Bar({ label, value, max, barClass }) {
  const height = max ? (value / max) * 100 : 0;

  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <div
        className={`w-9 rounded-full bg-gradient-to-t ${barClass} shadow-lg shadow-sky-900/40 transition-all`}
        style={{ height: `${Math.max(height, 10)}%` }}
      />
      <div className="text-[11px] text-slate-200">{label}</div>
      <div className="text-[11px] text-slate-400">{value}</div>
    </div>
  );
}
