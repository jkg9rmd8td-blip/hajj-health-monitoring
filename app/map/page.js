"use client"

export default function الخريطة() {
  return (
    <main>
      <div className="sectionTitle">الخريطة التشغيلية (قريباً)</div>

      <div className="card">
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>
          خريطة مواقع الحالات والقطاعات الصحية
        </div>
        <div style={{ opacity: .75, fontSize: 13, lineHeight: 1.9 }}>
          سيتم تفعيل طبقات الخريطة لإظهار:
          <ul style={{ margin: 0, paddingRight: 18 }}>
            <li>تجميع الحالات الحرجة حسب القطاع.</li>
            <li>خارطة حرارة للإجهاد الحراري.</li>
            <li>مواقع الفرق الطبية المتنقلة ونقاط الفرز.</li>
          </ul>
        </div>

        <div style={{
          marginTop: 14,
          height: 360,
          borderRadius: 16,
          border: "1px dashed rgba(255,255,255,.18)",
          background: "rgba(0,0,0,.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: .75,
          fontWeight: 800
        }}>
          مساحة عرض الخريطة
        </div>
      </div>
    </main>
  )
}
