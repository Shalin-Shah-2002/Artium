import { useMemo, useState } from 'react';
import { parseContentBlocks } from '../utils/articleFormatting';
import './SectionEditor.css';

const renderInlineSegments = (segments = []) =>
  segments.map((segment, idx) => {
    if (segment.type === 'strong') {
      return <strong key={`strong-${idx}`}>{segment.value}</strong>;
    }
    if (segment.type === 'em') {
      return <em key={`em-${idx}`}>{segment.value}</em>;
    }
    return <span key={`text-${idx}`}>{segment.value}</span>;
  });

function SectionEditor({ section, apiKey, article, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(section.content);
  const [editedHeading, setEditedHeading] = useState(section.heading);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const contentBlocks = useMemo(() => parseContentBlocks(section.content || ''), [section.content]);

  const handleSave = () => {
    onUpdate(section.id, {
      ...section,
      heading: editedHeading,
      content: editedContent
    });
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setEditedContent(section.content);
    setEditedHeading(section.heading);
    setIsEditing(false);
    setError(null);
  };

  const handleRegenerate = async () => {
    setError(null);
    setIsRegenerating(true);

    try {
      const response = await fetch('/api/section/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article,
          sectionId: section.id,
          apiKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to regenerate section');
      }

      setEditedContent(data.section.content);
      onUpdate(section.id, data.section);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="section-editor card">
      {error && <div className="error">{error}</div>}
      
      {isEditing ? (
        <div className="editing-mode">
          <input
            type="text"
            value={editedHeading}
            onChange={(e) => setEditedHeading(e.target.value)}
            className="heading-input"
          />
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows="10"
            className="content-textarea"
          />
          <div className="editor-actions">
            <button onClick={handleSave} className="btn-primary">
              ✓ Save
            </button>
            <button onClick={handleCancel} className="btn-outline">
              ✕ Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="view-mode">
          <div className="section-header">
            <h3>{section.heading}</h3>
            <div className="section-actions">
              <button onClick={() => setIsEditing(true)} className="btn-outline btn-sm">
                ✏️ Edit
              </button>
              <button
                onClick={handleRegenerate}
                className="btn-outline btn-sm"
                disabled={isRegenerating || !apiKey}
                title={!apiKey ? 'API key required' : ''}
              >
                {isRegenerating ? '🔄' : '🔄'} Regenerate
              </button>
            </div>
          </div>
          <div className="section-content">
            {contentBlocks.map((block, idx) => {
              if (block.type === 'paragraph') {
                return (
                  <p key={`paragraph-${idx}`}>
                    {renderInlineSegments(block.segments)}
                  </p>
                );
              }

              if (block.type === 'ul') {
                return (
                  <ul key={`ul-${idx}`}>
                    {block.items.map((item, itemIdx) => (
                      <li key={`ul-${idx}-${itemIdx}`}>
                        {renderInlineSegments(item)}
                      </li>
                    ))}
                  </ul>
                );
              }

              if (block.type === 'ol') {
                return (
                  <ol key={`ol-${idx}`}>
                    {block.items.map((item, itemIdx) => (
                      <li key={`ol-${idx}-${itemIdx}`}>
                        {renderInlineSegments(item)}
                      </li>
                    ))}
                  </ol>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionEditor;
