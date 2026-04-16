import axios from 'axios';

/**
 * Get geolocation and ISP data for an IP address using ip-api.com
 * Free tier: 45 requests per minute
 */
export async function getIPGeolocation(ipAddress) {
  try {
    // Skip localhost and private IPs
    if (isPrivateIP(ipAddress)) {
      return {
        ip: ipAddress,
        country: 'Local',
        regionName: 'Local',
        city: 'Local',
        zip: '',
        lat: 0,
        lon: 0,
        timezone: 'UTC',
        isp: 'Local Network',
        org: 'Private',
        as: '',
        mobile: false,
        proxy: false,
        query: ipAddress
      };
    }

    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
      params: {
        fields: 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,query'
      },
      timeout: 5000
    });

    if (response.data.status === 'fail') {
      console.error('IP API failed:', response.data.message);
      return null;
    }

    return {
      ip: response.data.query,
      country: response.data.country,
      countryCode: response.data.countryCode,
      region: response.data.regionName,
      city: response.data.city,
      zip: response.data.zip,
      lat: response.data.lat,
      lon: response.data.lon,
      timezone: response.data.timezone,
      isp: response.data.isp,
      org: response.data.org,
      asn: response.data.as,
      is_mobile: response.data.mobile,
      is_proxy: response.data.proxy
    };
  } catch (error) {
    console.error('Error fetching IP geolocation:', error.message);
    return null;
  }
}

/**
 * Check if IP is private/local
 */
function isPrivateIP(ip) {
  if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1') {
    return true;
  }

  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  // 10.0.0.0 - 10.255.255.255
  if (parts[0] === '10') return true;

  // 172.16.0.0 - 172.31.255.255
  if (parts[0] === '172' && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31) return true;

  // 192.168.0.0 - 192.168.255.255
  if (parts[0] === '192' && parts[1] === '168') return true;

  return false;
}

/**
 * Extract IP address from request
 */
export function extractIPAddress(req) {
  // Check various headers for real IP (handles proxies)
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xRealIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare

  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, first is the original client
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }

  if (xRealIP) {
    return xRealIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address
  return req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

/**
 * Extract full IP chain (all proxy hops)
 */
export function extractIPChain(req) {
  const xForwardedFor = req.headers['x-forwarded-for'];

  if (xForwardedFor) {
    return xForwardedFor.split(',').map(ip => ip.trim());
  }

  return [extractIPAddress(req)];
}

export default {
  getIPGeolocation,
  extractIPAddress,
  extractIPChain
};
