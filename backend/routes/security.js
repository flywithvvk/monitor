import express from 'express';
import { extractIPAddress, extractIPChain, getIPGeolocation } from '../services/geoip.js';
import { performThreatIntelligence } from '../services/threatintel.js';
import { hashCanvasFingerprint, analyzeFingerprint, compareWebRTCIPs } from '../services/fingerprint.js';
import { calculateThreatScore, shouldTriggerAlert, isKnownSafeIP } from '../utils/threatscore.js';
import { logSecurityEvent, isIPBlocked, blockIP, logAlert, findDuplicateCanvasHash, getFailedAttemptsCount } from '../services/supabase.js';
import { sendAlert } from '../services/alerts.js';

const router = express.Router();

/**
 * POST /api/security/log-access
 * Main endpoint for logging security events
 */
router.post('/log-access', async (req, res) => {
  try {
    const startTime = Date.now();

    // Extract Layer 1 data (server-side)
    const ipAddress = extractIPAddress(req);
    const ipChain = extractIPChain(req);
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';

    // Check if IP is blocked
    const blocked = await isIPBlocked(ipAddress);
    if (blocked) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'Your IP address has been blocked'
      });
    }

    // Get Layer 2 & 3 data from request body (collected by frontend)
    const {
      // Layer 2: Browser fingerprinting
      browser,
      os,
      platform,
      screen_resolution,
      pixel_ratio,
      cpu_cores,
      device_memory,
      max_touch_points,
      gpu_vendor,
      gpu_renderer,
      canvas_fingerprint,
      battery_level,
      battery_charging,
      connection_type,
      connection_speed,
      connection_rtt,
      webrtc_ips,
      timezone_js,
      timezone_offset,
      locale,
      plugins,
      cookie_enabled,
      do_not_track,

      // Layer 3: Behavioral data
      time_on_page_seconds,
      typing_speed,
      typing_variance,
      password_pasted,
      mouse_moved,
      mouse_straightness,
      mouse_samples,
      tab_switch_count,
      autofill_detected,
      scroll_detected,
      failed_attempts_session,

      // Login attempt data
      login_status,
      email_attempted
    } = req.body;

    // Layer 1: Get geolocation data
    const geoData = await getIPGeolocation(ipAddress);

    // Layer 4: Threat intelligence
    const threatData = await performThreatIntelligence(ipAddress, geoData);

    // Process canvas fingerprint
    const canvasHash = canvas_fingerprint ? hashCanvasFingerprint(canvas_fingerprint) : null;

    // Check for duplicate canvas hash (device recognition)
    let canvasHashFlagged = false;
    if (canvasHash) {
      const duplicates = await findDuplicateCanvasHash(canvasHash);
      if (duplicates && duplicates.length > 0) {
        // Found this device before
        const previousHighThreat = duplicates.some(log => log.threat_score >= 60);
        if (previousHighThreat) {
          canvasHashFlagged = true;
        }
      }
    }

    // Analyze fingerprint for bot indicators
    const fingerprintAnalysis = analyzeFingerprint({
      plugins,
      platform,
      screen_resolution,
      cookie_enabled,
      cpu_cores,
      gpu_vendor,
      gpu_renderer,
      user_agent: userAgent
    });

    // Compare WebRTC IPs with header IP
    const webrtcComparison = compareWebRTCIPs(ipAddress, webrtc_ips);

    // Get failed attempts count from database
    const failedAttemptsCount = await getFailedAttemptsCount(ipAddress, 1);

    // Determine device type
    const device_type = determineDeviceType(userAgent, max_touch_points);

    // Check if this is a new/unknown IP
    const isUnknownIP = !isKnownSafeIP(ipAddress);

    // Calculate comprehensive threat score
    const scoringData = {
      is_vpn: threatData.combined.is_vpn,
      is_proxy: threatData.combined.is_proxy,
      is_tor: threatData.combined.is_tor,
      is_datacenter: threatData.combined.is_datacenter,
      abuse_score: threatData.combined.abuse_score,
      fraud_score: threatData.combined.fraud_score,
      bot_status: threatData.combined.bot_status || fingerprintAnalysis.isLikelyBot,
      recent_abuse: threatData.combined.recent_abuse,
      password_pasted,
      time_on_page_seconds,
      mouse_moved,
      typing_speed,
      failed_attempts_session,
      webrtc_ip_mismatch: webrtcComparison.mismatch,
      fingerprint_suspicious: fingerprintAnalysis.isLikelyBot,
      canvas_hash_flagged: canvasHashFlagged,
      plugins,
      login_status,
      is_unknown_ip: isUnknownIP,
      failed_attempts_count: failedAttemptsCount
    };

    const { threat_score, threat_flags, threat_level } = calculateThreatScore(scoringData);

    // Prepare security log entry
    const logEntry = {
      // Layer 1
      ip_address: ipAddress,
      ip_chain: ipChain,
      country: geoData?.country,
      region: geoData?.region,
      city: geoData?.city,
      zip: geoData?.zip,
      lat: geoData?.lat,
      lon: geoData?.lon,
      timezone: geoData?.timezone,
      isp: geoData?.isp,
      org: geoData?.org,
      asn: geoData?.asn,
      is_proxy: geoData?.is_proxy || threatData.combined.is_proxy,
      is_mobile: geoData?.is_mobile,

      // Layer 2
      browser,
      os,
      device_type,
      screen_resolution,
      pixel_ratio,
      cpu_cores,
      device_memory,
      max_touch_points,
      gpu_vendor,
      gpu_renderer,
      canvas_hash: canvasHash,
      battery_level,
      battery_charging,
      connection_type,
      connection_speed,
      connection_rtt,
      webrtc_ips,
      timezone_js,
      timezone_offset,
      locale,
      plugins,
      cookie_enabled,
      do_not_track,

      // Layer 3
      time_on_page_seconds,
      typing_speed,
      typing_variance,
      password_pasted,
      mouse_moved,
      mouse_straightness,
      mouse_samples,
      tab_switch_count,
      autofill_detected,
      scroll_detected,
      failed_attempts_session,

      // Login status
      login_status,
      email_attempted,

      // Layer 4
      abuse_score: threatData.combined.abuse_score,
      fraud_score: threatData.combined.fraud_score,
      is_vpn: threatData.combined.is_vpn,
      is_tor: threatData.combined.is_tor,
      is_datacenter: threatData.combined.is_datacenter,
      bot_status: threatData.combined.bot_status || fingerprintAnalysis.isLikelyBot,
      recent_abuse: threatData.combined.recent_abuse,
      threat_score,

      // Raw data
      referrer,
      user_agent: userAgent,
      raw_headers: {
        'accept-language': acceptLanguage,
        'user-agent': userAgent,
        'referer': referrer,
        ...req.headers
      }
    };

    // Save to database
    const savedLog = await logSecurityEvent(logEntry);

    // Check if alert should be triggered
    const alertCheck = shouldTriggerAlert({
      ...scoringData,
      threat_score,
      honeypot_hit: false
    });

    if (alertCheck.trigger) {
      const alertData = {
        reason: threat_flags.join(', ') || 'High threat score detected',
        threat_score,
        ip_address: ipAddress,
        city: geoData?.city,
        region: geoData?.region,
        country: geoData?.country,
        isp: geoData?.isp,
        org: geoData?.org,
        lat: geoData?.lat,
        lon: geoData?.lon,
        device_type,
        os,
        browser,
        webrtc_ips,
        threat_flags
      };

      // Send alert (async - don't wait)
      sendAlert(alertCheck.level, alertData).then(result => {
        if (result.sent) {
          logAlert(alertCheck.level, ipAddress, alertData.reason, threat_score, result.sentVia, savedLog.id);
        }
      }).catch(err => {
        console.error('Error sending alert:', err);
      });
    }

    // Auto-block if threat score is very high
    if (threat_score >= 80 && login_status === 'failed') {
      await blockIP(ipAddress, `Auto-blocked: Threat score ${threat_score}`, 'system');
    }

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      logged: true,
      threat_score,
      threat_level,
      processing_time_ms: processingTime,
      alert_triggered: alertCheck.trigger
    });

  } catch (error) {
    console.error('Error logging security event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to log security event'
    });
  }
});

/**
 * Determine device type from user agent and touch points
 */
function determineDeviceType(userAgent, maxTouchPoints) {
  const ua = userAgent.toLowerCase();

  if (maxTouchPoints > 0 && (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone'))) {
    return 'mobile';
  }

  if (maxTouchPoints > 0 && (ua.includes('tablet') || ua.includes('ipad'))) {
    return 'tablet';
  }

  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }

  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }

  return 'desktop';
}

export default router;
