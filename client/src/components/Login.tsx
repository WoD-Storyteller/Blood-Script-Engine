import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SessionInfo } from '../types';
import {
  loginAccount,
  registerAccount,
  requestPasswordReset,
  resetPassword,
} from '../api';

interface LoginProps {
  onLogin: (payload: { token: string; user: SessionInfo }) => void | Promise<void>;
}

type Mode = 'login' | 'register' | 'forgot' | 'reset';

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(15, 15, 35, 0.9)',
  color: '#fff',
  fontSize: 14,
};

const buttonStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(to right, #c41e3a, #8b0000)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordMismatch =
    (mode === 'register' || mode === 'reset') &&
    confirmPassword &&
    password !== confirmPassword;

  const modeTitle = useMemo(() => {
    switch (mode) {
      case 'register':
        return 'Create your account';
      case 'forgot':
        return 'Forgot your password?';
      case 'reset':
        return 'Reset your password';
      default:
        return 'Sign in to Companion';
    }
  }, [mode]);

  const resetFeedback = () => {
    setStatus(null);
    setError(null);
    setNeedsTwoFactor(false);
    setTwoFactorCode('');
    setRecoveryCode('');
  };

  const handleLogin = async () => {
    setSubmitting(true);
    resetFeedback();

    try {
      const result = await loginAccount({
        email,
        password,
        twoFactorCode: twoFactorCode || undefined,
        recoveryCode: recoveryCode || undefined,
      });

      if (!result.ok) {
        if (result.error === 'TwoFactorRequired') {
          setNeedsTwoFactor(true);
          setError('Two-factor authentication is required.');
          return;
        }
        setError(mapError(result.error ?? 'LoginFailed'));
        return;
      }

      if (!result.token || !result.user) {
        setError('Login failed. Please try again.');
        return;
      }

      await onLogin({ token: result.token, user: result.user });
    } catch (err) {
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setSubmitting(true);
    resetFeedback();

    if (passwordMismatch) {
      setError('Passwords do not match.');
      setSubmitting(false);
      return;
    }

    try {
      const result = await registerAccount(email, password);
      if (!result.ok) {
        setError(mapError(result.error ?? 'RegistrationFailed'));
        return;
      }
      setStatus('Account created. You can now sign in.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Unable to create your account right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    setSubmitting(true);
    resetFeedback();

    try {
      const result = await requestPasswordReset(email);
      if (!result.ok) {
        setError(mapError(result.error ?? 'ResetFailed'));
        return;
      }
      setStatus(
        'If an account exists, a reset token has been issued. Check your email and enter the token below.',
      );
      setMode('reset');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Unable to start reset right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    setSubmitting(true);
    resetFeedback();

    if (passwordMismatch) {
      setError('Passwords do not match.');
      setSubmitting(false);
      return;
    }

    try {
      const result = await resetPassword(resetToken, password);
      if (!result.ok) {
        setError(mapError(result.error ?? 'ResetFailed'));
        return;
      }
      setStatus('Password updated. Please sign in with your new password.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setResetToken('');
    } catch (err) {
      setError('Unable to reset password right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const mapError = (code: string) => {
    switch (code) {
      case 'MissingCredentials':
        return 'Enter your email and password.';
      case 'MissingEmail':
        return 'Enter your email address.';
      case 'InvalidEmail':
        return 'Enter a valid email address.';
      case 'EmailInUse':
        return 'That email is already registered.';
      case 'PasswordTooShort':
        return 'Password must be at least 12 characters.';
      case 'PasswordNeedsUppercase':
        return 'Password must include an uppercase letter.';
      case 'PasswordNeedsLowercase':
        return 'Password must include a lowercase letter.';
      case 'PasswordNeedsNumber':
        return 'Password must include a number.';
      case 'PasswordNeedsSymbol':
        return 'Password must include a symbol.';
      case 'InvalidCredentials':
        return 'Invalid email or password.';
      case 'InvalidTwoFactorCode':
        return 'Invalid two-factor or recovery code.';
      case 'AccountLocked':
        return 'Account locked due to too many failed attempts. Try again later.';
      case 'NoEngine':
        return 'No active engine membership found for this account.';
      case 'InvalidToken':
        return 'That reset token is invalid.';
      case 'TokenExpired':
        return 'That reset token has expired.';
      case 'TokenUsed':
        return 'That reset token has already been used.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        color: '#fff',
        padding: 24,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: 420,
          width: '100%',
          background: 'rgba(8, 8, 20, 0.65)',
          borderRadius: 16,
          padding: 28,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
        }}
      >
        <h1
          style={{
            fontSize: 32,
            marginBottom: 8,
            background: 'linear-gradient(to right, #c41e3a, #8b0000)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Blood Script
        </h1>
        <p
          style={{
            fontSize: 14,
            opacity: 0.7,
            marginBottom: 12,
            letterSpacing: 2,
          }}
        >
          COMPANION
        </p>
        <p
          style={{
            fontSize: 14,
            opacity: 0.85,
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          {modeTitle}
        </p>

        {status && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(88, 101, 242, 0.15)',
              border: '1px solid rgba(88, 101, 242, 0.4)',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {status}
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(196, 30, 58, 0.15)',
              border: '1px solid rgba(196, 30, 58, 0.45)',
              color: '#ffcad4',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <input
              style={inputStyle}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setNeedsTwoFactor(false);
              }}
            />
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <input
              style={inputStyle}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setNeedsTwoFactor(false);
              }}
            />
          )}

          {(mode === 'register' || mode === 'reset') && (
            <input
              style={inputStyle}
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          )}

          {mode === 'reset' && (
            <input
              style={inputStyle}
              type="text"
              placeholder="Reset token"
              value={resetToken}
              onChange={(event) => setResetToken(event.target.value)}
            />
          )}

          {needsTwoFactor && mode === 'login' && (
            <>
              <input
                style={inputStyle}
                type="text"
                placeholder="Authenticator code"
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value)}
              />
              <input
                style={inputStyle}
                type="text"
                placeholder="Recovery code (optional)"
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value)}
              />
            </>
          )}
        </div>

        {passwordMismatch && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#ffcad4' }}>
            Passwords do not match.
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          {mode === 'login' && (
            <button
              style={buttonStyle}
              onClick={handleLogin}
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          )}

          {mode === 'register' && (
            <button
              style={buttonStyle}
              onClick={handleRegister}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          )}

          {mode === 'forgot' && (
            <button
              style={buttonStyle}
              onClick={handleForgot}
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send Reset Email'}
            </button>
          )}

          {mode === 'reset' && (
            <button
              style={buttonStyle}
              onClick={handleReset}
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          )}
        </div>

        <div
          style={{
            marginTop: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: 12,
            opacity: 0.75,
          }}
        >
          {mode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => {
                  resetFeedback();
                  setMode('forgot');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFeedback();
                  setMode('register');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Create an account
              </button>
            </>
          )}

          {mode !== 'login' && (
            <button
              type="button"
              onClick={() => {
                resetFeedback();
                setMode('login');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Back to sign in
            </button>
          )}
        </div>

        <p
          style={{
            fontSize: 12,
            opacity: 0.55,
            marginTop: 18,
            lineHeight: 1.4,
          }}
        >
          Link Discord after signing in by DMing the bot with <strong>!linkaccount</strong>.
        </p>
      </div>
    </div>
  );
}
