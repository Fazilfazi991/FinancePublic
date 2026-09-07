import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Leaf,
  MessageCircle,
  Send,
  Sparkles,
  Target,
  TrendingDown,
} from "lucide-react";
import { BrandMark } from "@/components/brand-logo";
import { FreedomCount, Reveal } from "@/components/landing-motion";
import styles from "./landing.module.css";

const questions = [
  "How can I clear debt faster?",
  "What should I focus on this month?",
  "What happens if I pay ₹5,000 extra?",
  "Where am I overspending?",
];

export default function LandingPage() {
  return (
    <main className={`${styles.page} landing-shell -m-4 min-h-dvh overflow-hidden lg:-m-8`}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Primary navigation">
          <Link href="/" aria-label="ZeroDebt home" className={styles.brand}>
            <BrandMark className="h-8 w-8" />
            <span>ZeroDebt</span>
          </Link>
          <div className={styles.desktopNav}>
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
          </div>
          <div className={styles.navActions}>
            <Link href="/auth" className={styles.signIn}>Sign In</Link>
            <Link href="/auth" className={styles.navCta}>Start Free <ArrowRight /></Link>
          </div>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.statusPill}><Leaf /> A quiet step at a time</div>
          <h1>A brighter tomorrow<br />starts at <em>zero.</em></h1>
          <p>Track your debt, understand what to pay next, and make steady progress toward financial freedom.</p>
          <div className={styles.heroActions}>
            <Link href="/auth" className={styles.primaryCta}>Start for Free <ArrowRight /></Link>
            <a href="#how-it-works" className={styles.secondaryCta}>See How It Works <ArrowDown /></a>
          </div>
          <div className={styles.trustLine}><CheckCircle2 /> Free to start · No credit card · No bank connection</div>
        </div>

        <div className={styles.heroVisual} aria-label="Illustrative ZeroDebt payoff preview">
          <span className={styles.milestone}>Next milestone in 18 days <Leaf /></span>
          <div className={styles.appCard}>
            <div className={styles.cardTopline}><span>Freedom baseline</span><span>29.7% cleared</span></div>
            <p className={styles.metricLabel}>Remaining to your freedom</p>
            <p className={styles.metric}>₹10,68,000</p>
            <div className={styles.progressTrack}><span /></div>
            <div className={styles.attackCard}>
              <div><small>Focal next target · Avalanche</small><strong>HDFC Titanium Card</strong><span>Pay ₹14,000 this month to cut 2 mo. interest.</span></div>
              <b>₹58,000</b>
            </div>
            <Link href="/auth" className={styles.demoButton}>Log payoff progress <ArrowRight /></Link>
          </div>
          <span className={styles.monthlyPower}>Monthly payoff power <strong>₹14,500</strong></span>
        </div>
      </section>

      <Reveal className={`${styles.pathSection} ${styles.reveal}`} visibleClass={styles.visible}>
      <section id="how-it-works">
        <div className={styles.sectionIntro}>
          <h2>What ZeroDebt helps you do</h2>
          <p>Progress adds up quietly.</p>
        </div>
        <ol className={styles.pathList}>
          <PathStep title="Know your total debt" tag="Clarity" text="All balances, rates, and obligations organized into one clear, honest number: ₹10,68,000." />
          <PathStep title="Know what to pay next" tag="Laser focus" text="Forget juggling due dates and rates. ZeroDebt points you directly to the next lead domino." />
          <PathStep title="Keep moving toward zero" tag="Horizon 2026" text="Watch the percentage tick upward every month and see how your timeline changes." />
        </ol>
      </section></Reveal>

      <Reveal className={`${styles.freedomSection} ${styles.reveal}`} visibleClass={styles.visible}>
      <section id="features" className={styles.freedomContents}>
        <div className={styles.freedomCopy}>
          <h2>Your Freedom Number makes the invisible visible.</h2>
          <p>One honest number. One calm plan. Every payment redraws the distance between today and zero.</p>
        </div>
        <div className={styles.freedomPanel}>
          <div className={styles.freedomHeader}><span>Freedom Number</span><span><i /> Illustrative plan</span></div>
          <p><FreedomCount value={1068000} /> <small>to go</small></p>
          <div className={styles.freedomProgress}><span /></div>
          <div className={styles.freedomStats}><span><b>29.7%</b> cleared</span><span><b>₹4,52,000</b> paid</span><span><b>₹14,500</b> monthly power</span></div>
        </div>
      </section></Reveal>

      <section className={styles.strategySection}>
        <div>
          <h2>Pick a payoff rhythm you can trust.</h2>
          <p>ZeroDebt keeps the choice concise and the next action clear.</p>
        </div>
        <div className={styles.strategyChooser}>
          <article className={styles.strategyActive}><TrendingDown /><div><h3>Avalanche</h3><p>Highest interest first</p></div><span>Save more</span></article>
          <article><Target /><div><h3>Snowball</h3><p>Smallest balance first</p></div><span>Build momentum</span></article>
        </div>
      </section>

      <Reveal className={`${styles.telegramSection} ${styles.reveal}`} visibleClass={styles.visible}>
      <section className={styles.telegramContents}>
        <div className={styles.telegramCopy}>
          <MessageCircle />
          <h2>Tracking money should feel this easy.</h2>
          <p>Track spending without opening ZeroDebt. Just send a natural message when it happens.</p>
          <Link href="/auth" className={styles.textLink}>Connect Telegram <ArrowRight /></Link>
        </div>
        <div className={styles.chatWindow} aria-label="Illustrative Telegram quick entry conversation">
          <div className={styles.chatHeader}><Send /><span>ZeroDebt Quick Entry</span><small>Demo</small></div>
          <div className={styles.userBubble}>biryani 500 <time>1:42 PM</time></div>
          <div className={styles.botBubble}><b><Sparkles /> ZeroDebt</b><p>Logged <strong>₹500</strong> · Food &amp; Dining.</p><span>Monthly payoff power remains on track.</span></div>
        </div>
      </section></Reveal>

      <Reveal className={`${styles.askSection} ${styles.reveal}`} visibleClass={styles.visible}>
      <section className={styles.askContents}>
        <div className={styles.askCopy}>
          <span className={styles.botIcon}><Bot /></span>
          <h2>Ask your money anything.</h2>
          <p>Ask ZeroDebt is your account-aware financial copilot—grounded in your plan, not generic advice.</p>
        </div>
        <div className={styles.questions}>
          {questions.map((question, index) => <div className={styles.questionChip} key={question} style={{ "--delay": `${index * 90}ms` } as React.CSSProperties}>{question}<ArrowRight /></div>)}
          <div className={styles.answer}><span><i /> Ask ZeroDebt</span><p>Adding ₹5,000 extra this month could move your payoff date forward while keeping essentials covered.</p><small>Illustrative answer</small></div>
        </div>
      </section></Reveal>

      <section className={styles.freeSection}>
        <div className={styles.freeCard}>
          <div className={styles.freeHeading}><h2>Start free. ₹0.</h2><p>Free to start. No credit card required. No bank connection required.</p></div>
          <ul>
            {["Debt tracking", "Payoff plan", "Monthly payoff power", "Telegram Quick Entry", "Basic Ask ZeroDebt access"].map(item => <li key={item}><Check />{item}</li>)}
          </ul>
          <Link href="/auth" className={styles.freeCta}>Start for Free <ArrowRight /></Link>
          <small>Set up your first plan in a few calm steps.</small>
        </div>
      </section>

      <Reveal className={`${styles.finalCta} ${styles.reveal}`} visibleClass={styles.visible}>
      <section>
        <Leaf />
        <h2>Less debt.<br />A brighter you.</h2>
        <p>Your next chapter starts with one clear number.</p>
        <Link href="/auth" className={styles.primaryCta}>Start for Free <ArrowRight /></Link>
      </section></Reveal>

      <footer className={styles.footer}>
        <Link href="/" className={styles.brand}><BrandMark className="h-7 w-7" /><span>ZeroDebt</span></Link>
        <p>© {new Date().getFullYear()} ZeroDebt · A calmer way to become debt-free.</p>
        <nav aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </main>
  );
}

function PathStep({ title, tag, text }: { title: string; tag: string; text: string }) {
  return <li><span className={styles.pathDot}><Check /></span><div><div className={styles.pathTitle}><h3>{title}</h3><span>{tag}</span></div><p>{text}</p></div></li>;
}
