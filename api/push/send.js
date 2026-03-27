const webpush = require('web-push');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // JSONBin.ioから購読情報を取得
    const subscriptions = await getSubscriptionsFromJSONBin();

    if (subscriptions.length === 0) {
      console.log('[Push Send] No subscriptions to send to');
      return res.status(200).json({ success: true, sent: 0, total: 0 });
    }

    console.log('[Push Send] Sending to', subscriptions.length, 'subscriptions');

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, JSON.stringify({ title, body }));
          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          console.error('[Push Send] Failed to send to', subscription.endpoint, ':', error.message);
          return { success: false, error: error.message, endpoint: subscription.endpoint };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log('[Push Send] Successfully sent to', successCount, 'of', subscriptions.length);

    return res.status(200).json({ success: true, sent: successCount, total: subscriptions.length });
  } catch (error) {
    console.error('[Push Send] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSubscriptionsFromJSONBin() {
  const JSONBIN_URL = process.env.JSONBIN_URL;
  const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

  if (!JSONBIN_URL || !JSONBIN_API_KEY) {
    console.error('[Push Send] JSONBin configuration missing');
    return [];
  }

  try {
    const response = await fetch(JSONBIN_URL, {
      headers: {
        'X-Master-Key': JSONBIN_API_KEY
      }
    });

    const data = await response.json();
    return data.record?.subscriptions || [];
  } catch (error) {
    console.error('[Push Send] Failed to fetch from JSONBin:', error);
    return [];
  }
}
