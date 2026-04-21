import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  portal,
  title,
  description,
  asideTitle,
  asideCopy,
  children,
  footer
}: {
  portal: string;
  title: string;
  description: string;
  asideTitle: string;
  asideCopy: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <section className="auth-hero">
          <p className="eyebrow">{portal}</p>
          <h1>{title}</h1>
          <p className="hero-copy">{description}</p>
          <div className="portal-panel" style={{ marginTop: 24 }}>
            <p className="eyebrow">Clinical cadence</p>
            <h2>{asideTitle}</h2>
            <p className="muted" style={{ marginTop: 10 }}>
              {asideCopy}
            </p>
            <div className="two-column" style={{ marginTop: 18 }}>
              <div className="stat-card">
                <p className="eyebrow">Upload Flow</p>
                <strong>Auto AI</strong>
                <p className="muted">上传完成后自动排队分析，医生可补跑。</p>
              </div>
              <div className="stat-card">
                <p className="eyebrow">Review Unit</p>
                <strong>One Follow-up</strong>
                <p className="muted">同日多角度影像归为一次随访，再由医生完成综合判读。</p>
              </div>
            </div>
          </div>
        </section>
        <section className="auth-card">
          {children}
          <div className="inline-row">
            <Link className="auth-link" href="/">
              返回总入口
            </Link>
            <div className="muted">{footer}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
