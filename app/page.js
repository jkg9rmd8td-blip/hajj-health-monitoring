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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-borderGlass bg-glass backdrop-blur-xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.45)]"
        >
          <h1 className="text-4xl font-semibold text-slate-100">
‎            منصة رصد الصحة في الحج
          </h1>
          <p className="mt-2 text-slate-300">
‎            منصة تنفيذية بتصميم فخم مستوحى من Apple VisionOS
          </p>
        </motion.div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi label="إجمالي الحالات" value={total} />
          <Kpi label="الحالات الحرجة" value={critical} color="red" />
          <Kpi label="الحالات المتوسطة" value={medium} color="amber" />
          <Kpi label="نسبة الإشغال" value={`${occupancy}%`} color="sky" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-borderGlass bg-glass backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.45)]"
          >
            <div className="p-6 border-b border-borderGlass">
              <h2 className="text-lg font-semibold text-slate-100">
‎                سجل الحالات الصحية
              </h2>
              <p className="text-sm text-slate-400 mt-1">
‎                بيانات تجريبية لعرض الفكرة التنفيذية.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <Th>المعرف</Th>
                    <Th>العمر</Th>
                    <Th>الحالة الصحية</Th>
                    <Th>العيادة</Th>
                    <Th>الخطورة</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-t border-borderGlass ${
                        i % 2 ? "bg-white/5" : "bg-white/0"
                      }`}
                    >
                      <Td>{p.id}</Td>
                      <Td>{p.age}</Td>
                      <Td>{p.health_status}</Td>
                      <Td>{p.clinic_location}</Td>
                      <Td>
                        <Risk level={p.risk_level} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-borderGlass bg-glass backdrop-blur-xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.45)]"
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
‎              توزيع الحالات حسب الخطورة
            </h2>

            <div className="flex items-end gap-4 h-48">
              <Bar label="منخفضة" value={low} max={maxCount} color="emerald" />
              <Bar label="متوسطة" value={medium} max={maxCount} color="amber" />
              <Bar label="حرجة" value={critical} max={maxCount} color="rose" />
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

function Kpi({ label, value, color }) {
  const colors = {
    red: "from-rose-400/40 to-rose-500/30",
    amber: "from-amber-300/40 to-amber-400/30",
    sky: "from-sky-400/40 to-sky-500/30",
    default: "from-white/10 to-white/5"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`rounded-3xl border border-borderGlass bg-glass backdrop-blur-xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.35)] bg-gradient-to-br ${
        colors[color] || colors.default
      }`}
    >
      <p className="text-sm text-slate-300">{label}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
    </motion.div>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-xs font-medium border-b border-borderGlass">
      {children}
    </th>
  );
}

function Td({ children }) {
  return <td className="px-4 py-3 text-slate-200">{children}</td>;
}

function Risk({ level }) {
  const colors = {
‎    منخفضة: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
‎    متوسطة: "text-amber-300 border-amber-500/40 bg-amber-500/10",
‎    حرجة: "text-rose-300 border-rose-500/40 bg-rose-500/10"
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs border ${colors[level]}`}
    >
      {level}
    </span>
  );
}

function Bar({ label, value, max, color }) {
  const height = max ? (value / max) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div
        className={`w-10 rounded-full bg-gradient-to-t from-${color}-500 to-${color}-300 shadow-lg`}
        style={{ height: `${Math.max(height, 8)}%` }}
      />
      <div className="text-xs text-slate-300">{label}</div>
      <div className="text-xs text-slate-400">{value}</div>
    </div>
  );
}
