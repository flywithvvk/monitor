import nodemailer from 'nodemailer';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create email transporter
 */
function createTransporter() {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured - email alerts disabled');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });
}

/**
 * Send email alert
 */
export async function sendEmailAlert(alertType, data) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('Email alert skipped - no transporter configured');
    return false;
  }

  const alertEmail = process.env.ALERT_EMAIL || process.env.SMTP_EMAIL;

  if (!alertEmail) {
    console.error('No alert email configured');
    return false;
  }

  const subject = alertType === 'critical'
    ? `🚨 CRITICAL SECURITY ALERT - ${data.reason}`
    : `⚠️ Security Warning - ${data.reason}`;

  const htmlBody = generateEmailHTML(alertType, data);

  try {
    await transporter.sendMail({
      from: `"Security Monitor" <${process.env.SMTP_EMAIL}>`,
      to: alertEmail,
      subject,
      html: htmlBody
    });

    console.log(`Email alert sent: ${alertType} - ${data.reason}`);
    return true;
  } catch (error) {
    console.error('Error sending email alert:', error.message);
    return false;
  }
}

/**
 * Send Telegram alert
 */
export async function sendTelegramAlert(alertType, data) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('Telegram alert skipped - credentials not configured');
    return false;
  }

  const emoji = alertType === 'critical' ? '🚨' : '⚠️';
  const message = generateTelegramMessage(alertType, data, emoji);

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    });

    console.log(`Telegram alert sent: ${alertType} - ${data.reason}`);
    return true;
  } catch (error) {
    console.error('Error sending Telegram alert:', error.message);
    return false;
  }
}

/**
 * Send alert via all configured channels
 */
export async function sendAlert(alertType, data) {
  const results = await Promise.allSettled([
    sendEmailAlert(alertType, data),
    sendTelegramAlert(alertType, data)
  ]);

  const emailSent = results[0].status === 'fulfilled' && results[0].value;
  const telegramSent = results[1].status === 'fulfilled' && results[1].value;

  let sentVia = [];
  if (emailSent) sentVia.push('email');
  if (telegramSent) sentVia.push('telegram');

  return {
    sent: sentVia.length > 0,
    sentVia: sentVia.join(', ') || 'none',
    emailSent,
    telegramSent
  };
}

/**
 * Generate HTML email body
 */
function generateEmailHTML(alertType, data) {
  const bgColor = alertType === 'critical' ? '#dc2626' : '#ea580c';
  const mapLink = data.lat && data.lon
    ? `https://maps.google.com/?q=${data.lat},${data.lon}`
    : null;
  const abuseLink = data.ip_address
    ? `https://www.abuseipdb.com/check/${data.ip_address}`
    : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background-color: ${bgColor}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #6b7280; margin-top: 5px; }
    .threat-score { font-size: 48px; font-weight: bold; text-align: center; color: ${bgColor}; margin: 20px 0; }
    .button { display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 5px; }
    .flags { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 10px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${alertType === 'critical' ? '🚨 CRITICAL SECURITY ALERT' : '⚠️ Security Warning'}</h1>
      <p>${data.reason}</p>
    </div>
    <div class="content">
      <div class="threat-score">${data.threat_score}/100</div>

      <div class="field">
        <div class="label">IP Address</div>
        <div class="value">${data.ip_address}</div>
      </div>

      <div class="field">
        <div class="label">Location</div>
        <div class="value">${data.city || 'Unknown'}, ${data.region || 'Unknown'}, ${data.country || 'Unknown'}</div>
      </div>

      <div class="field">
        <div class="label">ISP / Organization</div>
        <div class="value">${data.isp || 'Unknown'} / ${data.org || 'Unknown'}</div>
      </div>

      <div class="field">
        <div class="label">Device</div>
        <div class="value">${data.device_type || 'Unknown'} - ${data.os || ''} ${data.browser || ''}</div>
      </div>

      ${data.webrtc_ips && data.webrtc_ips.length > 0 ? `
      <div class="field">
        <div class="label">WebRTC IPs (Real IPs behind VPN)</div>
        <div class="value">${data.webrtc_ips.join(', ')}</div>
      </div>
      ` : ''}

      ${data.threat_flags && data.threat_flags.length > 0 ? `
      <div class="flags">
        <div class="label">Threat Indicators:</div>
        <ul>
          ${data.threat_flags.map(flag => `<li>${flag}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <div class="field">
        <div class="label">Timestamp</div>
        <div class="value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        ${mapLink ? `<a href="${mapLink}" class="button">📍 View on Map</a>` : ''}
        ${abuseLink ? `<a href="${abuseLink}" class="button">🔍 Check AbuseIPDB</a>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate Telegram message
 */
function generateTelegramMessage(alertType, data, emoji) {
  const header = alertType === 'critical'
    ? `${emoji} <b>CRITICAL SECURITY ALERT</b>`
    : `${emoji} <b>Security Warning</b>`;

  let message = `${header}\n\n`;
  message += `<b>Reason:</b> ${data.reason}\n`;
  message += `<b>Threat Score:</b> ${data.threat_score}/100\n\n`;
  message += `<b>IP Address:</b> <code>${data.ip_address}</code>\n`;
  message += `<b>Location:</b> ${data.city || 'Unknown'}, ${data.country || 'Unknown'}\n`;
  message += `<b>ISP:</b> ${data.isp || 'Unknown'}\n`;

  if (data.webrtc_ips && data.webrtc_ips.length > 0) {
    message += `<b>WebRTC IPs:</b> ${data.webrtc_ips.join(', ')}\n`;
  }

  if (data.threat_flags && data.threat_flags.length > 0) {
    message += `\n<b>Flags:</b>\n${data.threat_flags.map(f => `• ${f}`).join('\n')}\n`;
  }

  message += `\n<b>Time:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`;

  if (data.lat && data.lon) {
    message += `\n\n📍 <a href="https://maps.google.com/?q=${data.lat},${data.lon}">View on Map</a>`;
  }

  if (data.ip_address) {
    message += `\n🔍 <a href="https://www.abuseipdb.com/check/${data.ip_address}">Check AbuseIPDB</a>`;
  }

  return message;
}

export default {
  sendEmailAlert,
  sendTelegramAlert,
  sendAlert
};
