import express from 'express';
import { extractIPAddress, getIPGeolocation } from '../services/geoip.js';
import { logHoneypotHit, logAlert } from '../services/supabase.js';
import { sendAlert } from '../services/alerts.js';

const router = express.Router();

/**
 * Honeypot trap handler
 * Any access to these routes indicates malicious intent
 */
async function handleHoneypotHit(req, res, trapPath) {
  try {
    const ipAddress = extractIPAddress(req);
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || '';

    // Get geolocation
    const geoData = await getIPGeolocation(ipAddress);

    // Log honeypot hit
    const hitData = {
      ip_address: ipAddress,
      trap_path: trapPath,
      country: geoData?.country,
      region: geoData?.region,
      city: geoData?.city,
      isp: geoData?.isp,
      org: geoData?.org,
      user_agent: userAgent,
      referrer,
      threat_score: 100, // Honeypot hits are always max threat
      raw_headers: req.headers
    };

    const savedHit = await logHoneypotHit(hitData);

    // Send CRITICAL alert immediately
    const alertData = {
      reason: `HONEYPOT TRAP TRIGGERED: ${trapPath}`,
      threat_score: 100,
      ip_address: ipAddress,
      city: geoData?.city,
      region: geoData?.region,
      country: geoData?.country,
      isp: geoData?.isp,
      org: geoData?.org,
      lat: geoData?.lat,
      lon: geoData?.lon,
      device_type: 'Unknown',
      os: 'Unknown',
      browser: 'Unknown',
      webrtc_ips: [],
      threat_flags: [
        'Honeypot trap accessed',
        `Path: ${trapPath}`,
        'Confirmed malicious intent',
        'Likely automated scanner or manual intrusion attempt'
      ]
    };

    // Send alert (don't wait)
    sendAlert('critical', alertData).then(result => {
      if (result.sent) {
        logAlert('critical', ipAddress, alertData.reason, 100, result.sentVia, null);
      }
    }).catch(err => {
      console.error('Error sending honeypot alert:', err);
    });

    // Return a fake response to keep them guessing
    // Different responses for different traps
    if (trapPath === '/admin') {
      res.status(401).send(`
<!DOCTYPE html>
<html>
<head><title>Admin Login</title></head>
<body>
<h1>Admin Panel</h1>
<form>
  <input type="text" name="username" placeholder="Username">
  <input type="password" name="password" placeholder="Password">
  <button type="submit">Login</button>
</form>
</body>
</html>
      `);
    } else if (trapPath === '/wp-login.php') {
      res.send(`
<!DOCTYPE html>
<html>
<head><title>WordPress &rsaquo; Login</title></head>
<body class="login">
<h1><a href="#">WordPress</a></h1>
<form name="loginform">
  <label>Username<input type="text" name="log" /></label>
  <label>Password<input type="password" name="pwd" /></label>
  <p class="submit"><input type="submit" value="Log In" /></p>
</form>
</body>
</html>
      `);
    } else if (trapPath === '/api/v1/users') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required'
      });
    } else {
      res.status(404).send('Not Found');
    }

  } catch (error) {
    console.error('Error handling honeypot hit:', error);
    res.status(404).send('Not Found');
  }
}

/**
 * Honeypot routes
 */

// Fake admin panel
router.get('/admin', (req, res) => handleHoneypotHit(req, res, '/admin'));
router.post('/admin', (req, res) => handleHoneypotHit(req, res, '/admin'));

// Fake WordPress login
router.get('/wp-login.php', (req, res) => handleHoneypotHit(req, res, '/wp-login.php'));
router.post('/wp-login.php', (req, res) => handleHoneypotHit(req, res, '/wp-login.php'));

// Fake API endpoint
router.get('/api/v1/users', (req, res) => handleHoneypotHit(req, res, '/api/v1/users'));
router.post('/api/v1/users', (req, res) => handleHoneypotHit(req, res, '/api/v1/users'));
router.put('/api/v1/users', (req, res) => handleHoneypotHit(req, res, '/api/v1/users'));
router.delete('/api/v1/users', (req, res) => handleHoneypotHit(req, res, '/api/v1/users'));

// Additional common scanner targets
router.get('/phpMyAdmin', (req, res) => handleHoneypotHit(req, res, '/phpMyAdmin'));
router.get('/phpmyadmin', (req, res) => handleHoneypotHit(req, res, '/phpmyadmin'));
router.get('/.env', (req, res) => handleHoneypotHit(req, res, '/.env'));
router.get('/config.php', (req, res) => handleHoneypotHit(req, res, '/config.php'));
router.get('/.git/config', (req, res) => handleHoneypotHit(req, res, '/.git/config'));

export default router;
