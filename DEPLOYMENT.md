# 🚀 Deployment Guide

## Quick Deployment Checklist

### Prerequisites Setup
- [ ] Create Supabase account and project
- [ ] Get AbuseIPDB API key (free tier)
- [ ] Get IPQualityScore API key (free tier)
- [ ] Setup Gmail app password for alerts
- [ ] Create Railway account
- [ ] Create Vercel account

---

## Step 1: Supabase Setup (5 minutes)

1. **Create Project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and name
   - Set strong database password
   - Select region (closest to users)
   - Wait for provisioning (~2 minutes)

2. **Run Database Migration:**
   - Go to SQL Editor in dashboard
   - Click "New Query"
   - Copy entire content from `supabase/migrations/001_security_tables.sql`
   - Paste and run
   - Verify tables created: security_logs, honeypot_hits, blocked_ips, alert_history

3. **Get Credentials:**
   - Go to Settings → API
   - Copy:
     - Project URL (SUPABASE_URL)
     - anon/public key (VITE_SUPABASE_ANON_KEY)
     - service_role key (SUPABASE_SERVICE_KEY) ⚠️ Keep secret!

---

## Step 2: Get API Keys (10 minutes)

### AbuseIPDB (Free: 1000 checks/day)
1. Sign up at [abuseipdb.com/register](https://www.abuseipdb.com/register)
2. Verify email
3. Go to [abuseipdb.com/account/api](https://www.abuseipdb.com/account/api)
4. Copy API key

### IPQualityScore (Free: 5000 requests/month)
1. Sign up at [ipqualityscore.com/create-account](https://www.ipqualityscore.com/create-account)
2. Verify email
3. Go to Proxy Detection API section
4. Copy API key

### Gmail App Password
1. Enable 2FA on Google account: [myaccount.google.com/security](https://myaccount.google.com/security)
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Other (Custom name)"
4. Name it "Security Monitor"
5. Copy 16-character password

---

## Step 3: Deploy Backend to Railway (5 minutes)

### Option A: Using Railway Dashboard

1. **Connect Repository:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your repositories
   - Select `flywithvvk/monitor` repository

2. **Configure Build:**
   - Railway auto-detects Node.js
   - No additional configuration needed

3. **Add Environment Variables:**
   Click "Variables" tab and add:
   ```
   SUPABASE_URL=<your_supabase_url>
   SUPABASE_SERVICE_KEY=<your_service_key>
   SMTP_EMAIL=<your_gmail>
   SMTP_PASSWORD=<app_password>
   ALERT_EMAIL=<alert_recipient_email>
   ABUSEIPDB_API_KEY=<your_key>
   IPQUALITYSCORE_KEY=<your_key>
   INTERNAL_TOKEN=<generate_random_32_char_string>
   OWNER_KNOWN_IPS=<your_safe_ip_addresses>
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=production
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Copy your Railway URL: `https://your-app.railway.app`

### Option B: Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set SUPABASE_URL=<value>
railway variables set SUPABASE_SERVICE_KEY=<value>
# ... (add all variables)

# Deploy
railway up
```

---

## Step 4: Deploy Frontend to Vercel (5 minutes)

### Option A: Using Vercel Dashboard

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import `flywithvvk/monitor` repository

2. **Configure Build:**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables:**
   ```
   VITE_BACKEND_URL=https://your-app.railway.app
   VITE_SUPABASE_URL=<your_supabase_url>
   VITE_SUPABASE_ANON_KEY=<your_anon_key>
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build
   - Copy Vercel URL: `https://your-app.vercel.app`

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel

# Add environment variables
vercel env add VITE_BACKEND_URL
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

---

## Step 5: Update CORS Configuration (2 minutes)

1. **Go back to Railway:**
   - Open your backend project
   - Go to Variables
   - Update `FRONTEND_URL` to your Vercel URL:
     ```
     FRONTEND_URL=https://your-app.vercel.app
     ```
   - Save and redeploy

2. **Test Connection:**
   - Open your Vercel URL
   - Open browser console (F12)
   - Try logging in
   - Check for CORS errors (should be none)

---

## Step 6: Verify Deployment (5 minutes)

### Backend Health Check
```bash
curl https://your-app.railway.app/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### Frontend Test
1. Open `https://your-app.vercel.app`
2. Should see login page
3. Open browser console (F12)
4. Try logging in with test credentials
5. Check Network tab for API calls
6. Should see POST to `/api/security/log-access`

### Dashboard Test
1. Click "View Security Dashboard"
2. Should connect to Supabase
3. Should show real-time data
4. Try triggering a honeypot: `https://your-app.railway.app/admin`
5. Should receive critical alert email

---

## Step 7: Security Hardening (10 minutes)

### 1. Enable Supabase RLS
- Already configured in migration
- Verify in Supabase → Authentication → Policies

### 2. Add Your Safe IPs
- Update `OWNER_KNOWN_IPS` in Railway
- Add your home/office IPs
- Format: `192.168.1.100,203.0.113.0`

### 3. Test Honeypot System
```bash
# Should trigger critical alert
curl https://your-app.railway.app/admin
curl https://your-app.railway.app/wp-login.php
curl https://your-app.railway.app/.env
```
Check your alert email!

### 4. Configure Alert Thresholds
Edit `backend/utils/threatscore.js` if needed:
- Adjust scoring weights
- Modify alert thresholds
- Customize threat levels

---

## Step 8: Optional Enhancements

### Add Telegram Alerts (Optional)
1. Create Telegram bot: Talk to [@BotFather](https://t.me/botfather)
2. Get bot token
3. Get your chat ID: Talk to [@userinfobot](https://t.me/userinfobot)
4. Add to Railway variables:
   ```
   TELEGRAM_BOT_TOKEN=<bot_token>
   TELEGRAM_CHAT_ID=<your_chat_id>
   ```

### Custom Domain Setup
**Vercel:**
- Go to Project Settings → Domains
- Add your domain
- Configure DNS records

**Railway:**
- Go to Settings → Domains
- Add custom domain
- Configure DNS records

### Enable Auto-Blocking
Edit `backend/routes/security.js` around line 180:
```javascript
// Auto-block if threat score is very high
if (threat_score >= 80) {  // Adjust threshold as needed
  await blockIP(ipAddress, `Auto-blocked: Threat score ${threat_score}`, 'system');
}
```

---

## Troubleshooting

### Backend Issues

**"Cannot connect to Supabase"**
- Verify SUPABASE_URL and SUPABASE_SERVICE_KEY
- Check Supabase project is active
- Test connection in Supabase dashboard

**"Rate limit errors"**
- Default: 20 req/min per IP
- Adjust in `backend/middleware/ratelimit.js`
- Consider IP whitelist

**"Email alerts not sending"**
- Verify Gmail credentials
- Check app password (not regular password)
- Enable "Less secure app access" if needed
- Check spam folder

### Frontend Issues

**"Cannot connect to backend"**
- Verify VITE_BACKEND_URL is correct
- Check CORS configuration
- Verify backend is running
- Check browser console for errors

**"Dashboard not showing data"**
- Verify Supabase credentials
- Check RLS policies are correct
- Verify data exists in tables
- Check browser console for errors

**"Fingerprinting not working"**
- Some browsers block WebRTC
- Canvas may be blocked by extensions
- Check browser permissions
- Test in incognito mode

---

## Monitoring Production

### Daily Checks
- Review critical alerts
- Check backend uptime
- Monitor API rate limits

### Weekly Tasks
- Review security dashboard
- Check for patterns/trends
- Prune blocked IPs if needed

### Monthly Review
- Audit threat score thresholds
- Review honeypot effectiveness
- Check API key usage limits
- Database size monitoring

---

## Cost Breakdown

**Free Tier (Recommended Start):**
- Supabase: Free (500MB database, 2GB storage)
- Railway: $5/month (500 hours, or free trial)
- Vercel: Free (100GB bandwidth)
- AbuseIPDB: Free (1000 checks/day)
- IPQualityScore: Free (5000 checks/month)
- **Total: ~$5/month**

**Scaling Up:**
- Supabase Pro: $25/month (8GB database, 100GB storage)
- Railway Pro: $20/month (unlimited hours)
- Vercel Pro: $20/month (1TB bandwidth)
- AbuseIPDB: $10/month (10,000 checks/day)
- IPQualityScore: $30/month (50,000 checks/month)
- **Total: ~$105/month**

---

## Success Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Database migration successful
- [ ] CORS configured correctly
- [ ] Email alerts working
- [ ] Honeypot traps active
- [ ] Dashboard showing real-time data
- [ ] Test login attempt logged
- [ ] Threat scoring working
- [ ] API keys configured
- [ ] Safe IPs whitelisted
- [ ] Documentation reviewed

---

## Next Steps

1. **Integrate with Your App:**
   - Add LoginPageIntegration to your login page
   - Customize threat thresholds
   - Add custom honeypot routes

2. **Customize Dashboard:**
   - Add charts and visualizations
   - Implement filtering
   - Add export functionality

3. **Enhance Security:**
   - Add Firebase/Auth0 integration
   - Implement IP blocking automation
   - Add more threat intel sources

4. **Monitor and Iterate:**
   - Review logs regularly
   - Adjust scoring algorithm
   - Add new detection patterns

---

**Congratulations! Your E2E Security Monitoring System is now live! 🎉**

For support, refer to README.md and SECURITY.md documentation.
