import Link from "next/link";

const entries = [
  {
    href: "/doctor/patients" as const,
    eyebrow: "Doctor Portal",
    title: "Clinical review, image triage, and final reports",
    copy: "面向科室工作流的主工作台，承载患者列表、影像查看、AI 辅助诊断与人工综合判读。"
  },
  {
    href: "/patient/dashboard" as const,
    eyebrow: "Patient Portal",
    title: "Guided uploads and calm result visibility",
    copy: "患者端强调清晰与安心，聚焦上传影像、查看随访状态和阅读医生给出的最终结论。"
  }
];

export default function HomePage() {
  return (
    <main className="atlas-shell">
      <section className="hero-panel">
        <p className="eyebrow">Stoma Atlas Platform</p>
        <h1>肠造口随访与诊断工作台</h1>
        <p className="hero-copy">
          以临床图谱为灵感的双端系统骨架。医生端更强调密度与判断，患者端更强调引导与信任。
        </p>
      </section>
      <section className="entry-grid">
        {entries.map((entry) => (
          <Link key={entry.href} className="entry-card" href={entry.href}>
            <p className="eyebrow">{entry.eyebrow}</p>
            <h2>{entry.title}</h2>
            <p>{entry.copy}</p>
            <span>Enter workspace</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
