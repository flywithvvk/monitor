# 🔒 Security Monitor - 4-Layer Intrusion Detection System

A comprehensive, production-ready security monitoring system that provides real-time intrusion detection, device fingerprinting, behavioral analysis, and threat intelligence.

## 🎯 Features

### Layer 1: Server-Side Capture (Automatic)
- IP address extraction with proxy chain analysis
- Request header capture (User-Agent, Referer, Accept-Language)
- Geolocation via ip-api.com (country, city, ISP, coordinates)
- Timestamp tracking in IST timezone

### Layer 2: Browser Fingerprinting (JavaScript)
- **WebRTC IP Leak** - Reveals real IP even behind VPN
- **Canvas Fingerprinting** - Unique device signature
- **WebGL GPU Detection** - Hardware identification
- Device specs (screen, CPU cores, memory, touch)
- Browser identity and installed plugins
- Network connection metrics
- Timezone and locale detection
- Battery status

### Layer 3: Behavioral Analysis
- Time on page before submission
- Keystroke dynamics (typing speed, variance)
- Copy-paste detection
- Mouse movement patterns
- Tab switching behavior
- Form autofill detection
- Scroll behavior tracking
- Failed attempt counting

### Layer 4: Threat Intelligence
- **AbuseIPDB** integration - Known abusive IPs
- **IPQualityScore** integration - Fraud detection
- VPN/Proxy/Tor detection
- Datacenter IP identification
- Combined threat scoring (0-100)

### Honeypot System
- Decoy trap routes (`/admin`, `/wp-login.php`, `/api/v1/users`)
- Automatic critical alerts on any access
- Zero false positives - 100% malicious intent confirmation

## 🏗️ Architecture

```
/monitor
├── backend/               # Node.js + Express API
│   ├── server.js         # Main server
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── middleware/       # Rate limiting, auth
│   └── utils/            # Threat scoring
├── frontend/             # React + Vite
│   └── src/
│       ├── hooks/        # Fingerprinting & behavior
│       └── components/   # Dashboard & integration
└── supabase/
    └── migrations/       # Database schema
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier)
- AbuseIPDB API key (free tier)
- IPQualityScore API key (free tier)

### 1. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration:
   ```bash
   cat supabase/migrations/001_security_tables.sql
   ```
3. Copy your project URL and keys

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

**Backend runs on `http://localhost:3000`**

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with backend URL and Supabase keys
npm run dev
```

**Frontend runs on `http://localhost:5173`**

## 🌐 Deployment

### Deploy Backend to Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables from `backend/.env.example`
6. Railway will automatically detect and deploy

**Your backend URL**: `https://your-app.railway.app`

### Deploy Frontend to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. In frontend directory:
   ```bash
   cd frontend
   vercel
   ```
3. Follow prompts
4. Add environment variables:
   ```bash
   vercel env add VITE_BACKEND_URL
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```
5. Deploy: `vercel --prod`

**Your frontend URL**: `https://your-app.vercel.app`

### Update CORS

After deployment, update backend `.env`:
```bash
FRONTEND_URL=https://your-app.vercel.app
```

## 🔧 Configuration

### Required Environment Variables

**Backend** (`backend/.env`):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key (not anon key)
- `SMTP_EMAIL` - Gmail for sending alerts
- `SMTP_PASSWORD` - Gmail app password
- `ALERT_EMAIL` - Email to receive alerts
- `ABUSEIPDB_API_KEY` - From abuseipdb.com
- `IPQUALITYSCORE_KEY` - From ipqualityscore.com
- `INTERNAL_TOKEN` - Random secure string
- `FRONTEND_URL` - Your Vercel URL

**Frontend** (`frontend/.env`):
- `VITE_BACKEND_URL` - Your Railway backend URL
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

### Getting API Keys

