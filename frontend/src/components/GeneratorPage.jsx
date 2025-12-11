import { useState, useEffect } from 'react';
import SectionEditor from './SectionEditor';
import ApiKeyInfo from './ApiKeyInfo';
import { useAuth } from '../context/AuthContext';
import { buildMarkdownFromArticle, buildHtmlFromArticle } from '../utils/articleFormatting';
import { apiUrl } from '../utils/apiConfig';
import './GeneratorPage.css';

function GeneratorPage({ editingArticle, onClearEdit }) {
  const [formData, setFormData] = useState({
    title: '',
    tone: 'informative',
    audience: '',
    topics: '',
    additionalPrompt: '',
    apiKey: ''
  });
  
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showApiInfo, setShowApiInfo] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { token, authFetch } = useAuth();

  // Load editing article if provided
  useEffect(() => {
    if (editingArticle) {
      setFormData({
        title: editingArticle.title || '',
        tone: editingArticle.tone || 'informative',
        audience: editingArticle.audience || '',
        topics: editingArticle.topics?.join(', ') || '',
        additionalPrompt: editingArticle.additionalPrompt || '',
        apiKey: ''
      });
      setGeneratedArticle(editingArticle);
    }
  }, [editingArticle]);

  // Load API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
      setFormData(prev => ({ ...prev, apiKey: savedKey }));
    }
  }, []);

  // Show welcome tutorial for first-time visitors
  useEffect(() => {
    const seenTutorial = localStorage.getItem('artiumTutorialSeen');
    if (!seenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const handleDismissTutorial = () => {
    localStorage.setItem('artiumTutorialSeen', 'true');
    setShowTutorial(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveApiKey = (e) => {
    if (e.target.checked && formData.apiKey) {
      localStorage.setItem('geminiApiKey', formData.apiKey);
    } else {
      localStorage.removeItem('geminiApiKey');
    }
  };

  const generateSampleArticle = () => {
    const topics = formData.topics.split(',').map(t => t.trim()).filter(Boolean);
    const topicsText = topics.length > 0 ? topics.join(', ') : 'various aspects';
    const additionalPrompt = formData.additionalPrompt?.trim();
    const narrativeHint = additionalPrompt
      ? `\n\nStory spotlight: ${additionalPrompt}`
      : '';
    
    return {
      title: formData.title,
      tags: ["Writing", "Tutorial", "Guide", "Tips", "Learning"],
      sections: [
        {
          id: "intro",
          heading: "Introduction",
          content: `Welcome to this comprehensive guide about ${formData.title}. This article will explore ${topicsText} in a ${formData.tone} manner${formData.audience ? ` for ${formData.audience}` : ''}.${narrativeHint}\n\nWhether you're just starting out or looking to deepen your knowledge, you'll find valuable insights and practical tips throughout this guide.`,
          order: 1
        },
        {
          id: "section-1",
          heading: "Understanding the Basics",
          content: `Before diving deep, it's essential to understand the fundamental concepts. ${formData.title} encompasses various important elements that work together to create a comprehensive understanding.\n\nThese foundational principles will serve as building blocks for more advanced topics we'll cover later.`,
          order: 2
        },
        {
          id: "section-2",
          heading: "Key Concepts and Best Practices",
          content: `Now that we've covered the basics, let's explore the key concepts in detail. Following best practices ensures that you're on the right track.\n\nRemember, consistency and attention to detail are crucial for success in this area. Take your time to understand each concept thoroughly before moving forward.\n\n- Start with the core principle and document your assumptions.\n- Validate each idea with a quick prototype or experiment.\n- Capture lessons learned so you can refine the next iteration.`,
          order: 3
        },
        {
          id: "section-3",
          heading: "Practical Applications",
          content: `Theory is important, but practical application is where real learning happens. Let's look at how you can apply what you've learned in real-world scenarios.\n\nStart with small projects and gradually increase complexity as you become more comfortable with the concepts.\n\nTry framing each project around a clear outcome, then work backward to define the milestones. This Medium-ready structure keeps the narrative focused when you paste it into the editor.`,
          order: 4
        },
        {
          id: "conclusion",
          heading: "Conclusion",
          content: `We've covered a lot of ground in this article about ${formData.title}. The key takeaways are understanding the basics, following best practices, and applying your knowledge practically.\n\nKeep learning, stay curious, and don't be afraid to experiment. Your journey is just beginning!\n\n**Next steps:** Share your insights on Medium, invite feedback, and iterate on your ideas in public.`,
          order: 5
        }
      ],
      additionalPrompt: additionalPrompt || null
    };
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!useAI) {
        // Generate sample article without AI
        setTimeout(() => {
          const article = generateSampleArticle();
          setGeneratedArticle(article);
          setSuccess('Sample article generated! (Non-AI mode)');
          setLoading(false);
          if (onClearEdit) onClearEdit();
        }, 1500);
        return;
      }

      const topics = formData.topics
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const response = await fetch(apiUrl('/api/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          tone: formData.tone,
          audience: formData.audience || null,
          topics: topics.length > 0 ? topics : null,
          additionalPrompt: formData.additionalPrompt?.trim() || null,
          apiKey: formData.apiKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate article');
      }

      setGeneratedArticle({
        ...data.article,
        additionalPrompt: data.article.additionalPrompt ?? (formData.additionalPrompt || null),
      });
      setSuccess('Article generated successfully!');
      if (onClearEdit) onClearEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionUpdate = (sectionId, updatedSection) => {
    setGeneratedArticle(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? updatedSection : s
      )
    }));
  };

  const handleSaveDraft = async () => {
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Please sign in to save drafts.');
      return;
    }

    try {
      const payload = {
        title: generatedArticle.title,
        tone: formData.tone,
        audience: formData.audience || null,
        topics: formData.topics.split(',').map(t => t.trim()).filter(Boolean),
        additionalPrompt: formData.additionalPrompt?.trim() || null,
        tags: generatedArticle.tags || [],
        sections: generatedArticle.sections || [],
        status: 'draft'
      };

      let response;
      if (editingArticle && editingArticle._id) {
        // Update existing
        response = await authFetch(`/api/articles/${editingArticle._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new
        response = await authFetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to save draft');
      }

      setSuccess('Draft saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportMarkdown = () => {
    if (!generatedArticle) return;

    const markdown = buildMarkdownFromArticle(generatedArticle);

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedArticle.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccess('Markdown file downloaded!');
  };

  const handleCopyForMedium = async () => {
    if (!generatedArticle) return;

    try {
      const markdown = buildMarkdownFromArticle(generatedArticle);
      const html = buildHtmlFromArticle(generatedArticle);

      if (navigator?.clipboard?.write && typeof window !== 'undefined' && window.ClipboardItem) {
        const clipboardData = {};
        if (html) {
          clipboardData['text/html'] = new Blob([html], { type: 'text/html' });
        }
        clipboardData['text/plain'] = new Blob([markdown], { type: 'text/plain' });
        await navigator.clipboard.write([new window.ClipboardItem(clipboardData)]);
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!copied) {
          throw new Error('Copy command unavailable');
        }
      }
      setError(null);
      setSuccess('Medium-ready article copied! Paste into Medium to keep headings and lists.');
    } catch {
      setSuccess(null);
      setError('Clipboard copy failed. Please allow clipboard access or use the Markdown download option.');
    }
  };

  const hasGeneratedContent = !!generatedArticle;

  return (
    <>
      <div
        className={`generator-page ${hasGeneratedContent ? 'two-column' : 'single-column'} ${showTutorial ? 'tutorial-active' : ''}`}
        aria-hidden={showTutorial}
      >
      <div className="generator-form">
        <h2>Compose with Artium</h2>
        <p className="form-subtitle">Shape a Medium-ready draft by guiding tone, audience, key ideas, and your narrative prompt.</p>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="mode-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">
            {useAI ? '🤖 AI Mode (Gemini)' : '📝 Sample Mode (No AI)'}
          </span>
        </div>

        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label htmlFor="title">Article Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., How to Build a Modern Web App"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tone">Tone</label>
            <select
              id="tone"
              name="tone"
              value={formData.tone}
              onChange={handleInputChange}
            >
              <option value="informative">Informative</option>
              <option value="persuasive">Persuasive</option>
              <option value="casual">Casual</option>
              <option value="professional">Professional</option>
              <option value="humorous">Humorous</option>
              <option value="inspiring">Inspiring</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="audience">Target Audience (optional)</label>
            <input
              type="text"
              id="audience"
              name="audience"
              value={formData.audience}
              onChange={handleInputChange}
              placeholder="e.g., developers, entrepreneurs, beginners"
            />
          </div>

          <div className="form-group">
            <label htmlFor="topics">Key Topics (comma-separated, optional)</label>
            <textarea
              id="topics"
              name="topics"
              value={formData.topics}
              onChange={handleInputChange}
              placeholder="e.g., React hooks, State management, Performance optimization"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="additionalPrompt">Additional Prompt / Story Angle (optional)</label>
            <textarea
              id="additionalPrompt"
              name="additionalPrompt"
              value={formData.additionalPrompt}
              onChange={handleInputChange}
              placeholder="Share the backstory, lessons learned, or narrative beats you want woven into the article."
              rows="4"
            />
          </div>

          {useAI && (
            <>
              <div className="form-group">
                <label htmlFor="apiKey">
                  Gemini API Key *
                  <button
                    type="button"
                    className="info-button"
                    onClick={() => setShowApiInfo(!showApiInfo)}
                  >
                    ℹ️ How to get?
                  </button>
                </label>
                <input
                  type="password"
                  id="apiKey"
                  name="apiKey"
                  value={formData.apiKey}
                  onChange={handleInputChange}
                  placeholder="Enter your Gemini API key"
                  required
                />
                <label className="checkbox-label">
                  <input type="checkbox" onChange={saveApiKey} />
                  <span>Remember API key (stored locally)</span>
                </label>
              </div>

              {showApiInfo && <ApiKeyInfo />}
            </>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '🔄 Generating...' : useAI ? '✨ Generate with AI' : '📝 Generate Sample Article'}
          </button>
        </form>
      </div>

      {generatedArticle && (
        <div className="generated-article">
          <div className="article-header card">
            <h2>{generatedArticle.title}</h2>
            {generatedArticle.tags && generatedArticle.tags.length > 0 && (
              <div className="tags">
                {generatedArticle.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            )}
            <div className="article-actions">
              <button onClick={handleSaveDraft} className="btn-secondary">
                💾 Save Draft
              </button>
              <button onClick={handleCopyForMedium} className="btn-outline">
                📋 Copy for Medium
              </button>
              <button onClick={handleExportMarkdown} className="btn-outline">
                📥 Export Markdown
              </button>
            </div>
          </div>

          <div className="sections">
            {generatedArticle.sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                apiKey={formData.apiKey}
                article={generatedArticle}
                onUpdate={handleSectionUpdate}
              />
            ))}
          </div>
        </div>
      )}
      </div>

      {showTutorial && (
        <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
          <div className="tutorial-card">
            <h3 id="tutorial-title">Welcome to Artium Studio</h3>
            <p className="tutorial-intro">
              Before you ask Gemini for the real thing, we recommend generating a sample article. It shows exactly how Artium structures Medium-ready drafts.
            </p>
            <ol className="tutorial-steps">
              <li>Leave the toggle in <strong>Sample Mode</strong> so we stay off the API for now.</li>
              <li>Drop in an article title and any tone, audience, or storytelling hints you want.</li>
              <li>Hit <strong>“Generate Sample Article”</strong> to preview the flow. When it feels right, flip to AI mode and create your final draft.</li>
            </ol>
            <button type="button" className="btn-primary tutorial-button" onClick={handleDismissTutorial}>
              Got it — I&apos;ll start with a sample
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default GeneratorPage;
