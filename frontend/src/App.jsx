import { useState } from 'react';
import GeneratorPage from './components/GeneratorPage';
import DraftsList from './components/DraftsList';
import AuthPanel from './components/AuthPanel';
import AboutPage from './components/AboutPage';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('generator');
  const [editingArticle, setEditingArticle] = useState(null);
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const { user, logout } = useAuth();

  const handleEditDraft = (article) => {
    setEditingArticle(article);
    setCurrentView('generator');
  };

  const handleBackToGenerator = () => {
    setEditingArticle(null);
    setCurrentView('generator');
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="brand">
          <h1>Artium</h1>
          <p className="brand-tagline">Medium-ready article studio for polished storytelling</p>
        </div>
        <div className="header-actions">
          <nav className="nav-tabs">
            <button 
              className={currentView === 'generator' ? 'active' : ''}
              onClick={handleBackToGenerator}
            >
              Generate
            </button>
            <button 
              className={currentView === 'drafts' ? 'active' : ''}
              onClick={() => setCurrentView('drafts')}
            >
              My Drafts
            </button>
            <button
              className={currentView === 'about' ? 'active' : ''}
              onClick={() => setCurrentView('about')}
            >
              About
            </button>
          </nav>
          <div className="auth-controls">
            {user ? (
              <div className="auth-chip">
                <div className="auth-avatar">{(user.name || user.email || '?').charAt(0).toUpperCase()}</div>
                <div className="auth-meta">
                  <span className="auth-label">Signed in</span>
                  <span className="auth-name">{user.name || user.email}</span>
                </div>
                <button className="btn-outline btn-sm" onClick={logout}>
                  Log out
                </button>
              </div>
            ) : (
              <button className="btn-secondary" onClick={() => setShowAuthPanel(true)}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main" style={{padding: 0, margin: 0, width: '100%'}}>
        {currentView === 'generator' && (
          <GeneratorPage 
            editingArticle={editingArticle} 
            onClearEdit={() => setEditingArticle(null)}
          />
        )}
        {currentView === 'drafts' && (
          <DraftsList onEdit={handleEditDraft} />
        )}
        {currentView === 'about' && (
          <AboutPage onStartGenerating={handleBackToGenerator} />
        )}
      </main>

      <AuthPanel isOpen={showAuthPanel} onClose={() => setShowAuthPanel(false)} />
    </div>
  );
}

export default App;
