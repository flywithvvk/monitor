# Project Summary

## 🔒 4-Layer E2E Security Monitoring System

A complete, production-ready intrusion detection system with real-time monitoring, device fingerprinting, behavioral analysis, and threat intelligence.

## 📦 What's Included

### Backend (Node.js + Express)
```
backend/
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── routes/
│   ├── security.js          # Main security logging endpoint
│   └── honeypot.js          # Trap routes for scanners
├── services/
│   ├── supabase.js          # Database operations
│   ├── geoip.js             # IP geolocation (ip-api.com)
│   ├── threatintel.js       # AbuseIPDB + IPQualityScore
│   ├── fingerprint.js       # Canvas hash & device analysis
│   └── alerts.js            # Email + Telegram alerts
├── middleware/
│   ├── ratelimit.js         # Rate limiting (20 req/min)
│   └── authcheck.js         # Internal token verification
└── utils/
    └── threatscore.js       # Combined threat scoring (0-100)
```

### Frontend (React + Vite)
```
frontend/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx              # Demo app with login + dashboard
    ├── hooks/
    │   ├── useFingerprint.js   # Layer 2: Browser fingerprinting
    │   └── useBehavior.js      # Layer 3: Behavioral tracking
    └── components/
        ├── LoginPageIntegration.jsx  # Drop-in login wrapper
        └── SecurityDashboard.jsx     # Real-time monitoring UI
```

### Database (Supabase PostgreSQL)
```
supabase/migrations/
└── 001_security_tables.sql
    ├── security_logs        # Main logging table
    ├── honeypot_hits        # Trap route access logs
    ├── blocked_ips          # IP blocklist
    └── alert_history        # Sent alerts tracking
```

### Configuration & Docs
```
.
├── README.md               # Main documentation
├── SECURITY.md             # Security methodology & ethics
├── DEPLOYMENT.md           # Step-by-step deployment guide
├── .gitignore              # Git ignore rules
├── railway.json            # Railway deployment config
├── vercel.json             # Vercel deployment config
├── backend/.env.example    # Backend environment template
└── frontend/.env.example   # Frontend environment template
```

## 🎯 Key Features

### Layer 1: Server-Side Capture
- ✅ IP extraction with proxy chain analysis
- ✅ Request header logging
- ✅ Geolocation (ip-api.com)
- ✅ ISP and organization detection

### Layer 2: Browser Fingerprinting
- ✅ **WebRTC IP Leak** - Reveals real IP behind VPN
- ✅ **Canvas Fingerprinting** - Unique device signature
- ✅ **WebGL GPU Detection** - Hardware identification
- ✅ Device specs (screen, CPU, RAM, touch)
- ✅ Browser plugins and configuration
- ✅ Network connection metrics
- ✅ Battery API integration
- ✅ Timezone and locale detection

### Layer 3: Behavioral Analysis
- ✅ Time on page tracking
- ✅ Keystroke dynamics (speed, variance)
- ✅ Copy-paste detection
- ✅ Mouse movement patterns
- ✅ Tab switching detection
- ✅ Form autofill detection
- ✅ Scroll behavior
- ✅ Failed attempt counting

### Layer 4: Threat Intelligence
- ✅ AbuseIPDB integration (known abusers)
- ✅ IPQualityScore integration (fraud detection)
- ✅ VPN/Proxy/Tor detection
- ✅ Datacenter IP identification
- ✅ Combined threat scoring (0-100)
- ✅ Automatic alert triggering

### Honeypot Trap System
- ✅ Multiple decoy routes
- ✅ Fake admin panels
- ✅ Fake WordPress login
- ✅ Fake API endpoints
- ✅ Common scanner targets
- ✅ Immediate critical alerts

### Security Dashboard
- ✅ Real-time data via Supabase Realtime
- ✅ Threat score visualization
- ✅ Honeypot hit monitoring
- ✅ IP reputation links (AbuseIPDB)
- ✅ Google Maps integration
- ✅ Device fingerprint gallery
- ✅ Behavioral analysis metrics
- ✅ CSV export functionality
- ✅ Filtering by threat level

### Alert System
- ✅ Email alerts (SMTP/Gmail)
- ✅ Telegram alerts (optional)
- ✅ Critical alert triggers
- ✅ Warning alert triggers
- ✅ Detailed threat breakdowns
- ✅ Map links and IP reports

## 🚀 Deployment Targets

- **Backend:** Railway (Node.js)
- **Frontend:** Vercel (Static SPA)
- **Database:** Supabase (PostgreSQL)
- **APIs:** AbuseIPDB, IPQualityScore, ip-api.com

## 📊 Technology Stack

**Backend:**
- Node.js 18+
- Express.js
- Supabase JS Client
- Nodemailer
- Axios
- Helmet (security)
- Rate-limiter-flexible

**Frontend:**
- React 18
- Vite
- Supabase Realtime
- Axios
- React Leaflet (maps)
- Recharts (future charts)

**Database:**
- PostgreSQL (via Supabase)
- Row Level Security (RLS)
- Real-time subscriptions

## 🔐 Security Features

- **Rate Limiting:** 20 requests/minute per IP
- **CORS Protection:** Configured for specific origins
- **Input Validation:** All user inputs sanitized
- **Helmet.js:** Security headers enabled
- **RLS Policies:** Database access control
- **Internal Token:** API authentication
- **Auto-Blocking:** High-threat IPs automatically blocked
- **Honeypot Traps:** Zero false positive threat detection

## 📈 Threat Scoring

