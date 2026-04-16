import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Log security event
export async function logSecurityEvent(data) {
  try {
    const { data: result, error } = await supabase
      .from('security_logs')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error logging security event:', error);
    throw error;
  }
}

// Log honeypot hit
export async function logHoneypotHit(data) {
  try {
    const { data: result, error } = await supabase
      .from('honeypot_hits')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error logging honeypot hit:', error);
    throw error;
  }
}

// Check if IP is blocked
export async function isIPBlocked(ipAddress) {
  try {
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('*')
      .eq('ip_address', ipAddress)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    if (data && data.expires_at) {
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      if (now > expiresAt) {
        // Auto-expire the block
        await supabase
          .from('blocked_ips')
          .update({ is_active: false })
          .eq('id', data.id);
        return false;
      }
    }

    return !!data;
  } catch (error) {
    console.error('Error checking IP block:', error);
    return false;
  }
}

// Block an IP
export async function blockIP(ipAddress, reason, blockedBy = 'system', expiresAt = null) {
  try {
    const { data, error } = await supabase
      .from('blocked_ips')
      .insert([{
        ip_address: ipAddress,
        reason,
        blocked_by: blockedBy,
        expires_at: expiresAt,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error blocking IP:', error);
    throw error;
  }
}

// Log alert
export async function logAlert(alertType, ipAddress, reason, threatScore, sentVia, securityLogId) {
  try {
    const { data, error } = await supabase
      .from('alert_history')
      .insert([{
        alert_type: alertType,
        ip_address: ipAddress,
        reason,
        threat_score: threatScore,
        sent_via: sentVia,
        security_log_id: securityLogId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging alert:', error);
    throw error;
  }
}

// Get recent security logs
export async function getRecentSecurityLogs(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching security logs:', error);
    throw error;
  }
}

// Check for duplicate canvas hash
export async function findDuplicateCanvasHash(canvasHash) {
  try {
    const { data, error } = await supabase
      .from('security_logs')
      .select('*')
      .eq('canvas_hash', canvasHash)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error checking canvas hash:', error);
    return [];
  }
}

// Get failed attempts count for IP in time window
export async function getFailedAttemptsCount(ipAddress, hoursAgo = 1) {
  try {
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('security_logs')
      .select('id')
      .eq('ip_address', ipAddress)
      .eq('login_status', 'failed')
      .gte('created_at', cutoffTime);

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error('Error counting failed attempts:', error);
    return 0;
  }
}

export default {
  supabase,
  logSecurityEvent,
  logHoneypotHit,
  isIPBlocked,
  blockIP,
  logAlert,
  getRecentSecurityLogs,
  findDuplicateCanvasHash,
  getFailedAttemptsCount
};
