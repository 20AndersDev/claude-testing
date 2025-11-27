import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Fetch and cache user profile data
      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .limit(1);

        const profile = profileData && profileData.length > 0 ? profileData[0] : null;
        const profileObject = {
          name: data.user.user_metadata?.display_name || profile?.full_name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Current User',
          username: profile?.username || data.user.user_metadata?.username || '',
          bio: profile?.bio || data.user.user_metadata?.bio || 'Welcome to my profile! I love sharing thoughts and connecting with others.',
          location: profile?.location || data.user.user_metadata?.location || '',
          joinDate: new Date(data.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          profilePicture: profile?.avatar_url || data.user.user_metadata?.avatar_url || null
        };
        localStorage.setItem('userProfile', JSON.stringify(profileObject));
      }

      navigate('/feed');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-blob blob-1"></div>
        <div className="login-blob blob-2"></div>
        <div className="login-blob blob-3"></div>
      </div>
      <div className="login-form">
        <div className="login-header">
          <div className="login-icon">🗺️</div>
          <h1>TripTrail</h1>
          <p className="login-subtitle">Explore, Experience, Share Your Adventures</p>
          <h2>Welcome Back, Traveler!</h2>
          <p className="welcome-message">We're excited to see you again. Your next adventure awaits!</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '✨ Logging you in...' : '🚀 Continue Your Journey'}
          </button>
        </form>
        <div className="login-footer">
          <p className="footer-text">Don't have an account? <Link to="/register">Join our community</Link></p>
          <p className="help-text">Need help? We're here for you!</p>
        </div>
      </div>
    </div>
  );
}

export default Login;