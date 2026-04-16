import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Check IP against AbuseIPDB
 * Free tier: 1000 checks/day
 */
export async function checkAbuseIPDB(ipAddress) {
  const apiKey = process.env.ABUSEIPDB_API_KEY;

  if (!apiKey) {
    console.warn('AbuseIPDB API key not configured');
    return {
      abuseConfidenceScore: 0,
      totalReports: 0,
      isPublic: true,
      usageType: 'Unknown'
    };
  }

  try {
    const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
      params: {
        ipAddress,
        maxAgeInDays: 90,
        verbose: true
      },
      headers: {
        Key: apiKey,
        Accept: 'application/json'
      },
      timeout: 5000
    });

    const data = response.data.data;

    return {
      abuseConfidenceScore: data.abuseConfidenceScore,
      totalReports: data.totalReports,
      isPublic: data.isPublic,
      usageType: data.usageType,
      domain: data.domain,
      countryCode: data.countryCode,
      isWhitelisted: data.isWhitelisted,
      reportUrl: `https://www.abuseipdb.com/check/${ipAddress}`
    };
  } catch (error) {
    console.error('Error checking AbuseIPDB:', error.message);
    return {
      abuseConfidenceScore: 0,
      totalReports: 0,
      isPublic: true,
      usageType: 'Unknown'
    };
  }
}

/**
 * Check IP against IPQualityScore
 * Free tier: 5000 requests/month
 */
export async function checkIPQualityScore(ipAddress) {
  const apiKey = process.env.IPQUALITYSCORE_KEY;

  if (!apiKey) {
    console.warn('IPQualityScore API key not configured');
    return {
      fraud_score: 0,
      vpn: false,
      proxy: false,
      tor: false,
      bot_status: false,
      recent_abuse: false,
      connection_type: 'Unknown'
    };
  }

  try {
    const response = await axios.get(
      `https://ipqualityscore.com/api/json/ip/${apiKey}/${ipAddress}`,
      {
        params: {
          strictness: 1,
          allow_public_access_points: true,
          lighter_penalties: false
        },
        timeout: 5000
      }
    );

    const data = response.data;

    return {
      fraud_score: data.fraud_score,
      vpn: data.vpn,
      proxy: data.proxy,
      tor: data.tor,
      bot_status: data.bot_status,
      recent_abuse: data.recent_abuse,
      connection_type: data.connection_type,
      ISP: data.ISP,
      ASN: data.ASN,
      organization: data.organization,
      is_crawler: data.is_crawler,
      timezone: data.timezone,
      mobile: data.mobile
    };
  } catch (error) {
    console.error('Error checking IPQualityScore:', error.message);
    return {
      fraud_score: 0,
      vpn: false,
      proxy: false,
      tor: false,
      bot_status: false,
      recent_abuse: false,
      connection_type: 'Unknown'
    };
  }
}

/**
 * Detect if IP belongs to a datacenter
 */
export function isDatacenterIP(org, isp) {
  const datacenterKeywords = [
    'amazon',
    'aws',
    'google cloud',
    'gcp',
    'microsoft azure',
    'azure',
    'digitalocean',
    'linode',
    'vultr',
    'ovh',
    'hetzner',
    'contabo',
    'godaddy',
    'rackspace',
    'cloudflare',
    'fastly',
    'akamai',
    'alibaba cloud',
    'oracle cloud',
    'ibm cloud',
    'dedicated server',
    'data center',
    'datacenter',
    'hosting',
    'virtual private server',
    'vps'
  ];

  const searchText = `${org || ''} ${isp || ''}`.toLowerCase();

  return datacenterKeywords.some(keyword => searchText.includes(keyword));
}

/**
 * Comprehensive threat intelligence check
 */
export async function performThreatIntelligence(ipAddress, geoData) {
  try {
    // Run checks in parallel
    const [abuseData, qualityData] = await Promise.all([
      checkAbuseIPDB(ipAddress),
      checkIPQualityScore(ipAddress)
    ]);

    // Detect datacenter IP
    const isDatacenter = isDatacenterIP(geoData?.org, geoData?.isp);

    return {
      abuse: abuseData,
      quality: qualityData,
      isDatacenter,
      combined: {
        abuse_score: abuseData.abuseConfidenceScore,
        fraud_score: qualityData.fraud_score,
        is_vpn: qualityData.vpn || geoData?.is_proxy || false,
        is_tor: qualityData.tor,
        is_proxy: qualityData.proxy || geoData?.is_proxy || false,
        is_datacenter: isDatacenter,
        bot_status: qualityData.bot_status,
        recent_abuse: qualityData.recent_abuse,
        connection_type: qualityData.connection_type
      }
    };
  } catch (error) {
    console.error('Error performing threat intelligence:', error);
    return {
      abuse: {},
      quality: {},
      isDatacenter: false,
      combined: {
        abuse_score: 0,
        fraud_score: 0,
        is_vpn: false,
        is_tor: false,
        is_proxy: false,
        is_datacenter: false,
        bot_status: false,
        recent_abuse: false,
        connection_type: 'Unknown'
      }
    };
  }
}

export default {
  checkAbuseIPDB,
  checkIPQualityScore,
  isDatacenterIP,
  performThreatIntelligence
};
