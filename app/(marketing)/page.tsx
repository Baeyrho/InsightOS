import Link from "next/link";
import { ThemeToggle } from "@/components/marketing/ThemeToggle";
import btnStyles from "@/components/ui/Button/Button.module.css"
import styles from "./page.module.css";

export const metadata = {
  title: "InsightOS — Turn user research into prioritised product decisions",
  description: "Upload research artifacts or paste text to instantly synthesise pain points, jobs-to-be-done, and opportunity areas. Get prioritised recommendations and design considerations to help your team ship better decisions.",
};

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoLockup}>
            <div className={styles.logoBadge}>IO</div>
            <span className={styles.wordmark}>InsightOS</span>
          </div>
          <nav className={styles.nav}>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="main-content" className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>UX RESEARCH INTELLIGENCE</span>
            <h1 className={styles.h1}>
              Move from raw research to a prioritised product decision.
            </h1>
            <p className={styles.subtext}>
              Upload research artifacts or paste text to instantly synthesise pain points,
              jobs-to-be-done, and opportunity areas. Get prioritised recommendations
              and design considerations to help your team ship better decisions.
            </p>
            <div className={styles.ctas}>
              <Link href="/auth?mode=register" className={`${btnStyles.button} ${btnStyles.primary} ${btnStyles.lg}`}>
                Start free
              </Link>
              <Link href="/auth?mode=login" className={`${btnStyles.button} ${btnStyles.outline} ${btnStyles.lg}`}>
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.workflow}>
          <h2 className={styles.sectionHeading}>The core workflow</h2>
          <div className={styles.workflowGrid}>
            <div className={styles.topRow}>
              <div className={styles.card}>
                <span className={styles.cardBadge}>01</span>
                <h3 className={styles.cardTitle}>Create Project</h3>
                <p className={styles.cardDescription}>
                  Create a project and choose your research type.
                </p>
              </div>
              <div className={styles.card}>
                <span className={styles.cardBadge}>02</span>
                <h3 className={styles.cardTitle}>Upload Research</h3>
                <p className={styles.cardDescription}>
                  Paste transcripts or upload your research files.
                </p>
              </div>
            </div>
            <div className={styles.bottomRow}>
              <div className={styles.card}>
                <span className={styles.cardBadge}>03</span>
                <h3 className={styles.cardTitle}>Generate Insights</h3>
                <p className={styles.cardDescription}>
                  AI synthesises pain points, JTBD, and opportunity areas.
                </p>
              </div>
              <div className={styles.card}>
                <span className={styles.cardBadge}>04</span>
                <h3 className={styles.cardTitle}>Review & Prioritise</h3>
                <p className={styles.cardDescription}>
                  Browse prioritised (P0–P3) recommendations with evidence.
                </p>
              </div>
              <div className={styles.card}>
                <span className={styles.cardBadge}>05</span>
                <h3 className={styles.cardTitle}>Export Report</h3>
                <p className={styles.cardDescription}>
                  Download a structured PDF, Markdown, or CSV report.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>InsightOS · UX Research Intelligence.</p>
      </footer>
    </div>
  );
}
