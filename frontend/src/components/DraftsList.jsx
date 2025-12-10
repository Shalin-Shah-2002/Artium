import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './DraftsList.css';

function DraftsList({ onEdit }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, authFetch } = useAuth();

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authFetch('/api/articles?limit=50');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch drafts');
      }
      
      setDrafts(data.articles || []);
    } catch (err) {
      let message;
      if (err.message === 'Authentication required') {
        message = 'Sign in to view your drafts.';
      } else if (err.message?.toLowerCase().includes('session expired')) {
        message = 'Session expired. Please sign in again.';
      } else {
        message = err.message;
      }
      setDrafts([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!token) {
      setDrafts([]);
      setError('Sign in to view your drafts.');
      setLoading(false);
      return;
    }

    fetchDrafts();
  }, [token, fetchDrafts]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    if (!token) {
      alert('Please sign in to manage drafts.');
      return;
    }

    try {
      const response = await authFetch(`/api/articles/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to delete draft');
      }

      setDrafts(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <section className="drafts-list">
        <div className="drafts-content">
          <div className="drafts-placeholder">Loading drafts...</div>
        </div>
      </section>
    );
  }

  const isEmpty = drafts.length === 0;
  const showEmptyState = isEmpty && !error;
  const draftCountLabel = `${drafts.length} ${drafts.length === 1 ? 'draft' : 'drafts'}`;

  return (
    <section className="drafts-list">
      <div className="drafts-content">
        <div className="drafts-heading">
          <div className="drafts-heading-text">
            <h2>My Drafts</h2>
            <p className="drafts-subtitle">
              Save, revisit, and refine every article concept in one polished workspace.
            </p>
          </div>
          <span className="drafts-count">{draftCountLabel}</span>
        </div>

        {error && (
          <div className="error">
            ⚠️ {error}
          </div>
        )}

        {showEmptyState ? (
          <div className="empty-state card">
            <h2>📝 No Drafts Yet</h2>
            <p>Generate your first article to see it here!</p>
          </div>
        ) : drafts.length > 0 ? (
          <div className="drafts-grid">
            {drafts.map((draft) => (
              <div key={draft._id} className="draft-card card">
                <div className="draft-header">
                  <h3>{draft.title}</h3>
                  <span className="draft-status">{draft.status}</span>
                </div>

                {draft.tags && draft.tags.length > 0 && (
                  <div className="tags">
                    {draft.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                    {draft.tags.length > 3 && (
                      <span className="tag">+{draft.tags.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="draft-meta">
                  <span>📅 {formatDate(draft.updatedAt)}</span>
                  <span>📄 {draft.sections?.length || 0} sections</span>
                </div>

                <div className="draft-actions">
                  <button onClick={() => onEdit(draft)} className="btn-primary">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(draft._id)} className="btn-danger">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default DraftsList;