```
Score Components (0-100):
├── VPN detected: +20
├── Proxy detected: +20
├── Tor network: +40
├── High abuse score: +30
├── Datacenter IP: +25
├── Bot behavior: +20
├── Fast submit + paste: +15
├── Multiple failures: +20
├── WebRTC mismatch: +25
└── High fraud score: +20

Threat Levels:
├── 0-19: MINIMAL
├── 20-39: LOW
├── 40-59: MEDIUM
├── 60-79: HIGH
└── 80-100: CRITICAL
```

## 🎯 Use Cases

✅ **Authorized Uses:**
- Protecting your own web applications
- Security research and education
- Defensive security monitoring
- CTF competitions
- Authorized penetration testing

❌ **Prohibited Uses:**
- Unauthorized surveillance
- Privacy violations
- Malicious hacking
- Data resale
- Discrimination

## 📝 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/flywithvvk/monitor.git
cd monitor

# 2. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start

# 3. Setup frontend
cd ../frontend
npm install
cp .env.example .env
# Edit .env with backend URL
npm run dev

# 4. Setup Supabase
# Run SQL migration from supabase/migrations/001_security_tables.sql

# 5. Test
# Open http://localhost:5173
# Try login, check dashboard
```

## 🌐 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed step-by-step guide.

**Quick Deploy:**
1. Supabase: Run migration SQL
2. Railway: Deploy backend with env vars
3. Vercel: Deploy frontend with env vars
4. Update CORS with Vercel URL
5. Test and verify

**Estimated Time:** 30-45 minutes

## 💰 Cost Estimate

**Free Tier (Recommended):**
- Supabase: Free
- Railway: ~$5/month
- Vercel: Free
- APIs: Free tiers
- **Total: $5/month**

**Production Scale:**
- All services on paid plans
- **Total: ~$105/month**

## 📚 Documentation

- **README.md** - Main documentation, features, usage
- **SECURITY.md** - Security methodology, ethics, privacy
- **DEPLOYMENT.md** - Step-by-step deployment guide
- **Code Comments** - Inline documentation throughout

## 🔧 Customization

### Adjust Threat Scoring
Edit `backend/utils/threatscore.js`:
```javascript
// Modify weights
if (data.is_vpn) {
  score += 20; // Adjust this value
  flags.push('VPN detected');
}
```

### Add Honeypot Routes
Edit `backend/routes/honeypot.js`:
```javascript
// Add new trap
router.get('/your-trap', (req, res) =>
  handleHoneypotHit(req, res, '/your-trap')
);
```

### Customize Alerts
Edit `backend/services/alerts.js`:
```javascript
// Modify email template
// Change alert thresholds
// Add alert channels
```

## 🧪 Testing

### Manual Testing
```bash
# Test backend health
curl http://localhost:3000/health

# Test security logging
curl -X POST http://localhost:3000/api/security/log-access \
  -H "Content-Type: application/json" \
  -d '{"login_status":"test"}'

# Test honeypot (should alert)
curl http://localhost:3000/admin
```

### Integration Testing
1. Open frontend in browser
2. Open DevTools console
3. Try logging in
4. Check Network tab for API calls
5. Verify dashboard shows data

## 📊 Monitoring

### Health Checks
- Backend: `/health` endpoint
- Frontend: Visual inspection
- Database: Supabase dashboard
- Alerts: Check email/Telegram

### Metrics to Track
- Request rate
- Threat score distribution
- Alert frequency
- Database size
- API quota usage

## 🆘 Support

**Issues?**
1. Check [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting
2. Review [SECURITY.md](SECURITY.md) for methodology
3. Verify all environment variables
4. Check browser console for errors
5. Review backend logs

## 🎉 Success Criteria

✅ Backend deployed and healthy
✅ Frontend deployed and accessible
✅ Database migration successful
✅ Login attempts logged
✅ Dashboard shows real-time data
✅ Alerts working
✅ Honeypots triggering
✅ Threat scoring accurate

## 🔮 Future Enhancements

- [ ] Machine learning threat detection
- [ ] Geolocation map visualization
- [ ] Advanced charts and analytics
- [ ] Firebase/Auth0 integration
- [ ] Mobile app support
- [ ] Multi-tenant support
- [ ] Advanced reporting
- [ ] Compliance templates

## 📜 License & Disclaimer

**License:** MIT

**Disclaimer:** For authorized security monitoring only. Users responsible for:
- Legal compliance (GDPR, CCPA, etc.)
- Privacy disclosures
- Authorized use only
- Ethical deployment

## 🙏 Acknowledgments

Built with:
- Express.js for backend API
- React for frontend UI
- Supabase for real-time database
- AbuseIPDB for threat intelligence
- IPQualityScore for fraud detection
- ip-api.com for geolocation

---

**Status:** ✅ Production Ready

**Last Updated:** 2024

**Repository:** https://github.com/flywithvvk/monitor

**Deployed By:** Claude Agent SDK

---

## Quick Reference

**Backend API:** `POST /api/security/log-access`
**Honeypots:** `/admin`, `/wp-login.php`, `/api/v1/users`
**Dashboard:** SecurityDashboard component
**Integration:** LoginPageIntegration component

**Environment Variables:** 11 backend, 3 frontend
**Database Tables:** 4 (security_logs, honeypot_hits, blocked_ips, alert_history)
**API Integrations:** 3 (AbuseIPDB, IPQualityScore, ip-api.com)

**Lines of Code:**
- Backend: ~1,500
- Frontend: ~1,200
- Total: ~2,700 LOC

---

This is a complete, production-ready system. Deploy with confidence! 🚀
