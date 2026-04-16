import crypto from 'crypto';

/**
 * Hash canvas fingerprint for storage and comparison
 */
export function hashCanvasFingerprint(canvasDataURL) {
  if (!canvasDataURL) return null;

  return crypto
    .createHash('sha256')
    .update(canvasDataURL)
    .digest('hex');
}

/**
 * Analyze device fingerprint for uniqueness and suspicion
 */
export function analyzeFingerprint(fingerprintData) {
  const suspicionFlags = [];
  let suspicionScore = 0;

  // Check for headless browser indicators
  if (fingerprintData.plugins && fingerprintData.plugins.length === 0) {
    suspicionFlags.push('No browser plugins (headless indicator)');
    suspicionScore += 15;
  }

  // Check for automated browser
  if (fingerprintData.webdriver === true) {
    suspicionFlags.push('WebDriver detected (automation)');
    suspicionScore += 30;
  }

  // Check for missing platform
  if (!fingerprintData.platform || fingerprintData.platform === 'Unknown') {
    suspicionFlags.push('Unknown platform');
    suspicionScore += 10;
  }

  // Check for suspicious screen resolution
  if (fingerprintData.screen_resolution === '0x0' || !fingerprintData.screen_resolution) {
    suspicionFlags.push('Invalid screen resolution');
    suspicionScore += 20;
  }

  // Check for disabled cookies
  if (fingerprintData.cookie_enabled === false) {
    suspicionFlags.push('Cookies disabled');
    suspicionScore += 5;
  }

  // Check for extreme hardware values
  if (fingerprintData.cpu_cores && fingerprintData.cpu_cores > 32) {
    suspicionFlags.push('Unusually high CPU core count');
    suspicionScore += 5;
  }

  // Check for missing GPU info
  if (!fingerprintData.gpu_vendor && !fingerprintData.gpu_renderer) {
    suspicionFlags.push('Missing GPU information');
    suspicionScore += 10;
  }

  // Check for bot-like user agent
  const botUserAgents = ['bot', 'crawler', 'spider', 'scraper', 'headless'];
  const userAgent = (fingerprintData.user_agent || '').toLowerCase();
  if (botUserAgents.some(bot => userAgent.includes(bot))) {
    suspicionFlags.push('Bot-like user agent');
    suspicionScore += 25;
  }

  return {
    suspicionScore: Math.min(suspicionScore, 100),
    suspicionFlags,
    isLikelyBot: suspicionScore > 40
  };
}

/**
 * Compare WebRTC IPs with header IP to detect VPN bypass
 */
export function compareWebRTCIPs(headerIP, webrtcIPs) {
  if (!webrtcIPs || webrtcIPs.length === 0) {
    return {
      mismatch: false,
      reason: 'No WebRTC IPs collected'
    };
  }

  // Filter out local IPs
  const publicWebRTCIPs = webrtcIPs.filter(ip => !isLocalIP(ip));

  if (publicWebRTCIPs.length === 0) {
    return {
      mismatch: false,
      reason: 'Only local IPs detected via WebRTC'
    };
  }

  // Check if header IP matches any WebRTC IP
  const headerIPClean = headerIP.replace(/^::ffff:/, ''); // Remove IPv6 prefix
  const matches = publicWebRTCIPs.some(ip => ip === headerIPClean);

  if (!matches) {
    return {
      mismatch: true,
      reason: `Header IP (${headerIPClean}) does not match WebRTC IPs (${publicWebRTCIPs.join(', ')})`,
      suspicionLevel: 'HIGH',
      likelyVPN: true
    };
  }

  return {
    mismatch: false,
    reason: 'IPs match - consistent connection'
  };
}

/**
 * Check if IP is a local/private IP
 */
function isLocalIP(ip) {
  if (!ip) return true;

  // IPv6 local
  if (ip.startsWith('fe80:') || ip === '::1') return true;

  // IPv4 local
  if (ip.startsWith('127.') || ip.startsWith('10.') ||
      ip.startsWith('192.168.') || ip === 'localhost') return true;

  // 172.16.0.0 - 172.31.255.255
  const match = ip.match(/^172\.(\d+)\./);
  if (match && parseInt(match[1]) >= 16 && parseInt(match[1]) <= 31) return true;

  return false;
}

/**
 * Generate device fingerprint summary
 */
export function generateFingerprintSummary(fingerprintData) {
  return {
    device: `${fingerprintData.os || 'Unknown'} / ${fingerprintData.browser || 'Unknown'}`,
    screen: fingerprintData.screen_resolution || 'Unknown',
    hardware: `${fingerprintData.cpu_cores || '?'} cores, ${fingerprintData.device_memory || '?'} GB RAM`,
    gpu: `${fingerprintData.gpu_vendor || 'Unknown'} ${fingerprintData.gpu_renderer || ''}`.trim(),
    connection: fingerprintData.connection_type || 'Unknown',
    timezone: fingerprintData.timezone_js || 'Unknown',
    canvasHash: fingerprintData.canvas_hash ? fingerprintData.canvas_hash.substring(0, 16) + '...' : 'None'
  };
}

export default {
  hashCanvasFingerprint,
  analyzeFingerprint,
  compareWebRTCIPs,
  generateFingerprintSummary
};
