import './AboutPage.css';

function AboutPage({ onStartGenerating }) {
  return (
    <div className="about-page">
      <section className="about-hero card">
        <div className="hero-heading">
          <p className="eyebrow">About Artium</p>
          <h2>Built by Shalin to Make Daily Storytelling Effortless</h2>
          <p className="hero-copy">
            Artium exists because shaping a thoughtful article every day should feel inspiring—never exhausting. I built it so
            sharing stories with people becomes a daily rhythm instead of a draining task, especially when you want to preview how
            our AI collaborator behaves before publishing to Medium.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={onStartGenerating}>
              Start with a Sample Article
            </button>
          </div>
        </div>
      </section>

      <section className="about-grid">
        <article className="about-card card">
          <h3>Why I built Artium</h3>
          <p>
            Publishing consistently taught me that the hardest part is maintaining creative momentum. I wanted a space where I
            could brainstorm tone, audience, and narrative beats—then preview the structure before investing prompts or time in AI calls.
            Artium delivers that flow: experiment with a sample draft, learn how the sections unfold, and then bring Gemini in when you&apos;re ready.
          </p>
          <p>
            By keeping the daily article cadence smooth, it becomes easier to share stories, ideas, and lessons with the people who follow your journey.
          </p>
        </article>

        <article className="about-card card">
          <h3>About Shalin</h3>
          <p>
            I&apos;m Shalin Shah, a committed Flutter Developer Intern at <strong>SSB Digital</strong> in Ahmedabad, part of the SSBI Group, while pursuing
            a Bachelor of Technology in Computer Science at Charotar University of Science and Technology.
          </p>
          <p>
            My experience spans Flutter, Firebase, Node.js, MongoDB, and end-to-end product development. Previously, I contributed to a health-tech mobile
            product at <strong>Fettle Health</strong> and sharpened my foundations as a Flutter Intern at <strong>Sparks to Ideas</strong>.
          </p>
          <p>
            I&apos;ve shipped AI-powered assistants, sentiment analysis systems, HR utilities, and plant-recognition apps—all with an obsession for clean code,
            scalable architecture, and thoughtful UX. Artium reflects that same commitment to quality.
          </p>
          <div className="about-links">
            <a href="https://www.linkedin.com/in/shalin-shah0705/" target="_blank" rel="noreferrer" className="about-link">
              <span role="img" aria-label="LinkedIn">🔗</span> LinkedIn
            </a>
            <a href="https://github.com/Shalin-Shah-2002" target="_blank" rel="noreferrer" className="about-link">
              <span role="img" aria-label="GitHub">💻</span> GitHub
            </a>
          </div>
        </article>

        <article className="about-card card">
          <h3>How Artium helps you publish</h3>
          <ul>
            <li>Preview a Medium-ready draft in seconds with the guided sample generator.</li>
            <li>Shape tone, audience, and storytelling angles before calling on Gemini.</li>
            <li>Refine sections in place, copy clean HTML/Markdown, and save drafts securely.</li>
            <li>Build a daily writing rhythm without the friction that slows fresh ideas.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

export default AboutPage;
