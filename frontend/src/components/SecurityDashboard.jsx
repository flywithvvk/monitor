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
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>🔒</div>
            <div>
              <h1 style={styles.headerTitle}>Security Monitor</h1>
              <p style={styles.subtitle}>Real-time Threat Intelligence Dashboard</p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.liveIndicator}>
              <span style={styles.liveDot}></span>
              <span style={styles.liveText}>Live</span>
            </div>
            <div style={styles.refreshInfo}>
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* Statistics Cards with Enhanced Design */}
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, ...styles.statCardPrimary}}>
          <div style={styles.statHeader}>
            <span style={styles.statIcon}>📊</span>
            <span style={styles.statTrend}>+{logs.length > 0 ? ((logs.length / 100) * 100).toFixed(0) : 0}%</span>
          </div>
          <div style={styles.statValue}>{stats.totalAttempts}</div>
          <div style={styles.statLabel}>Total Attempts</div>
          <div style={styles.statMeter}>
            <div style={{...styles.statMeterFill, width: `${Math.min(stats.totalAttempts, 100)}%`, backgroundColor: '#3b82f6'}}></div>
          </div>
        </div>
        <div style={{...styles.statCard, ...styles.statCardWarning}}>
          <div style={styles.statHeader}>
            <span style={styles.statIcon}>⚠️</span>
            <span style={{...styles.statTrend, color: '#f59e0b'}}>
              {stats.criticalThreats > 0 ? 'Alert' : 'Safe'}
            </span>
          </div>
          <div style={styles.statValue}>{stats.criticalThreats}</div>
          <div style={styles.statLabel}>Critical Threats</div>
          <div style={styles.statMeter}>
            <div style={{...styles.statMeterFill, width: `${Math.min((stats.criticalThreats / Math.max(stats.totalAttempts, 1)) * 100, 100)}%`, backgroundColor: '#f59e0b'}}></div>
          </div>
        </div>
        <div style={{...styles.statCard, ...styles.statCardDanger}}>
          <div style={styles.statHeader}>
            <span style={styles.statIcon}>🎯</span>
            <span style={{...styles.statTrend, color: '#dc2626'}}>
              {stats.honeypotHits > 0 ? 'Active' : 'None'}
            </span>
          </div>
          <div style={styles.statValue}>{stats.honeypotHits}</div>
          <div style={styles.statLabel}>Honeypot Hits</div>
          <div style={styles.statMeter}>
            <div style={{...styles.statMeterFill, width: `${Math.min(stats.honeypotHits * 10, 100)}%`, backgroundColor: '#dc2626'}}></div>
          </div>
        </div>
        <div style={{...styles.statCard, ...styles.statCardSuccess}}>
          <div style={styles.statHeader}>
            <span style={styles.statIcon}>🌐</span>
            <span style={styles.statTrend}>Tracking</span>
          </div>
          <div style={styles.statValue}>{stats.uniqueIPs}</div>
          <div style={styles.statLabel}>Unique IPs</div>
          <div style={styles.statMeter}>
            <div style={{...styles.statMeterFill, width: `${Math.min((stats.uniqueIPs / Math.max(stats.totalAttempts, 1)) * 100, 100)}%`, backgroundColor: '#10b981'}}></div>
          </div>
        </div>
      </div>

      {/* Honeypot Hits Section */}
      {honeypotHits.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>🎯</span>
              <h2 style={styles.sectionH2}>Honeypot Detections</h2>
              <span style={styles.criticalBadge}>CRITICAL</span>
            </div>
            <div style={styles.sectionSubtitle}>
              Confirmed malicious activity - 100% threat confidence
            </div>
          </div>
          <div style={styles.honeypotGrid}>
            {honeypotHits.slice(0, 10).map((hit, index) => (
              <div key={hit.id} style={{...styles.honeypotCard, animation: `slideInRight 0.3s ease-out ${index * 0.1}s both`}}>
                <div style={styles.honeypotHeader}>
                  <span style={styles.honeypotPath}>💀 {hit.trap_path}</span>
                  <span style={styles.threatBadge}>CRITICAL</span>
                </div>
                <div style={styles.honeypotInfo}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>IP:</span>
                    <code style={styles.infoCode}>{hit.ip_address}</code>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Location:</span>
                    <span style={styles.infoValue}>{hit.city}, {hit.country}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>ISP:</span>
                    <span style={styles.infoValue}>{hit.isp}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Time:</span>
                    <span style={styles.infoValue}>{new Date(hit.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <a
                  href={`https://www.abuseipdb.com/check/${hit.ip_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.linkButton}
                >
                  🔍 Check Reputation
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Export with Enhanced UI */}
      <div style={styles.controls}>
        <div style={styles.controlsLeft}>
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Filter by Threat Level:</span>
            <div style={styles.filters}>
              <button
                style={filter === 'all' ? styles.filterButtonActive : styles.filterButton}
                onClick={() => setFilter('all')}
              >
                <span style={styles.filterIcon}>📋</span>
                All <span style={styles.filterCount}>({logs.length})</span>
              </button>
              <button
                style={filter === 'high' ? styles.filterButtonActive : styles.filterButton}
                onClick={() => setFilter('high')}
              >
                <span style={styles.filterIcon}>⚠️</span>
                High <span style={styles.filterCount}>({logs.filter(l => l.threat_score >= 40).length})</span>
              </button>
              <button
                style={filter === 'critical' ? styles.filterButtonActive : styles.filterButton}
                onClick={() => setFilter('critical')}
              >
                <span style={styles.filterIcon}>🔴</span>
                Critical <span style={styles.filterCount}>({logs.filter(l => l.threat_score >= 60).length})</span>
              </button>
            </div>
          </div>
        </div>
        <button style={styles.exportButton} onClick={exportToCSV}>
          <span style={styles.exportIcon}>📥</span>
          Export CSV
        </button>
      </div>

      {/* Security Logs Table */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>📊</span>
            <h2 style={styles.sectionH2}>Security Logs</h2>
            <span style={styles.logCount}>{filteredLogs.length} entries</span>
          </div>
          <div style={styles.sectionSubtitle}>
            Detailed access attempt analysis with threat intelligence
          </div>
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  <div style={styles.thContent}>
                    <span>⏰</span>
                    <span>Timestamp</span>
                  </div>
                </th>
                <th style={styles.th}>
                  <div style={styles.thContent}>
                    <span>🌐</span>
                    <span>IP Address</span>
                  </div>
                </th>
                <th style={styles.th}>
                  <div style={styles.thContent}>
                    <span>📍</span>
                    <span>Location</span>
                  </div>
                </th>
                <th style={styles.th}>
                  <div style={styles.thContent}>
                    <span>⚡</span>
                    <span>Threat Score</span>
                  </div>
                </th>
                <th style={styles.th}>
                  <div style={styles.thContent}>
                    <span>📌</span>
                    <span>Status</span>
                  </div>
                </th>
                <th style={styles.th}>
                  <div style={styles.thContent}>
                    <span>💻</span>
                    <span>Device</span>
                  </div>
                </th>
                <th style={styles.th}>
                  <div style={styles.thContent}>
                    <span>🔧</span>
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.noData}>
                    <div style={styles.noDataContent}>
                      <span style={styles.noDataIcon}>🔍</span>
                      <div>No logs found matching your filter</div>
                      <div style={styles.noDataHint}>Try adjusting the filter or wait for new activity</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 50).map((log, index) => (
                  <tr key={log.id} style={{...styles.tr, animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`}}>
                    <td style={styles.td}>
                      <div style={styles.cellContent}>
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.cellContent}>
                        <code style={styles.ipCode}>{log.ip_address}</code>
                        <div style={styles.badgeGroup}>
                          {log.is_vpn && <span style={styles.badge}>VPN</span>}
                          {log.is_tor && <span style={styles.badgeDanger}>TOR</span>}
                          {log.is_proxy && <span style={styles.badgeWarning}>PROXY</span>}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.cellContent}>
                        <div style={styles.locationText}>{log.city || 'Unknown'}</div>
                        <div style={styles.locationSub}>{log.country || 'Unknown'}</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.cellContent}>
                        <div style={styles.threatScoreWrapper}>
                          <span style={getThreatScoreStyle(log.threat_score)}>
                            {log.threat_score}
                          </span>
                          <div style={styles.threatBar}>
                            <div style={{
                              ...styles.threatBarFill,
                              width: `${log.threat_score}%`,
                              backgroundColor: log.threat_score >= 60 ? '#dc2626' : log.threat_score >= 40 ? '#f59e0b' : '#10b981'
                            }}></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={getStatusStyle(log.login_status)}>
                        {log.login_status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.cellContent}>
                        <div style={styles.deviceMain}>{log.device_type || 'Unknown'}</div>
                        <div style={styles.deviceSub}>{log.os || 'Unknown'}</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <a
                          href={`https://www.abuseipdb.com/check/${log.ip_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.actionButton}
                          title="Check IP Reputation"
                        >
                          🔍
                        </a>
                        {log.lat && log.lon && (
                          <a
                            href={`https://maps.google.com/?q=${log.lat},${log.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.actionButton}
                            title="View on Map"
                          >
                            📍
                          </a>
                        )}
                      </div>
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
  let bgColor = '#d1fae5';
  if (score >= 80) {
    color = '#dc2626'; // red
    bgColor = '#fee2e2';
  } else if (score >= 60) {
    color = '#f59e0b'; // orange
    bgColor = '#ffedd5';
  } else if (score >= 40) {
    color = '#eab308'; // yellow
    bgColor = '#fef3c7';
  }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    color: color,
    backgroundColor: bgColor,
    border: `2px solid ${color}`,
    minWidth: '60px'
  };
}