**AbuseIPDB** (1000 checks/day free):
1. Sign up at [abuseipdb.com](https://www.abuseipdb.com/register)
2. Go to API section
3. Copy API key

**IPQualityScore** (5000 requests/month free):
1. Sign up at [ipqualityscore.com](https://www.ipqualityscore.com/create-account)
2. Go to Proxy Detection API
3. Copy API key

### Gmail App Password

1. Enable 2FA on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create app password for "Mail"
4. Use this password in `SMTP_PASSWORD`

## 📊 Usage

### Integration with Existing Login Page

**Option 1: Wrapper Component**
```jsx
import { LoginPageIntegration } from './components/LoginPageIntegration';

function YourLoginPage() {
  const handleLogin = async (event, email) => {
    // Your authentication logic
    const success = await authenticateUser(email, password);
    return success; // true/false
  };

  return (
    <LoginPageIntegration onLoginAttempt={handleLogin}>
      <form>
        <input type="email" />
        <input type="password" />
        <button type="submit">Login</button>
      </form>
    </LoginPageIntegration>
  );
}
```

**Option 2: Manual Logging**
```jsx
import { logSecurityEvent } from './components/LoginPageIntegration';

async function handleLogin(email, password) {
  const success = await authenticateUser(email, password);

  // Log the attempt
  await logSecurityEvent(
    success ? 'success' : 'failed',
    email
  );

  return success;
}
```

### Accessing the Dashboard

Navigate to `/dashboard` or use the SecurityDashboard component:
```jsx
import { SecurityDashboard } from './components/SecurityDashboard';

function AdminPage() {
  return <SecurityDashboard />;
}
```

## 🚨 Alert Thresholds

**Critical Alerts** (Immediate):
- threat_score ≥ 60
- Any honeypot trap hit
- Login success from unknown IP
- WebRTC IP mismatch (VPN bypass)
- Canvas hash matches flagged device

**Warning Alerts**:
- threat_score ≥ 40
- 3+ failed attempts in 1 hour
- Login from new country
- Datacenter IP detected

## 🔐 Security Considerations

### Data Privacy
- This system collects extensive user data
- Ensure compliance with GDPR, CCPA, and local privacy laws
- Add privacy policy disclosure to your login page
- Only use on systems you own and operate

### Stealth Operation
- All fingerprinting runs silently (no visible UI)
- Backend logs not accessible to frontend users
- Dashboard only for authenticated owners
- No console logs in production
- Honeypot routes appear legitimate

### Responsible Use
- ✅ Authorized security monitoring
- ✅ Protecting your own infrastructure
- ✅ Defensive security research
- ✅ CTF competitions
- ❌ Unauthorized surveillance
- ❌ Malicious intent
- ❌ Privacy violations

## 📈 Dashboard Features

- **Real-time Updates** - Supabase Realtime subscriptions
- **Threat Visualization** - Color-coded threat levels
- **Interactive Maps** - Google Maps integration
- **Honeypot Monitoring** - Separate tracking for trap hits
- **IP Reputation** - Direct links to AbuseIPDB
- **Device Fingerprints** - Canvas hash gallery
- **Behavioral Metrics** - Bot vs human analysis
- **CSV Export** - Full log export capability

## 🛠️ Troubleshooting

**Backend not starting:**
- Check all environment variables are set
- Verify Supabase credentials
- Check port 3000 is available

**Frontend not connecting:**
- Verify `VITE_BACKEND_URL` is correct
- Check CORS settings in backend
- Verify backend is running

**No alerts received:**
- Check SMTP credentials
- Verify Gmail app password
- Check `ALERT_EMAIL` is set
- Test email manually

**Database errors:**
- Run Supabase migration
- Verify service role key (not anon key)
- Check RLS policies

## 📚 API Endpoints

### POST `/api/security/log-access`
Log security event with full fingerprint and behavior data.

**Request Body:**
```json
{
  "browser": "Chrome",
  "os": "Windows",
  "webrtc_ips": ["203.0.113.0"],
  "canvas_fingerprint": "data:image/png;base64...",
  "time_on_page_seconds": 5.2,
  "typing_speed": 3.5,
  "password_pasted": false,
  "mouse_moved": true,
  "login_status": "success",
  "email_attempted": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "threat_score": 25,
  "threat_level": "LOW",
  "alert_triggered": false
}
```

### Honeypot Routes (Trap System)
- `GET/POST /admin`
- `GET/POST /wp-login.php`
- `GET/POST /api/v1/users`
- `GET /phpMyAdmin`
- `GET /.env`

Accessing these triggers immediate critical alert.

## 🤝 Contributing

This is a security monitoring tool. Use responsibly and only on systems you own.

## 📝 License

MIT License - See LICENSE file for details

## ⚠️ Disclaimer

This tool is for authorized security monitoring only. Users are responsible for:
- Compliance with applicable laws and regulations
- Proper data handling and privacy disclosures
- Authorized use on their own infrastructure
- Ethical and responsible deployment

The authors assume no liability for misuse or unauthorized deployment.

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Review environment variable configuration
3. Verify all services are running
4. Check browser console for errors

## 🎯 Next Steps

1. **Customize Alerts** - Adjust threat score thresholds
2. **Add More Honeypots** - Create additional trap routes
3. **Integrate Auth** - Connect with Firebase/Auth0
4. **Enhance Dashboard** - Add charts and visualizations
5. **Block Automation** - Auto-block high-threat IPs
6. **Expand Intelligence** - Add more threat intel sources

---

Built with ❤️ for security professionals and privacy-conscious developers.
