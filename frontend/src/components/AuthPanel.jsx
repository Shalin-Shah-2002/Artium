import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthPanel.css';

function AuthPanel({ isOpen, onClose }) {
  const { login, register, loading, error, clearError } = useAuth();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    if (isOpen) {
      clearError();
    }
  }, [isOpen, clearError]);

  const handleClose = () => {
    clearError();
    setMode('login');
    setFormData({ name: '', email: '', password: '' });
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
      setFormData({ name: '', email: '', password: '' });
      handleClose();
    } catch (err) {
      console.warn('Authentication failed', err);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    clearError();
  };

  return (
    <div className="auth-panel-overlay" role="dialog" aria-modal="true">
      <div className="auth-panel card">
        <div className="auth-panel-header">
          <h2>{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
          <button type="button" className="close-button" onClick={handleClose} aria-label="Close">
            &times;
          </button>
        </div>
        <p className="auth-panel-subtitle">
          {mode === 'login'
            ? 'Sign in to access your saved drafts and continue editing.'
            : 'Sign up to save drafts and keep everything synced across devices.'}
        </p>

        {error && <div className="error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={72}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-panel-footer">
          <span>{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
          <button type="button" className="link-button" onClick={toggleMode}>
            {mode === 'login' ? 'Create one' : 'Sign in instead'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthPanel;
