import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * SecurityDashboard Component
 * Real-time security monitoring dashboard
 */
export function SecurityDashboard() {
  const [logs, setLogs] = useState([]);
  const [honeypotHits, setHoneypotHits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    criticalThreats: 0,
    honeypotHits: 0,
    uniqueIPs: 0
  });
  const [filter, setFilter] = useState('all'); // all, high, critical

  useEffect(() => {
    if (!supabase) {
      console.error('Supabase not configured');
      setLoading(false);
      return;
    }

    loadInitialData();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [logs, honeypotHits]);

  /**
   * Load initial data
   */
  const loadInitialData = async () => {
    try {
      // Load recent security logs
      const { data: securityLogs, error: logsError } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Load honeypot hits
      const { data: honeypots, error: honeypotError } = await supabase
        .from('honeypot_hits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (honeypotError) throw honeypotError;

      setLogs(securityLogs || []);
      setHoneypotHits(honeypots || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  /**
   * Setup real-time subscription
   */
  const setupRealtimeSubscription = () => {
    if (!supabase) return;

    // Subscribe to security logs
    const logsChannel = supabase
      .channel('security_logs_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'security_logs'
      }, (payload) => {
        console.log('New security log:', payload.new);
        setLogs(prev => [payload.new, ...prev].slice(0, 100));
      })
      .subscribe();

    // Subscribe to honeypot hits
    const honeypotChannel = supabase
      .channel('honeypot_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'honeypot_hits'
      }, (payload) => {
        console.log('New honeypot hit:', payload.new);
        setHoneypotHits(prev => [payload.new, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(honeypotChannel);
    };
  };

  /**
   * Calculate statistics
   */
  const calculateStats = () => {
    const uniqueIPs = new Set(logs.map(log => log.ip_address)).size;
    const criticalThreats = logs.filter(log => log.threat_score >= 60).length;

    setStats({
      totalAttempts: logs.length,
      criticalThreats,
      honeypotHits: honeypotHits.length,
      uniqueIPs
    });
  };

  /**
   * Filter logs by threat level
   */
  const getFilteredLogs = () => {
    if (filter === 'critical') {
      return logs.filter(log => log.threat_score >= 60);
    } else if (filter === 'high') {
      return logs.filter(log => log.threat_score >= 40);
    }
    return logs;
  };

  /**
   * Export logs to CSV
   */
  const exportToCSV = () => {
    const headers = ['Timestamp', 'IP', 'Country', 'Threat Score', 'Status', 'ISP'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.ip_address,
      log.country || 'Unknown',
      log.threat_score,
      log.login_status,
      log.isp || 'Unknown'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Loading Security Dashboard...</h2>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div style={styles.error}>
        <h2>⚠️ Configuration Error</h2>
        <p>Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
      </div>
    );
  }

  const filteredLogs = getFilteredLogs();

  return (
    <div style={styles.dashboard}>
      <header style={styles.header}>
        <h1>🔒 Security Monitoring Dashboard</h1>
        <p style={styles.subtitle}>4-Layer Intrusion Detection System - Real-time Monitoring</p>
      </header>

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.totalAttempts}</div>
          <div style={styles.statLabel}>Total Attempts</div>
        </div>
        <div style={{...styles.statCard, ...styles.statCardWarning}}>
          <div style={styles.statValue}>{stats.criticalThreats}</div>
          <div style={styles.statLabel}>Critical Threats</div>
        </div>
        <div style={{...styles.statCard, ...styles.statCardDanger}}>
          <div style={styles.statValue}>{stats.honeypotHits}</div>
          <div style={styles.statLabel}>Honeypot Hits</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.uniqueIPs}</div>
          <div style={styles.statLabel}>Unique IPs</div>
        </div>
      </div>

      {/* Honeypot Hits Section */}
      {honeypotHits.length > 0 && (
        <div style={styles.section}>
          <h2>🎯 Honeypot Trap Hits (Confirmed Threats)</h2>
          <div style={styles.honeypotGrid}>
            {honeypotHits.slice(0, 10).map(hit => (
              <div key={hit.id} style={styles.honeypotCard}>
                <div style={styles.honeypotHeader}>
                  <span>💀 {hit.trap_path}</span>
                  <span style={styles.threatBadge}>CRITICAL</span>
                </div>
                <div style={styles.honeypotInfo}>
                  <strong>IP:</strong> {hit.ip_address}<br />
                  <strong>Location:</strong> {hit.city}, {hit.country}<br />
                  <strong>ISP:</strong> {hit.isp}<br />
                  <strong>Time:</strong> {new Date(hit.created_at).toLocaleString()}
                </div>
                <a
                  href={`https://www.abuseipdb.com/check/${hit.ip_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  🔍 Check AbuseIPDB
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Export */}
      <div style={styles.controls}>
        <div style={styles.filters}>
          <button
            style={filter === 'all' ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setFilter('all')}
          >
            All ({logs.length})
          </button>
          <button
            style={filter === 'high' ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setFilter('high')}
          >
            High Threat ({logs.filter(l => l.threat_score >= 40).length})
          </button>
          <button
            style={filter === 'critical' ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setFilter('critical')}
          >
            Critical ({logs.filter(l => l.threat_score >= 60).length})
          </button>
        </div>
        <button style={styles.exportButton} onClick={exportToCSV}>
          📥 Export CSV
        </button>
      </div>

      {/* Security Logs Table */}
      <div style={styles.section}>
        <h2>📊 Security Logs</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Timestamp</th>
                <th style={styles.th}>IP Address</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Threat Score</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Device</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.noData}>No logs found</td>
                </tr>
              ) : (
                filteredLogs.slice(0, 50).map(log => (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.td}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={styles.td}>
                      <code>{log.ip_address}</code>
                      {log.is_vpn && <span style={styles.badge}>VPN</span>}
                      {log.is_tor && <span style={styles.badgeDanger}>TOR</span>}
                    </td>
                    <td style={styles.td}>
                      {log.city}, {log.country}
                    </td>
                    <td style={styles.td}>
                      <span style={getThreatScoreStyle(log.threat_score)}>
                        {log.threat_score}/100
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={getStatusStyle(log.login_status)}>
                        {log.login_status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {log.device_type} / {log.os}
                    </td>
                    <td style={styles.td}>
                      <a
                        href={`https://www.abuseipdb.com/check/${log.ip_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.linkSmall}
                      >
                        Check
                      </a>
                      {log.lat && log.lon && (
                        <>
                          {' | '}
                          <a
                            href={`https://maps.google.com/?q=${log.lat},${log.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.linkSmall}
                          >
                            Map
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to get threat score styling
 */
function getThreatScoreStyle(score) {
  let color = '#10b981'; // green
  if (score >= 80) color = '#dc2626'; // red
  else if (score >= 60) color = '#f59e0b'; // orange
  else if (score >= 40) color = '#eab308'; // yellow

  return {
    ...styles.badge,
    backgroundColor: color,
    fontWeight: 'bold'
  };
}

/**
 * Helper function to get status styling
 */
function getStatusStyle(status) {
  const colors = {
    success: '#10b981',
    failed: '#ef4444',
    blocked: '#dc2626',
    attempted: '#6b7280'
  };

  return {
    ...styles.badge,
    backgroundColor: colors[status] || '#6b7280'
  };
}

// Styles
const styles = {
  dashboard: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '14px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  },
  error: {
    padding: '40px',
    textAlign: 'center',
    color: '#dc2626'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statCardWarning: {
    borderLeft: '4px solid #f59e0b'
  },
  statCardDanger: {
    borderLeft: '4px solid #dc2626'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#111827'
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '5px'
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  honeypotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px',
    marginTop: '15px'
  },
  honeypotCard: {
    backgroundColor: '#fef2f2',
    border: '2px solid #dc2626',
    borderRadius: '6px',
    padding: '15px'
  },
  honeypotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  honeypotInfo: {
    fontSize: '13px',
    lineHeight: '1.6',
    marginBottom: '10px'
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  filters: {
    display: 'flex',
    gap: '10px'
  },
  filterButton: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  },
  filterButtonActive: {
    padding: '8px 16px',
    border: '1px solid #3b82f6',
    borderRadius: '4px',
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  },
  exportButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#10b981',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  th: {
    backgroundColor: '#f3f4f6',
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #e5e7eb'
  },
  tr: {
    borderBottom: '1px solid #e5e7eb'
  },
  td: {
    padding: '12px'
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280'
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'white',
    marginLeft: '5px'
  },
  badgeDanger: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'white',
    marginLeft: '5px',
    backgroundColor: '#dc2626'
  },
  threatBadge: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '12px'
  },
  linkSmall: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '12px'
  }
};

export default SecurityDashboard;
