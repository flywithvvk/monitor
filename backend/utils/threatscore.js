/**
 * Calculate comprehensive threat score (0-100) based on all available data
 *
 * Scoring breakdown:
 * - VPN detected: +20
 * - Proxy detected: +20
 * - Tor node: +40
 * - AbuseIPDB score > 50: +30
 * - Datacenter IP: +25
 * - Bot behavior: +20
 * - Password pasted + fast submit: +15
 * - Multiple failed attempts: +20
 * - WebRTC IP mismatch: +25
 * - High fraud score: +20
 */
export function calculateThreatScore(data) {
  let score = 0;
  const flags = [];

  // Layer 4: Threat Intelligence
  if (data.is_vpn) {
    score += 20;
    flags.push('VPN detected');
  }

  if (data.is_proxy) {
    score += 20;
    flags.push('Proxy detected');
  }

  if (data.is_tor) {
    score += 40;
    flags.push('Tor network detected');
  }

  if (data.is_datacenter) {
    score += 25;
    flags.push('Datacenter IP (non-residential)');
  }

  // AbuseIPDB score
  if (data.abuse_score && data.abuse_score > 50) {
    score += 30;
    flags.push(`High abuse score: ${data.abuse_score}%`);
  } else if (data.abuse_score && data.abuse_score > 20) {
    score += 15;
    flags.push(`Moderate abuse score: ${data.abuse_score}%`);
  }

  // IPQualityScore fraud score
  if (data.fraud_score && data.fraud_score > 75) {
    score += 20;
    flags.push(`High fraud score: ${data.fraud_score}%`);
  } else if (data.fraud_score && data.fraud_score > 50) {
    score += 10;
    flags.push(`Moderate fraud score: ${data.fraud_score}%`);
  }

  // Bot detection
  if (data.bot_status) {
    score += 20;
    flags.push('Bot detected');
  }

  // Recent abuse
  if (data.recent_abuse) {
    score += 15;
    flags.push('Recent abuse reported');
  }

  // Layer 3: Behavioral Analysis
  if (data.password_pasted && data.time_on_page_seconds < 2) {
    score += 15;
    flags.push('Password pasted + instant submit (likely automated)');
  } else if (data.password_pasted) {
    score += 5;
    flags.push('Password pasted');
  }

  if (data.time_on_page_seconds < 2) {
    score += 10;
    flags.push('Extremely fast page interaction (< 2 seconds)');
  }

  if (data.mouse_moved === false) {
    score += 15;
    flags.push('No mouse movement detected (bot indicator)');
  }

  if (data.typing_speed && data.typing_speed > 20) {
    score += 10;
    flags.push(`Abnormally fast typing: ${data.typing_speed.toFixed(1)} chars/sec`);
  } else if (data.typing_speed && data.typing_speed === 0) {
    score += 15;
    flags.push('Instant form fill (0ms typing time)');
  }

  if (data.failed_attempts_session && data.failed_attempts_session >= 3) {
    score += 20;
    flags.push(`${data.failed_attempts_session} failed attempts in session`);
  } else if (data.failed_attempts_session && data.failed_attempts_session > 0) {
    score += 10;
    flags.push(`${data.failed_attempts_session} failed attempts`);
  }

  // Layer 2: Fingerprinting
  if (data.webrtc_ip_mismatch) {
    score += 25;
    flags.push('WebRTC IP mismatch (VPN bypass detected)');
  }

  if (data.fingerprint_suspicious) {
    score += 15;
    flags.push('Suspicious device fingerprint');
  }

  if (data.canvas_hash_flagged) {
    score += 20;
    flags.push('Device fingerprint matches previously flagged device');
  }

  // Plugins check (headless browser)
  if (data.plugins && Array.isArray(data.plugins) && data.plugins.length === 0) {
    score += 10;
    flags.push('No browser plugins (headless indicator)');
  }

  // Cap at 100
  score = Math.min(score, 100);

  return {
    threat_score: score,
    threat_flags: flags,
    threat_level: getThreatLevel(score)
  };
}

/**
 * Get threat level category
 */
function getThreatLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  if (score >= 20) return 'LOW';
  return 'MINIMAL';
}

/**
 * Determine if an alert should be triggered
 */
export function shouldTriggerAlert(data) {
  // Critical alert conditions
  const criticalConditions = [
    data.threat_score >= 60,
    data.honeypot_hit === true,
    data.is_tor === true,
    data.webrtc_ip_mismatch === true,
    data.canvas_hash_flagged === true,
    data.abuse_score >= 75,
    data.login_status === 'success' && data.is_unknown_ip === true
  ];

  if (criticalConditions.some(condition => condition)) {
    return { trigger: true, level: 'critical' };
  }

  // Warning alert conditions
  const warningConditions = [
    data.threat_score >= 40,
    data.failed_attempts_count >= 3,
    data.is_new_country === true,
    data.is_datacenter === true,
    data.is_vpn === true && data.login_status === 'success'
  ];

  if (warningConditions.some(condition => condition)) {
    return { trigger: true, level: 'warning' };
  }

  return { trigger: false, level: null };
}

/**
 * Check if IP is in known safe list
 */
export function isKnownSafeIP(ipAddress) {
  const knownIPs = process.env.OWNER_KNOWN_IPS?.split(',').map(ip => ip.trim()) || [];
  return knownIPs.includes(ipAddress);
}

export default {
  calculateThreatScore,
  shouldTriggerAlert,
  isKnownSafeIP,
  getThreatLevel
};
