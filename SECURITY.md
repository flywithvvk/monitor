# Security Documentation

## System Overview

This 4-Layer Intrusion Detection System (IDS) is designed for authorized security monitoring of web applications. It provides comprehensive threat detection through multiple layers of data collection and analysis.

## Detection Layers

### Layer 1: Server-Side Capture
**What it does:**
- Captures IP addresses and proxy chains
- Logs request headers
- Performs geolocation lookups
- Records timestamps

**Privacy Impact:** Low - Standard web server logging
**Detection Capability:** Basic IP tracking and geolocation

### Layer 2: Browser Fingerprinting
**What it does:**
- Collects device hardware specifications
- Generates canvas and WebGL fingerprints
- **WebRTC IP leaking** - Reveals true IP address even when using VPN
- Tracks browser configuration and plugins

**Privacy Impact:** High - Creates unique device signatures
**Detection Capability:** Device recognition, VPN bypass detection

**Key Feature - WebRTC IP Leak:**
WebRTC (Web Real-Time Communication) can expose a user's real IP address even when using a VPN. This is not a vulnerability in VPNs, but a browser feature that can be leveraged for security monitoring. The system creates a temporary peer connection with a STUN server to collect ICE candidates, which reveal local and public IP addresses.

### Layer 3: Behavioral Analysis
**What it does:**
- Monitors typing patterns and speed
- Tracks mouse movement
- Detects copy-paste operations
- Measures time on page
- Identifies form autofill usage

**Privacy Impact:** Medium - Behavioral profiling
**Detection Capability:** Bot detection, automated attack identification

### Layer 4: Threat Intelligence
**What it does:**
- Checks IP against AbuseIPDB (known malicious IPs)
- Queries IPQualityScore for fraud indicators
- Detects VPN, proxy, Tor usage
- Identifies datacenter IPs
- Calculates combined threat score

**Privacy Impact:** Low - Uses public threat databases
**Detection Capability:** Known threat identification, risk assessment

## Honeypot System

### Purpose
Honeypots are decoy routes that legitimate users would never visit. Any access indicates:
- Automated scanning
- Manual intrusion attempts
- Security probing

### Implemented Traps
- `/admin` - Fake admin panel
- `/wp-login.php` - Fake WordPress login
- `/api/v1/users` - Fake API endpoint
- `/phpMyAdmin` - Fake database admin
- `/.env` - Exposed environment file trap
- `/.git/config` - Git repository exposure trap

### Response Strategy
When triggered:
1. Log full Layer 1 data
2. Send critical alert immediately
3. Return convincing fake response (don't reveal it's a trap)
4. Consider auto-blocking IP

**False Positive Rate:** Near zero - legitimate users don't access these paths

## Threat Scoring Algorithm

### Score Calculation (0-100)
```
Base Score = 0

VPN detected: +20
Proxy detected: +20
Tor node: +40
AbuseIPDB score > 50: +30
Datacenter IP: +25
Bot behavior: +20
Password pasted + fast submit: +15
Multiple failed attempts: +20
WebRTC IP mismatch: +25
High fraud score: +20

Total capped at 100
```

### Threat Levels
- **0-19:** MINIMAL - Normal user
- **20-39:** LOW - Minor concerns
- **40-59:** MEDIUM - Suspicious activity
- **60-79:** HIGH - Likely threat
- **80-100:** CRITICAL - Confirmed threat

## Alert System

### Critical Alerts
Sent immediately via email and Telegram when:
- threat_score ≥ 60
- Any honeypot trap accessed
- Login success from unknown IP
- WebRTC reveals different IP than headers (VPN bypass detected)
- Device fingerprint matches previously flagged device
- Tor network detected

### Warning Alerts
Sent when:
- threat_score ≥ 40
- 3+ failed login attempts in 1 hour
- Login from new country
- Datacenter IP detected
- VPN detected on successful login

### Alert Content
- Threat score and breakdown
- IP address and geolocation
- Map link (Google Maps)
- AbuseIPDB report link
- Device information
- WebRTC revealed IPs
- Behavioral flags

## Data Collection and Privacy

### Data Stored
**Identifying Information:**
- IP addresses
- Device fingerprints (canvas hash, GPU info)
- Approximate geolocation (city-level)
- ISP and organization

**Behavioral Data:**
- Typing patterns
- Mouse movements (sampled positions)
- Form interaction timing
- Tab switching behavior

**Technical Data:**
- Browser and OS
- Screen resolution and device specs
- Network connection type
- Timezone and locale

### Data Retention
- Security logs: Recommend 90 days
- Honeypot hits: Recommend 1 year
- Alert history: Recommend 1 year
- Blocked IPs: Until manually removed

### GDPR/CCPA Considerations

**Legal Basis for Processing:**
- Legitimate interest: Security and fraud prevention
- Must be documented and justified
- Data minimization principle applies

**User Rights:**
- Right to access: Provide logs for user's IP
- Right to erasure: Delete logs on request (if legally allowed)
- Right to object: Respect opt-out requests

