-- Security Logs Table (Main logging table for all access attempts)
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Layer 1: Server-side capture
  ip_address TEXT NOT NULL,
  ip_chain TEXT[],
  country TEXT,
  region TEXT,
  city TEXT,
  zip TEXT,
  lat FLOAT,
  lon FLOAT,
  timezone TEXT,
  isp TEXT,
  org TEXT,
  asn TEXT,
  is_proxy BOOLEAN DEFAULT FALSE,
  is_mobile BOOLEAN DEFAULT FALSE,

  -- Layer 2: Browser fingerprinting
  browser TEXT,
  os TEXT,
  device_type TEXT,
  screen_resolution TEXT,
  pixel_ratio FLOAT,
  cpu_cores INTEGER,
  device_memory FLOAT,
  max_touch_points INTEGER,
  gpu_vendor TEXT,
  gpu_renderer TEXT,
  canvas_hash TEXT,
  battery_level FLOAT,
  battery_charging BOOLEAN,
  connection_type TEXT,
  connection_speed FLOAT,
  connection_rtt INTEGER,
  webrtc_ips TEXT[],
  timezone_js TEXT,
  timezone_offset INTEGER,
  locale TEXT,
  plugins TEXT[],
  cookie_enabled BOOLEAN,
  do_not_track TEXT,

  -- Layer 3: Behavioral analysis
  time_on_page_seconds FLOAT,
  typing_speed FLOAT,
  typing_variance FLOAT,
  password_pasted BOOLEAN DEFAULT FALSE,
  mouse_moved BOOLEAN DEFAULT FALSE,
  mouse_straightness FLOAT,
  mouse_samples JSONB,
  tab_switch_count INTEGER DEFAULT 0,
  autofill_detected BOOLEAN DEFAULT FALSE,
  scroll_detected BOOLEAN DEFAULT FALSE,
  failed_attempts_session INTEGER DEFAULT 0,

  -- Login status
  login_status TEXT, -- 'success', 'failed', 'blocked'
  email_attempted TEXT,

  -- Layer 4: Threat intelligence
  abuse_score INTEGER DEFAULT 0,
  fraud_score INTEGER DEFAULT 0,
  is_vpn BOOLEAN DEFAULT FALSE,
  is_tor BOOLEAN DEFAULT FALSE,
  is_datacenter BOOLEAN DEFAULT FALSE,
  bot_status BOOLEAN DEFAULT FALSE,
  recent_abuse BOOLEAN DEFAULT FALSE,
  threat_score INTEGER DEFAULT 0,

  -- Raw data
  referrer TEXT,
  user_agent TEXT,
  raw_headers JSONB,

  -- Indexes for performance
  CONSTRAINT valid_threat_score CHECK (threat_score >= 0 AND threat_score <= 100)
);

CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX idx_security_logs_threat_score ON security_logs(threat_score DESC);
CREATE INDEX idx_security_logs_login_status ON security_logs(login_status);
CREATE INDEX idx_security_logs_canvas_hash ON security_logs(canvas_hash);

-- Honeypot Hits Table (Decoy trap routes)
CREATE TABLE IF NOT EXISTS honeypot_hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT NOT NULL,
  trap_path TEXT NOT NULL,
  country TEXT,
  region TEXT,
  city TEXT,
  isp TEXT,
  org TEXT,
  user_agent TEXT,
  referrer TEXT,
  threat_score INTEGER DEFAULT 100,
  raw_headers JSONB
);

CREATE INDEX idx_honeypot_hits_created_at ON honeypot_hits(created_at DESC);
CREATE INDEX idx_honeypot_hits_ip_address ON honeypot_hits(ip_address);

-- Blocked IPs Table (IP blocklist management)
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_by TEXT DEFAULT 'system',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_blocked_ips_ip_address ON blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_is_active ON blocked_ips(is_active);

-- Alert History Table (Track all alerts sent)
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  alert_type TEXT NOT NULL, -- 'critical', 'warning'
  ip_address TEXT,
  reason TEXT NOT NULL,
  threat_score INTEGER,
  sent_via TEXT, -- 'email', 'telegram', 'both'
  security_log_id UUID REFERENCES security_logs(id)
);

CREATE INDEX idx_alert_history_created_at ON alert_history(created_at DESC);
CREATE INDEX idx_alert_history_alert_type ON alert_history(alert_type);

-- Enable Row Level Security (RLS)
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE honeypot_hits ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow service key full access)
CREATE POLICY "Service role can do everything on security_logs" ON security_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on honeypot_hits" ON honeypot_hits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on blocked_ips" ON blocked_ips
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on alert_history" ON alert_history
  FOR ALL USING (auth.role() = 'service_role');
