import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import './Settings.css';

function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('security');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  useEffect(() => {
    checkMfaStatus();
    fetchBlockedUsers();
  }, []);

  const checkMfaStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totp = data?.totp?.find(factor => factor.status === 'verified');
      setMfaEnabled(!!totp);
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  };

  const setupMfa = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setFactorId(data.id);
      setShowMfaSetup(true);
    } catch (error) {
      setError(error.message || 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: verifyCode
      });

      if (error) throw error;

      setSuccess('MFA enabled successfully!');
      setMfaEnabled(true);
      setShowMfaSetup(false);
      setVerifyCode('');
    } catch (error) {
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const disableMfa = async () => {
    if (!window.confirm('Are you sure you want to disable MFA?')) return;

    setLoading(true);
    setError('');
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find(factor => factor.status === 'verified');

      if (totp) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: totp.id
        });

        if (error) throw error;

        setSuccess('MFA disabled successfully!');
        setMfaEnabled(false);
      }
    } catch (error) {
      setError(error.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    if (!user) return;

    setLoadingBlockedUsers(true);
    try {
      const { data: blockedData, error } = await supabase
        .from('blocked_users')
        .select('id, blocked_id, created_at')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST116') {
          console.warn('Blocked users table not configured');
          setBlockedUsers([]);
          return;
        }
        throw error;
      }

      // Fetch profile data for each blocked user
      const blockedWithProfiles = await Promise.all(
        (blockedData || []).map(async (block) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', block.blocked_id)
            .single();

          return {
            ...block,
            profile: profileData
          };
        })
      );

      setBlockedUsers(blockedWithProfiles);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      setBlockedUsers([]);
    } finally {
      setLoadingBlockedUsers(false);
    }
  };

  const handleUnblockUser = async (blockId, username) => {
    if (!window.confirm(`Are you sure you want to unblock @${username}?`)) return;

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      setSuccess(`Successfully unblocked @${username}`);
      // Refresh the blocked users list
      await fetchBlockedUsers();
    } catch (error) {
      console.error('Error unblocking user:', error);
      setError('Failed to unblock user. Please try again.');
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setError('No email address found for your account');
      return;
    }

    if (!window.confirm('Are you sure you want to reset your password? We will send a password reset link to your email.')) {
      return;
    }

    setPasswordResetLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      setSuccess(`Password reset link sent to ${user.email}. Please check your email.`);
    } catch (error) {
      console.error('Error sending password reset:', error);
      setError(error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const menuItems = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="settings-content-section">
            <h2>Account Settings</h2>
            <p className="section-description">Manage your account information and preferences</p>
            <div className="settings-placeholder">
              <p>Account settings coming soon...</p>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="settings-content-section">
            <h2>Security</h2>
            <p className="section-description">Manage your security settings and authentication</p>

            <div className="setting-card">
              <div className="setting-card-header">
                <div className="setting-card-title">
                  <h3>Password</h3>
                </div>
                <p className="setting-card-description">
                  Reset your password. A password reset link will be sent to your email address.
                </p>
              </div>

              <div className="setting-card-action">
                <button
                  className="btn-primary"
                  onClick={handlePasswordReset}
                  disabled={passwordResetLoading}
                >
                  {passwordResetLoading ? 'Sending...' : 'Reset Password'}
                </button>
              </div>
            </div>

            <div className="setting-card">
              <div className="setting-card-header">
                <div className="setting-card-title">
                  <h3>Multi-Factor Authentication (MFA)</h3>
                  <span className={`mfa-status ${mfaEnabled ? 'enabled' : 'disabled'}`}>
                    {mfaEnabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
                <p className="setting-card-description">
                  Add an extra layer of security to your account using an authenticator app
                </p>
              </div>

              <div className="setting-card-action">
                {!mfaEnabled ? (
                  <button
                    className="btn-primary"
                    onClick={setupMfa}
                    disabled={loading}
                  >
                    {loading ? 'Setting up...' : 'Enable MFA'}
                  </button>
                ) : (
                  <button
                    className="btn-danger"
                    onClick={disableMfa}
                    disabled={loading}
                  >
                    {loading ? 'Disabling...' : 'Disable MFA'}
                  </button>
                )}
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
          </div>
        );

      case 'privacy':
        return (
          <div className="settings-content-section">
            <h2>Privacy</h2>
            <p className="section-description">Control who can see your content and interact with you</p>

            <div className="setting-card">
              <div className="setting-card-header">
                <div className="setting-card-title">
                  <h3>Blocked Users</h3>
                  <span className="blocked-count-badge">
                    {blockedUsers.length} {blockedUsers.length === 1 ? 'user' : 'users'}
                  </span>
                </div>
                <p className="setting-card-description">
                  Manage users you have blocked. Blocked users cannot send you messages or interact with your content.
                </p>
              </div>

              {loadingBlockedUsers ? (
                <div className="blocked-users-loading">Loading blocked users...</div>
              ) : blockedUsers.length === 0 ? (
                <div className="blocked-users-empty">
                  <p>You haven't blocked any users yet.</p>
                </div>
              ) : (
                <div className="blocked-users-list">
                  {blockedUsers.map((blockedUser) => (
                    <div key={blockedUser.id} className="blocked-user-item">
                      <div className="blocked-user-info">
                        {blockedUser.profile?.avatar_url ? (
                          <img
                            src={blockedUser.profile.avatar_url}
                            alt={blockedUser.profile.username}
                            className="blocked-user-avatar"
                            onClick={() => navigate(`/profile/${blockedUser.profile.id}`)}
                            style={{ cursor: 'pointer' }}
                          />
                        ) : (
                          <div
                            className="blocked-user-avatar-placeholder"
                            onClick={() => navigate(`/profile/${blockedUser.profile.id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            👤
                          </div>
                        )}
                        <div className="blocked-user-details">
                          <div
                            className="blocked-user-name"
                            onClick={() => navigate(`/profile/${blockedUser.profile.id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            {blockedUser.profile?.full_name || blockedUser.profile?.username || 'Unknown User'}
                          </div>
                          <div className="blocked-user-username">@{blockedUser.profile?.username || 'unknown'}</div>
                        </div>
                      </div>
                      <button
                        className="btn-unblock"
                        onClick={() => handleUnblockUser(blockedUser.id, blockedUser.profile?.username)}
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-content-section">
            <h2>Notifications</h2>
            <p className="section-description">Manage how you receive notifications</p>
            <div className="settings-placeholder">
              <p>Notification settings coming soon...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <Navbar />
      <div className="settings-container">
        {/* Settings Sidebar */}
        <div className="settings-sidebar">
          <div className="sidebar-header">
            <h2>Settings</h2>
          </div>

          <div className="settings-menu">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`settings-menu-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="settings-main">
          {renderContent()}
        </div>
      </div>

      {/* MFA Setup Modal */}
      {showMfaSetup && (
        <div className="mfa-modal-overlay" onClick={() => setShowMfaSetup(false)}>
          <div className="mfa-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowMfaSetup(false)}>✕</button>

            <h2>Setup Multi-Factor Authentication</h2>

            <div className="mfa-steps">
              <div className="mfa-step">
                <span className="step-number">1</span>
                <p>Download an authenticator app like Google Authenticator or Authy</p>
              </div>

              <div className="mfa-step">
                <span className="step-number">2</span>
                <p>Scan this QR code with your authenticator app</p>
                <div className="qr-code-container">
                  <img src={qrCode} alt="MFA QR Code" />
                </div>
              </div>

              <div className="mfa-step">
                <span className="step-number">3</span>
                <p>Enter the 6-digit code from your app</p>
                <input
                  type="text"
                  className="verify-input"
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>

            <button
              className="btn-verify"
              onClick={verifyMfa}
              disabled={loading || verifyCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
