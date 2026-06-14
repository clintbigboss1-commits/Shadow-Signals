'use strict';

/**
 * EMAIL SYSTEM — Resend (resend.com)
 * Free tier: 3,000 emails/month — more than enough to start
 * 
 * Emails we send:
 * 1. Welcome (on signup)
 * 2. Trial ending in 2 days
 * 3. Subscription confirmed
 * 4. Payment failed warning
 * 5. Win alert (when we find a big edge)
 */

const FROM = process.env.EMAIL_FROM || 'Shadow Signals <noreply@send.shadowsignals.app>';
// FRONTEND_URL may be a comma-separated origin list — links use the first one
const BASE = (process.env.FRONTEND_URL || 'https://shadowsignals.app').split(',')[0].trim();

// Lazy-load Resend so server starts even without key
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === 're_your_key_here') return null;
  const { Resend } = require('resend');
  return new Resend(key);
}

async function send(to, subject, html) {
  const resend = getResend();
  if (!resend) {
    console.log(`📧 [EMAIL SKIPPED - no Resend key] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }
  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html });
    console.log(`📧 Email sent: "${subject}" → ${to}`);
    return result;
  } catch (err) {
    console.error(`📧 Email failed: ${err.message}`);
    return { error: err.message };
  }
}

// ── 1. Welcome email ───────────────────────────────────────────────────────
async function sendWelcome(user) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a1929;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
    
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#0099cc);width:48px;height:48px;border-radius:12px;line-height:48px;font-size:22px;font-weight:900;color:#0a1929;text-align:center;">S</div>
      <h1 style="color:#e2e8f0;font-size:20px;font-weight:900;margin:16px 0 4px;letter-spacing:-0.5px;">SHADOW SYNDICATE</h1>
      <p style="color:#64748b;font-size:13px;margin:0;">Beat the closing line every time</p>
    </div>

    <h2 style="color:#e2e8f0;font-size:24px;font-weight:800;margin:0 0 16px;">
      Welcome${user.name ? `, ${user.name}` : ''}. You're in. 🎯
    </h2>

    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Your 7-day free trial has started. You now have access to the +EV scanner — 
      real-time edges across Sportsbet, TAB, Bet365, Ladbrokes and 8 more AU bookmakers.
    </p>

    <div style="background:#111827;border:1px solid #1e2d45;border-radius:12px;padding:20px;margin:0 0 28px;">
      <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">What to do first</p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${['Go to Markets → find your first +EV bet', 'Check the grade — Grade S+ means highest confidence', 'Use the Kelly % to size your stake', 'Log it in CLV Tracker to measure your edge over time'].map((step, i) => `
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:22px;height:22px;border-radius:50%;background:#00d4ff;color:#0a1929;font-weight:900;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i+1}</div>
          <span style="color:#e2e8f0;font-size:14px;">${step}</span>
        </div>`).join('')}
      </div>
    </div>

    <a href="${BASE}/markets" style="display:block;text-align:center;background:linear-gradient(135deg,#00d4ff,#0099cc);color:#0a1929;font-weight:800;font-size:16px;padding:14px 24px;border-radius:10px;text-decoration:none;margin:0 0 24px;">
      ⚡ Find My Edge Now →
    </a>

    <p style="color:#475569;font-size:12px;line-height:1.6;margin:0;text-align:center;">
      Shadow Signals · 18+ Only · Gambling involves risk<br>
      Help: <a href="tel:1800858858" style="color:#00d4ff;">1800 858 858</a> · gamblinghelponline.org.au
    </p>
  </div>
</body>
</html>`;

  return send(user.email, 'Welcome to Shadow Signals — your edge starts now', html);
}

// ── 2. Trial ending (sent 2 days before trial expires) ────────────────────
async function sendTrialEnding(user) {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a1929;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
    
    <div style="background:#1a0a00;border:1px solid rgba(245,158,11,.3);border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">⏰</div>
      <h2 style="color:#f59e0b;font-size:20px;font-weight:800;margin:0 0 8px;">Your trial ends in 2 days</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0;">Don't lose access to your edge</p>
    </div>

    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Hey${user.name ? ` ${user.name}` : ''},<br><br>
      Your Shadow Signals trial expires in 48 hours. After that you'll lose access to 
      the live +EV scanner, arb finder, and edge alerts.
    </p>

    <div style="background:#111827;border:1px solid #1e2d45;border-radius:12px;padding:20px;margin:0 0 28px;">
      <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;">Pro — $19.99 AUD/month</p>
      ${['Unlimited +EV scanner — all 12 AU bookies', 'Arb finder (guaranteed profit alerts)', 'Full CLV tracker with closing line analysis', 'Live edge alerts the moment markets open', 'Grade S+ confidence ratings'].map(f => `
      <div style="display:flex;gap:10px;margin-bottom:8px;">
        <span style="color:#10b981;font-weight:700;">✓</span>
        <span style="color:#e2e8f0;font-size:14px;">${f}</span>
      </div>`).join('')}
    </div>

    <a href="${BASE}/pricing" style="display:block;text-align:center;background:linear-gradient(135deg,#00d4ff,#0099cc);color:#0a1929;font-weight:800;font-size:16px;padding:14px 24px;border-radius:10px;text-decoration:none;margin:0 0 16px;">
      Keep My Access — $19.99/mo →
    </a>
    <p style="text-align:center;margin:0 0 24px;"><a href="${BASE}/pricing" style="color:#64748b;font-size:13px;">See all plans</a></p>

    <p style="color:#475569;font-size:12px;line-height:1.6;margin:0;text-align:center;">
      Shadow Signals · 18+ Only<br>
      Help: <a href="tel:1800858858" style="color:#00d4ff;">1800 858 858</a>
    </p>
  </div>
</body>
</html>`;

  return send(user.email, '⏰ Your Shadow Signals trial ends in 2 days', html);
}

// ── 3. Subscription confirmed ──────────────────────────────────────────────
async function sendSubscriptionConfirmed(user, plan) {
  const planNames = { free: 'Free', starter: 'Starter', pro: 'Pro', elite: 'Elite' };
  const planName = planNames[plan] || plan;
  
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a1929;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
    
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:12px;">✅</div>
      <h2 style="color:#10b981;font-size:24px;font-weight:900;margin:0 0 8px;">You're on ${planName}</h2>
      <p style="color:#64748b;font-size:14px;margin:0;">Full access unlocked. Let's beat the line.</p>
    </div>

    <a href="${BASE}/markets" style="display:block;text-align:center;background:linear-gradient(135deg,#00d4ff,#0099cc);color:#0a1929;font-weight:800;font-size:16px;padding:14px 24px;border-radius:10px;text-decoration:none;margin:0 0 24px;">
      ⚡ Go to Markets →
    </a>

    <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
      Manage your subscription: <a href="${BASE}/dashboard" style="color:#00d4ff;">Dashboard</a><br>
      18+ Only · Help: <a href="tel:1800858858" style="color:#00d4ff;">1800 858 858</a>
    </p>
  </div>
</body>
</html>`;

  return send(user.email, `✅ ${planName} plan activated — full access unlocked`, html);
}

// ── 4. Payment failed ──────────────────────────────────────────────────────
async function sendPaymentFailed(user) {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a1929;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
    
    <div style="background:#1a0808;border:1px solid rgba(239,68,68,.3);border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">⚠️</div>
      <h2 style="color:#ef4444;font-size:20px;font-weight:800;margin:0 0 8px;">Payment failed</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0;">Update your payment method to keep your access</p>
    </div>

    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Hey${user.name ? ` ${user.name}` : ''},<br><br>
      We couldn't process your last payment. Your access is still active for now — 
      Stripe will retry automatically. To avoid losing your subscription, 
      please update your payment details.
    </p>

    <a href="${BASE}/dashboard" style="display:block;text-align:center;background:#ef4444;color:#fff;font-weight:800;font-size:16px;padding:14px 24px;border-radius:10px;text-decoration:none;margin:0 0 24px;">
      Update Payment Method →
    </a>

    <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
      Shadow Signals · Questions? Reply to this email<br>
      18+ Only · <a href="tel:1800858858" style="color:#00d4ff;">1800 858 858</a>
    </p>
  </div>
</body>
</html>`;

  return send(user.email, '⚠️ Payment failed — update your details to keep your access', html);
}

// ── 5. Hot edge alert (for premium users who opt in) ──────────────────────
async function sendEdgeAlert(user, edge) {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a1929;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
    
    <div style="background:#0a1f0a;border:1px solid rgba(16,185,129,.3);border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span style="color:#10b981;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">🔥 Hot Edge Alert</span>
        <span style="background:rgba(16,185,129,.15);color:#10b981;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700;">+${edge.ev_percent}% EV</span>
      </div>
      <h2 style="color:#e2e8f0;font-size:20px;font-weight:800;margin:0 0 8px;">${edge.event_name}</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 16px;">${edge.sport_key?.replace(/_/g,' ').toUpperCase()}</p>
      
      <div style="background:#111827;border-radius:8px;padding:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#64748b;font-size:13px;">Selection</span>
          <span style="color:#00d4ff;font-weight:700;font-size:13px;">${edge.selection}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#64748b;font-size:13px;">Best at</span>
          <span style="color:#e2e8f0;font-weight:700;font-size:13px;text-transform:capitalize;">${edge.bookie?.replace(/_/g,' ')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#64748b;font-size:13px;">Odds</span>
          <span style="color:#10b981;font-weight:800;font-size:16px;font-family:monospace;">$${Number(edge.bookie_odds).toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#64748b;font-size:13px;">Fair price</span>
          <span style="color:#64748b;font-size:13px;font-family:monospace;">$${Number(edge.fair_odds).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <a href="${BASE}/markets" style="display:block;text-align:center;background:linear-gradient(135deg,#00d4ff,#0099cc);color:#0a1929;font-weight:800;font-size:16px;padding:14px 24px;border-radius:10px;text-decoration:none;margin:0 0 16px;">
      Add to Slip →
    </a>

    <p style="color:#475569;font-size:11px;text-align:center;margin:0;">
      Edges close fast. Act quickly.<br>
      <a href="${BASE}/dashboard" style="color:#64748b;">Manage alerts</a> · 18+ Only · <a href="tel:1800858858" style="color:#00d4ff;">1800 858 858</a>
    </p>
  </div>
</body>
</html>`;

  return send(user.email, `🔥 ${edge.ev_percent}% edge on ${edge.event_name} — act fast`, html);
}

// ── 6. Password reset ──────────────────────────────────────────────────────
async function sendPasswordReset(user, token) {
  const link = `${BASE}/reset?token=${token}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#071120;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#2979ff;width:48px;height:48px;border-radius:12px;line-height:48px;font-size:22px;font-weight:900;color:#071120;text-align:center;">S</div>
      <h1 style="color:#e2e8f0;font-size:20px;font-weight:900;margin:16px 0 4px;letter-spacing:2px;">SHADOW SIGNALS</h1>
      <p style="color:#64748b;font-size:13px;margin:0;">We see what the market misses</p>
    </div>

    <h2 style="color:#e2e8f0;font-size:24px;font-weight:800;margin:0 0 12px;">Reset your password</h2>
    <p style="color:#9eb1c8;font-size:14px;line-height:1.7;margin:0 0 24px;">
      Someone (hopefully you) asked to reset the password for <b style="color:#e2e8f0;">${user.email}</b>.
      Tap the button below to choose a new one. This link works for <b style="color:#e2e8f0;">1 hour</b>.
    </p>

    <a href="${link}" style="display:block;text-align:center;background:#2979ff;color:#071120;font-weight:800;font-size:16px;padding:14px 24px;border-radius:10px;text-decoration:none;margin:0 0 20px;">
      Choose new password →
    </a>

    <p style="color:#475569;font-size:12px;line-height:1.7;margin:0 0 8px;">
      If the button doesn't work, copy this link into your browser:<br>
      <a href="${link}" style="color:#2979ff;word-break:break-all;">${link}</a>
    </p>

    <p style="color:#475569;font-size:11px;text-align:center;margin:24px 0 0;">
      Didn't request this? You can safely ignore this email — your password stays the same.<br>
      18+ Only · Gambling Help <a href="tel:1800858858" style="color:#2979ff;">1800 858 858</a>
    </p>
  </div>
</body>
</html>`;

  return send(user.email, 'Reset your Shadow Signals password', html);
}

// ── 7. Admin invite — free access granted ───────────────────────────────────
async function sendAdminInvite(user, token, plan) {
  const link = `${BASE}/reset?token=${token}`;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#071120;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#2979ff;width:48px;height:48px;border-radius:12px;line-height:48px;font-size:22px;font-weight:900;color:#071120;text-align:center;">S</div>
      <h1 style="color:#e2e8f0;font-size:20px;font-weight:900;margin:16px 0 4px;letter-spacing:2px;">SHADOW SIGNALS</h1>
      <p style="color:#64748b;font-size:13px;margin:0;">We see what the market misses</p>
    </div>

    <h2 style="color:#e2e8f0;font-size:24px;font-weight:800;margin:0 0 12px;">
      You're in${user.name ? `, ${user.name}` : ''}. 🎯
    </h2>
    <p style="color:#9eb1c8;font-size:14px;line-height:1.7;margin:0 0 8px;">
      You've been given <b style="color:#ffab00;">${planLabel}</b> access to Shadow Signals — on the house.
    </p>
    <p style="color:#9eb1c8;font-size:14px;line-height:1.7;margin:0 0 24px;">
      Tap the button to set your password and start seeing the signals the market misses.
      This link works for <b style="color:#e2e8f0;">7 days</b>.
    </p>

    <a href="${link}" style="display:block;text-align:center;background:#2979ff;color:#071120;font-weight:800;font-size:16px;padding:14px 24px;border-radius:10px;text-decoration:none;margin:0 0 20px;">
      Set password &amp; get started →
    </a>

    <p style="color:#475569;font-size:12px;line-height:1.7;margin:0 0 8px;">
      If the button doesn't work, copy this link into your browser:<br>
      <a href="${link}" style="color:#2979ff;word-break:break-all;">${link}</a>
    </p>

    <p style="color:#475569;font-size:11px;text-align:center;margin:24px 0 0;">
      18+ Only · Gambling Help <a href="tel:1800858858" style="color:#2979ff;">1800 858 858</a>
    </p>
  </div>
</body>
</html>`;

  return send(user.email, `You've been given ${planLabel} access to Shadow Signals 🎯`, html);
}

module.exports = {
  sendWelcome,
  sendTrialEnding,
  sendSubscriptionConfirmed,
  sendPaymentFailed,
  sendEdgeAlert,
  sendPasswordReset,
  sendAdminInvite,
};
