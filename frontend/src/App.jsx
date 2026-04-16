import { useState } from 'react';
import { SecurityDashboard } from './components/SecurityDashboard';
import { LoginPageIntegration } from './components/LoginPageIntegration';

function App() {
  const [view, setView] = useState('login'); // 'login' or 'dashboard'
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Example login handler
  const handleLogin = async (event, email) => {
    event.preventDefault();

    // This is just a demo - implement your real authentication here
    // For now, just simulate login
    const password = event.target.querySelector('input[type="password"]')?.value;

    // Simulate authentication check
    if (email && password) {
      // In real app, verify credentials against your auth system (Firebase, etc.)
      const success = true; // Placeholder

      setIsAuthenticated(success);

      if (success) {
        setView('dashboard');
      }

      return success;
    }

    return false;
  };

  return (
    <div className="App">
      {view === 'login' && !isAuthenticated ? (
        <LoginPageIntegration onLoginAttempt={handleLogin}>
          <div style={styles.loginContainer}>
            <div style={styles.loginBox}>
              <h1 style={styles.title}>🔒 Secure Login</h1>
              <p style={styles.subtitle}>Protected by 4-Layer Intrusion Detection</p>

              <form style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    style={styles.input}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Password</label>
                  <input
                    type="password"
                    style={styles.input}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button type="submit" style={styles.button}>
                  Login
                </button>
              </form>

              <div style={styles.info}>
                <p style={styles.infoText}>
                  ℹ️ This login is monitored by an advanced security system that tracks:
                </p>
                <ul style={styles.infoList}>
                  <li>Device fingerprinting</li>
                  <li>Behavioral analysis</li>
                  <li>IP reputation checks</li>
                  <li>Threat intelligence</li>
                </ul>
              </div>

              <button
                style={styles.dashboardLink}
                onClick={() => setView('dashboard')}
              >
                View Security Dashboard →
              </button>
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '20px'
  },
  loginBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    width: '100%'
  },
  title: {
    textAlign: 'center',
    marginBottom: '10px',
    color: '#111827'
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '30px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151'
  },
  input: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    padding: '12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  info: {
    marginTop: '30px',
    padding: '15px',
    backgroundColor: '#eff6ff',
    borderRadius: '6px',
    border: '1px solid #bfdbfe'
  },
  infoText: {
    fontSize: '12px',
    color: '#1e40af',
    marginBottom: '10px'
  },
  infoList: {
    fontSize: '12px',
    color: '#1e40af',
    paddingLeft: '20px',
    margin: '0'
  },
  dashboardLink: {
    marginTop: '20px',
    width: '100%',
    padding: '10px',
    backgroundColor: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#3b82f6'
  },
  navbar: {
    backgroundColor: 'white',
    padding: '15px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '0'
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default App;
