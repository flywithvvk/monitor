import { useState } from 'react';
import { SecurityDashboard } from './components/SecurityDashboard';
import { LoginPageIntegration } from './components/LoginPageIntegration';

function App() {
  const [view, setView] = useState('login'); // 'login' or 'dashboard'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [error, setError] = useState('');

  // Example login handler
  const handleLogin = async (event, email) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    // This is just a demo - implement your real authentication here
    const password = event.target.querySelector('input[type="password"]')?.value;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate authentication check
    if (email && password) {
      // In real app, verify credentials against your auth system (Firebase, etc.)
      const success = true; // Placeholder

      setIsAuthenticated(success);

      if (success) {
        setTimeout(() => {
          setView('dashboard');
          setIsLoading(false);
        }, 500);
      } else {
        setError('Invalid email or password');
        setIsLoading(false);
      }

      return success;
    }

    setError('Please fill in all fields');
    setIsLoading(false);
    return false;
  };

  return (
    <div className="App">
      {view === 'login' && !isAuthenticated ? (
        <LoginPageIntegration onLoginAttempt={handleLogin}>
          <div style={styles.loginContainer}>
            {/* Animated Background */}
            <div style={styles.backgroundPattern}></div>

            <div style={styles.loginBox}>
              {/* Logo/Icon Section */}
              <div style={styles.logoSection}>
                <div style={styles.logoCircle}>
                  <span style={styles.logoIcon}>🔐</span>
                </div>
                <h1 style={styles.title}>Secure Access</h1>
                <p style={styles.subtitle}>Advanced 4-Layer Security Protection</p>
              </div>

              {/* Security Badge */}
              <div style={styles.securityBadge}>
                <span style={styles.badgeIcon}>✓</span>
                <span style={styles.badgeText}>SSL Encrypted</span>
              </div>

              <form style={styles.form}>
                {/* Email Input */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <span style={styles.labelIcon}>📧</span>
                    Email Address
                  </label>
                  <div style={{
                    ...styles.inputWrapper,
                    ...(focusedInput === 'email' ? styles.inputWrapperFocused : {})
                  }}>
                    <input
                      type="email"
                      style={styles.input}
                      placeholder="your@email.com"
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      required
                    />
                    <span style={styles.inputIcon}>👤</span>
                  </div>
                </div>

                {/* Password Input */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <span style={styles.labelIcon}>🔑</span>
                    Password
                  </label>
                  <div style={{
                    ...styles.inputWrapper,
                    ...(focusedInput === 'password' ? styles.inputWrapperFocused : {})
                  }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={styles.input}
                      placeholder="Enter your password"
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      required
                    />
                    <button
                      type="button"
                      style={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div style={styles.rememberRow}>
                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" style={styles.checkbox} />
                    <span style={styles.checkboxText}>Remember me</span>
                  </label>
                  <a href="#" style={styles.forgotLink}>Forgot password?</a>
                </div>

                {/* Error Message */}
                {error && (
                  <div style={styles.errorBox}>
                    <span style={styles.errorIcon}>⚠️</span>
                    {error}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  style={{
                    ...styles.button,
                    ...(isLoading ? styles.buttonLoading : {})
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span style={styles.spinner}></span>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <span style={styles.buttonIcon}>🚀</span>
                      Sign In Securely
                    </>
                  )}
                </button>
              </form>

              {/* Security Features */}
              <div style={styles.securityInfo}>
                <div style={styles.securityTitle}>
                  <span style={styles.shieldIcon}>🛡️</span>
                  Protected by Advanced Security
                </div>
                <div style={styles.featureGrid}>
                  <div style={styles.feature}>
                    <span style={styles.featureIcon}>🔍</span>
                    <span style={styles.featureText}>Device Fingerprinting</span>
                  </div>
                  <div style={styles.feature}>
                    <span style={styles.featureIcon}>🧠</span>
                    <span style={styles.featureText}>Behavioral Analysis</span>
                  </div>
                  <div style={styles.feature}>
                    <span style={styles.featureIcon}>🌐</span>
                    <span style={styles.featureText}>IP Reputation</span>
                  </div>
                  <div style={styles.feature}>
                    <span style={styles.featureIcon}>⚡</span>
                    <span style={styles.featureText}>Real-time Threat Intel</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Link */}
              <div style={styles.dashboardSection}>
                <div style={styles.divider}>
                  <span style={styles.dividerText}>Admin Access</span>
                </div>
                <button
                  type="button"
                  style={styles.dashboardLink}
                  onClick={() => setView('dashboard')}
                >
                  <span style={styles.dashIcon}>📊</span>
                  View Security Dashboard
                  <span style={styles.arrowIcon}>→</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
              <p style={styles.footerText}>
                🔒 All connections are encrypted • Monitored 24/7
              </p>
            </div>
          </div>
        </LoginPageIntegration>
      ) : (
        <div>
          <div style={styles.navbar}>
            <button
              style={styles.backButton}
              onClick={() => {
                setView('login');
                setIsAuthenticated(false);
              }}
            >
              ← Back to Login
            </button>
          </div>
          <SecurityDashboard />
        </div>
      )}
    </div>
  );
}

const styles = {
  loginContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    overflow: 'hidden'
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.3,
    zIndex: 0
  },
  loginBox: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '48px 40px',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    maxWidth: '480px',
    width: '100%',
    animation: 'slideUp 0.5s ease-out'
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  logoCircle: {
    width: '80px',
    height: '80px',
    margin: '0 auto 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
    animation: 'pulse 2s ease-in-out infinite'
  },
  logoIcon: {
    fontSize: '40px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '8px',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    color: '#718096',
    fontSize: '15px',
    fontWeight: '500'
  },
  securityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#e6fffa',
    border: '1px solid #81e6d9',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#234e52',
    fontWeight: '600',
    marginBottom: '24px'
  },
  badgeIcon: {
    fontSize: '16px',
    color: '#38b2ac'
  },
  badgeText: {
    letterSpacing: '0.5px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748',
    letterSpacing: '0.3px'
  },
  labelIcon: {
    fontSize: '16px'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    backgroundColor: '#f7fafc',
    transition: 'all 0.3s ease',
    overflow: 'hidden'
  },
  inputWrapperFocused: {
    borderColor: '#667eea',
    backgroundColor: 'white',
    boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)'
  },
  input: {
    flex: 1,
    padding: '14px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '15px',
    color: '#2d3748',
    outline: 'none',
    fontWeight: '500'
  },
  inputIcon: {
    padding: '0 16px',
    fontSize: '20px',
    color: '#a0aec0',
    pointerEvents: 'none'
  },
  togglePassword: {
    padding: '0 16px',
    border: 'none',
    background: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#a0aec0',
    transition: 'color 0.2s',
    outline: 'none'
  },
  rememberRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '-8px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#667eea'
  },
  checkboxText: {
    fontSize: '14px',
    color: '#4a5568',
    fontWeight: '500'
  },
  forgotLink: {
    fontSize: '14px',
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s'
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#fff5f5',
    border: '1px solid #fc8181',
    borderRadius: '10px',
    color: '#c53030',
    fontSize: '14px',
    fontWeight: '500',
    animation: 'shake 0.5s ease-in-out'
  },
  errorIcon: {
    fontSize: '20px'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    letterSpacing: '0.5px'
  },
  buttonLoading: {
    background: 'linear-gradient(135deg, #9f7aea 0%, #a78bfa 100%)',
    cursor: 'not-allowed',
    opacity: 0.8
  },
  buttonIcon: {
    fontSize: '18px'
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block'
  },
  securityInfo: {
    marginTop: '32px',
    padding: '24px',
    backgroundColor: '#f7fafc',
    borderRadius: '16px',
    border: '1px solid #e2e8f0'
  },
  securityTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: '16px',
    letterSpacing: '0.3px'
  },
  shieldIcon: {
    fontSize: '20px'
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease'
  },
  featureIcon: {
    fontSize: '20px'
  },
  featureText: {
    fontSize: '13px',
    color: '#4a5568',
    fontWeight: '600'
  },
  dashboardSection: {
    marginTop: '32px'
  },
  divider: {
    textAlign: 'center',
    position: 'relative',
    marginBottom: '20px'
  },
  dividerText: {
    display: 'inline-block',
    padding: '0 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    color: '#718096',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    position: 'relative',
    zIndex: 1
  },
  dashboardLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px',
    backgroundColor: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#667eea',
    transition: 'all 0.3s ease'
  },
  dashIcon: {
    fontSize: '20px'
  },
  arrowIcon: {
    fontSize: '18px',
    marginLeft: 'auto',
    transition: 'transform 0.3s ease'
  },
  footer: {
    position: 'relative',
    zIndex: 1,
    marginTop: '24px',
    textAlign: 'center'
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '13px',
    fontWeight: '500',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
  },
  navbar: {
    backgroundColor: 'white',
    padding: '20px 32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '0',
    borderBottom: '1px solid #e2e8f0'
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
  }
};

export default App;
