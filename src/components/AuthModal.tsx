import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      onClose();
    }
  };

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>Login</h2>
          <button onClick={onClose} className="icon-button" type="button"><X size={20} /></button>
        </div>
        <form onSubmit={handleLogin} className="modal-form">
          {error && <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '4px', fontSize: '0.875rem' }}>{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
