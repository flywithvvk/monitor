import { useState, useEffect } from 'react';

/**
 * Layer 2: Browser Fingerprinting Hook
 * Collects comprehensive device and browser data silently
 */
export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collectFingerprint();
  }, []);

  async function collectFingerprint() {
    try {
      const data = {};

      // Basic browser info
      data.user_agent = navigator.userAgent;
      data.platform = navigator.platform;
      data.language = navigator.language;
      data.languages = navigator.languages;
      data.cookie_enabled = navigator.cookieEnabled;
      data.do_not_track = navigator.doNotTrack;

      // Screen info
      data.screen_resolution = `${screen.width}x${screen.height}`;
      data.pixel_ratio = window.devicePixelRatio;
      data.screen_color_depth = screen.colorDepth;

      // Hardware info
      data.cpu_cores = navigator.hardwareConcurrency || 0;
      data.device_memory = navigator.deviceMemory || 0;
      data.max_touch_points = navigator.maxTouchPoints || 0;

      // Browser detection
      const browserInfo = detectBrowser(navigator.userAgent);
      data.browser = browserInfo.name;
      data.os = browserInfo.os;

      // Plugins
      data.plugins = Array.from(navigator.plugins || []).map(p => p.name);

      // Network info
      if (navigator.connection) {
        data.connection_type = navigator.connection.effectiveType;
        data.connection_speed = navigator.connection.downlink;
        data.connection_rtt = navigator.connection.rtt;
      }

      // Online status
      data.is_online = navigator.onLine;

      // Timezone
      data.timezone_js = Intl.DateTimeFormat().resolvedOptions().timeZone;
      data.timezone_offset = new Date().getTimezoneOffset();
      data.locale = Intl.DateTimeFormat().resolvedOptions().locale;

      // Battery API
      if (navigator.getBattery) {
        try {
          const battery = await navigator.getBattery();
          data.battery_level = battery.level;
          data.battery_charging = battery.charging;
        } catch (e) {
          console.log('Battery API not available');
        }
      }

      // WebRTC IP leak - most powerful feature
      data.webrtc_ips = await collectWebRTCIPs();

      // Canvas fingerprint
      data.canvas_fingerprint = generateCanvasFingerprint();

      // WebGL GPU info
      const gpuInfo = getWebGLInfo();
      data.gpu_vendor = gpuInfo.vendor;
      data.gpu_renderer = gpuInfo.renderer;

      // WebDriver detection (automation)
      data.webdriver = navigator.webdriver || false;

      setFingerprint(data);
      setLoading(false);
    } catch (error) {
      console.error('Error collecting fingerprint:', error);
      setLoading(false);
    }
  }

  return { fingerprint, loading };
}

/**
 * Collect WebRTC IPs (reveals real IP even behind VPN)
 */
async function collectWebRTCIPs() {
  return new Promise((resolve) => {
    const ips = new Set();
    const timeout = setTimeout(() => resolve([...ips]), 2000);

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.createDataChannel('');

      pc.onicecandidate = (e) => {
        if (!e.candidate) return;

        const candidateStr = e.candidate.candidate;
        const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
        const matches = candidateStr.match(ipRegex);

        if (matches) {
          matches.forEach(ip => ips.add(ip));
        }
      };

      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(err => console.log('WebRTC error:', err));

    } catch (error) {
      console.log('WebRTC not available:', error);
      clearTimeout(timeout);
      resolve([]);
    }
  });
}

/**
 * Generate canvas fingerprint (unique per browser+GPU)
 */
function generateCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;

    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser fingerprint 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('Browser fingerprint 🔒', 4, 17);

    return canvas.toDataURL();
  } catch (error) {
    console.log('Canvas fingerprinting error:', error);
    return null;
  }
}

/**
 * Get WebGL GPU information
 */
function getWebGLInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      return { vendor: 'Unknown', renderer: 'Unknown' };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

    if (debugInfo) {
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      };
    }

    return {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER)
    };
  } catch (error) {
    return { vendor: 'Unknown', renderer: 'Unknown' };
  }
}

/**
 * Detect browser and OS from user agent
 */
function detectBrowser(userAgent) {
  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';

  // Browser detection
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { name: browser, os };
}

export default useFingerprint;
