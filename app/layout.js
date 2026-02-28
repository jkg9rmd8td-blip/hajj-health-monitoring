export const metadata = {
  title: "منصة رصد الصحة في الحج",
  description: "منصة تنفيذية بتصميم فخم مستوحى من Apple VisionOS"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
