import { useState, useEffect } from 'react';
import { useFingerprint } from '../hooks/useFingerprint';
import { useBehavior } from '../hooks/useBehavior';
import axios from 'axios';

/**
 * LoginPageIntegration Component
 * Drop-in component that wraps login forms and sends security data
 * Usage: Wrap your login form with this component
 */
export function LoginPageIntegration({ children, onLoginAttempt }) {
  const { fingerprint, loading: fingerprintLoading } = useFingerprint();
  const { trackKeystroke, trackPaste, getBehaviorData } = useBehavior();

  const [passwordPasted, setPasswordPasted] = useState(false);
  const [autofillDetected, setAutofillDetected] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Detect autofill after page load
  useEffect(() => {
    const timer = setTimeout(() => {
      const inputs = document.querySelectorAll('input[type="password"], input[type="email"], input[type="text"]');
      inputs.forEach(input => {
        if (input.value && input.value.length > 0) {
          setAutofillDetected(true);
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Send security data to backend
   */
  const sendSecurityData = async (loginStatus, emailAttempted = '') => {
    if (fingerprintLoading || !fingerprint) {
      console.log('Fingerprint not ready yet');
      return;
    }

    const behaviorData = getBehaviorData(passwordPasted, autofillDetected);

    const payload = {
      // Layer 2: Fingerprint
      ...fingerprint,

      // Layer 3: Behavior
      ...behaviorData,
      failed_attempts_session: failedAttempts,

      // Login attempt data
      login_status: loginStatus,
      email_attempted: emailAttempted
    };

    try {
      const response = await axios.post(`${backendUrl}/api/security/log-access`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Security data logged:', response.data);

      // Update failed attempts counter
      if (loginStatus === 'failed') {
        setFailedAttempts(prev => prev + 1);
      } else if (loginStatus === 'success') {
        setFailedAttempts(0);
      }

      return response.data;
    } catch (error) {
      console.error('Error logging security data:', error);
      return null;
    }
  };

  /**
   * Enhanced form submission handler
   */
  const handleFormSubmit = async (event, email = '') => {
    // Don't prevent default - let parent handle actual login
    // Just log the attempt asynchronously

    // Call parent's onLoginAttempt if provided
    if (onLoginAttempt) {
      const result = await onLoginAttempt(event, email);

      // Log based on parent's result
      const status = result === true ? 'success' : 'failed';
      await sendSecurityData(status, email);

      return result;
    }

    // If no parent handler, just log the attempt
    await sendSecurityData('attempted', email);
  };

  /**
   * Attach event listeners to form inputs
   */
  useEffect(() => {
    // Find password inputs
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    passwordInputs.forEach(input => {
      // Track keystrokes
      input.addEventListener('keydown', trackKeystroke);

      // Track paste
      input.addEventListener('paste', () => setPasswordPasted(true));
    });

    // Find forms and attach submit handler
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        const emailInput = form.querySelector('input[type="email"], input[type="text"]');
        const email = emailInput ? emailInput.value : '';
        handleFormSubmit(e, email);
      });
    });

    return () => {
      passwordInputs.forEach(input => {
        input.removeEventListener('keydown', trackKeystroke);
        input.removeEventListener('paste', () => setPasswordPasted(true));
      });
    };
  }, [fingerprint, fingerprintLoading]);

  // Render children normally - this component is invisible
  return <>{children}</>;
}

/**
 * Standalone function to manually log security event
 * Use this if you're not using the wrapper component
 */
export async function logSecurityEvent(loginStatus, emailAttempted, customData = {}) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  try {
    const response = await axios.post(`${backendUrl}/api/security/log-access`, {
      login_status: loginStatus,
      email_attempted: emailAttempted,
      ...customData
    });

    return response.data;
  } catch (error) {
    console.error('Error logging security event:', error);
    return null;
  }
}

export default LoginPageIntegration;