/**
 * Helper function to get status styling
 */
function getStatusStyle(status) {
  const styles = {
    success: { color: '#10b981', bg: '#d1fae5', border: '#10b981' },
    failed: { color: '#ef4444', bg: '#fee2e2', border: '#ef4444' },
    blocked: { color: '#dc2626', bg: '#fee2e2', border: '#dc2626' },
    attempted: { color: '#6b7280', bg: '#f3f4f6', border: '#9ca3af' }
  };

  const style = styles[status] || styles.attempted;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: style.color,
    backgroundColor: style.bg,
    border: `1px solid ${style.border}`
  };
}

// Styles
const styles = {
  dashboard: {
    padding: '0',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '32px 40px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  headerIcon: {
    fontSize: '48px',
    animation: 'pulse 2s ease-in-out infinite'
  },
  headerTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'white',
    margin: 0,
    letterSpacing: '-0.5px',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '15px',
    fontWeight: '500',
    margin: '4px 0 0 0'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)'
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    animation: 'pulse 2s ease-in-out infinite',
    boxShadow: '0 0 0 0 rgba(16, 185, 129, 1)'
  },
  liveText: {
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  refreshInfo: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '13px',
    fontWeight: '500'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    gap: '20px'
  },
  error: {
    padding: '60px 40px',
    textAlign: 'center',
    color: '#dc2626',
    maxWidth: '600px',
    margin: '0 auto'
  },
  statsGrid: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 40px 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  statCardPrimary: {
    borderLeft: '4px solid #3b82f6',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, white 50%)'
  },
  statCardWarning: {
    borderLeft: '4px solid #f59e0b',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, white 50%)'
  },
  statCardDanger: {
    borderLeft: '4px solid #dc2626',
    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, white 50%)'
  },
  statCardSuccess: {
    borderLeft: '4px solid #10b981',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, white 50%)'
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  statIcon: {
    fontSize: '28px'
  },
  statTrend: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: '#f1f5f9',
    color: '#64748b'
  },
  statValue: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '8px',
    lineHeight: 1
  },
  statLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px'
  },
  statMeter: {
    height: '6px',
    backgroundColor: '#f1f5f9',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  statMeterFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 1s ease-out',
    background: 'linear-gradient(90deg, currentColor 0%, rgba(255,255,255,0.3) 100%)'
  },
  section: {
    maxWidth: '1400px',
    margin: '0 auto 24px',
    padding: '0 40px'
  },
  sectionHeader: {
    marginBottom: '24px'
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  sectionIcon: {
    fontSize: '28px'
  },
  sectionH2: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0
  },
  criticalBadge: {
    padding: '4px 12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    border: '1px solid #fca5a5'
  },
  logCount: {
    padding: '4px 12px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600'
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500'
  },
  honeypotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  honeypotCard: {
    backgroundColor: '#fef2f2',
    border: '2px solid #fca5a5',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)'
  },
  honeypotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #fca5a5'
  },
  honeypotPath: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#991b1b',
    fontFamily: 'monospace'
  },
  honeypotInfo: {
    marginBottom: '16px'
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '13px'
  },
  infoLabel: {
    fontWeight: '600',
    color: '#7f1d1d',
    minWidth: '80px'
  },
  infoCode: {
    padding: '2px 6px',
    backgroundColor: '#fee2e2',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#991b1b',
    border: '1px solid #fca5a5'
  },
  infoValue: {
    color: '#991b1b',
    fontWeight: '500'
  },
  threatBadge: {
    padding: '4px 10px',
    backgroundColor: '#dc2626',
    color: 'white',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
  },
  linkButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#dc2626',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
  },
  controls: {
    maxWidth: '1400px',
    margin: '0 auto 24px',
    padding: '0 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px'
  },
  controlsLeft: {
    flex: 1
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569'
  },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  },
  filterButtonActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    border: '2px solid #667eea',
    borderRadius: '10px',
    backgroundColor: '#667eea',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
  },
  filterIcon: {
    fontSize: '16px'
  },
  filterCount: {
    fontSize: '12px',
    opacity: 0.8
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },
  exportIcon: {
    fontSize: '16px'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    backgroundColor: '#f8fafc',
    padding: '16px',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: '2px solid #e2e8f0',
    color: '#475569',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  thContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s ease'
  },
  td: {
    padding: '16px',
    verticalAlign: 'middle'
  },
  cellContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  ipCode: {
    padding: '4px 8px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#1e293b',
    fontWeight: '600',
    display: 'inline-block'
  },
  badgeGroup: {
    display: 'flex',
    gap: '4px',
    marginTop: '4px',
    flexWrap: 'wrap'
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    border: '1px solid #93c5fd'
  },
  badgeDanger: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    border: '1px solid #fca5a5'
  },
  badgeWarning: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#f59e0b',
    backgroundColor: '#ffedd5',
    border: '1px solid #fcd34d'
  },
  locationText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b'
  },
  locationSub: {
    fontSize: '12px',
    color: '#64748b'
  },
  threatScoreWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '120px'
  },
  threatBar: {
    height: '4px',
    backgroundColor: '#f1f5f9',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  threatBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.5s ease-out'
  },
  deviceMain: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'capitalize'
  },
  deviceSub: {
    fontSize: '12px',
    color: '#64748b'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  actionButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    textDecoration: 'none',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    border: '1px solid #e2e8f0'
  },
  noData: {
    textAlign: 'center',
    padding: '60px 40px',
    backgroundColor: '#f8fafc'
  },
  noDataContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: '#64748b'
  },
  noDataIcon: {
    fontSize: '48px',
    opacity: 0.5
  },
  noDataHint: {
    fontSize: '13px',
    color: '#94a3b8'
  }
};

export default SecurityDashboard;