**Requirements:**
1. Privacy policy must disclose monitoring
2. Cookie consent if legally required
3. Data protection impact assessment (DPIA)
4. Secure data storage and transmission
5. Access controls on dashboard

## Ethical Use Guidelines

### ✅ Authorized Uses
- **Your Own Infrastructure:** Monitoring websites/apps you own
- **With Permission:** Monitoring with explicit authorization
- **Defensive Security:** Protecting against actual threats
- **Research:** Security research in controlled environments
- **Education:** Learning about security monitoring techniques

### ❌ Prohibited Uses
- **Unauthorized Surveillance:** Monitoring without permission
- **Privacy Violations:** Excessive data collection beyond security needs
- **Discrimination:** Using data to discriminate against users
- **Resale:** Selling collected data to third parties
- **Malicious Intent:** Using for hacking or unauthorized access

## Security Best Practices

### Securing the Backend
1. **Strong Authentication:**
   - Use INTERNAL_TOKEN for API authentication
   - Rotate tokens regularly
   - Use secure, random values

2. **Rate Limiting:**
   - Implemented: 20 requests/minute per IP
   - Prevents DoS attacks on logging endpoint
   - Adjust based on legitimate traffic patterns

3. **Input Validation:**
   - Validate all client-supplied data
   - Sanitize before database storage
   - Prevent injection attacks

4. **Secrets Management:**
   - Never commit .env files
   - Use environment variables
   - Rotate API keys periodically

### Securing the Frontend
1. **API Key Protection:**
   - Use anon key (not service key) in frontend
   - Enable Row Level Security (RLS) in Supabase
   - Restrict dashboard access to authenticated users

2. **HTTPS Only:**
   - Always use HTTPS in production
   - Prevents data interception
   - Required for WebRTC and many browser APIs

3. **Content Security Policy:**
   - Helmet.js configured in backend
   - Prevents XSS attacks
   - Restricts resource loading

### Database Security
1. **Row Level Security (RLS):**
   - Implemented in Supabase migration
   - Service role has full access
   - Anon key restricted by policies

2. **Backup Strategy:**
   - Enable Supabase automatic backups
   - Regular manual exports
   - Test restore procedures

3. **Access Control:**
   - Use service key only in backend
   - Never expose service key to frontend
   - Monitor Supabase access logs

## Known Limitations

### WebRTC IP Leak
- May not work in all browsers
- Users can disable WebRTC
- Some VPNs include WebRTC protection
- Returns local IPs on some networks

### Canvas Fingerprinting
- Can be blocked by privacy extensions
- May generate different hashes across browsers
- Not 100% unique, but highly distinctive

### Behavioral Analysis
- Legitimate users may trigger bot indicators
- Accessibility tools may affect patterns
- Mobile users have different behaviors

### IP Geolocation
- Accuracy: City-level at best
- VPN/proxy users show VPN server location
- Mobile users may show carrier location

## Compliance Checklist

- [ ] Privacy policy updated with monitoring disclosure
- [ ] Cookie consent implemented (if required by jurisdiction)
- [ ] Data protection impact assessment (DPIA) completed
- [ ] Data retention policy defined and documented
- [ ] User access request process established
- [ ] Incident response plan created
- [ ] Security audit conducted
- [ ] Team trained on responsible use
- [ ] Legal review completed

## Incident Response

### When High Threat Detected
1. **Verify Alert:** Check dashboard for details
2. **Assess Threat:** Review threat score breakdown
3. **Investigate:** Check if IP is in known safe list
4. **Take Action:**
   - Block IP if confirmed threat
   - Monitor for continued attempts
   - Document in alert system

### When Honeypot Triggered
1. **Immediate Response:** Consider critical threat
2. **Gather Evidence:** Review full log entry
3. **Block IP:** Add to blocklist immediately
4. **Report:** Consider reporting to AbuseIPDB
5. **Monitor:** Watch for additional attempts from same network

### Data Breach Response
1. **Contain:** Immediately revoke exposed credentials
2. **Assess:** Determine scope of exposure
3. **Notify:** Inform affected users if required
4. **Document:** Log all actions taken
5. **Review:** Update security practices

## Maintenance

### Regular Tasks
- **Daily:** Review critical alerts
- **Weekly:** Check dashboard for patterns
- **Monthly:** Review and prune blocked IPs
- **Quarterly:** Audit threat score thresholds
- **Annually:** Security audit and DPIA review

### Monitoring
- Backend uptime and performance
- Database query performance
- Alert delivery success rate
- API key usage limits
- Storage capacity

## Support and Resources

### Threat Intelligence APIs
- [AbuseIPDB Documentation](https://docs.abuseipdb.com/)
- [IPQualityScore Docs](https://www.ipqualityscore.com/documentation/overview)

### Privacy Regulations
- [GDPR Information](https://gdpr.eu/)
- [CCPA Information](https://oag.ca.gov/privacy/ccpa)

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Cheat Sheet](https://cheatsheetseries.owasp.org/)

---

**Remember:** With great monitoring power comes great responsibility. Always prioritize user privacy and use this system ethically and legally.
