import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import './Settings.css';

function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkMfaStatus();
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

  return (
    <>
      <Navbar />
      <div className="settings-page">
        <div className="settings-container">
          <div className="settings-header">
            <button className="back-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <h1>⚙️ Settings</h1>
          </div>

          <div className="settings-content">
            <div className="settings-section">
              <h2>🔐 Security</h2>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Multi-Factor Authentication (MFA)</h3>
                  <p>Add an extra layer of security to your account using an authenticator app</p>
                  <span className={`mfa-status ${mfaEnabled ? 'enabled' : 'disabled'}`}>
                    {mfaEnabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>

                <div className="setting-action">
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
          </div>
        </div>

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
    </>
  );
}

export default Settings;
