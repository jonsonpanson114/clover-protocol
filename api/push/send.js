const webpush = require('web-push');
const fs = require('fs').promises;
const path = require('path');

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

    const subscriptions = await getSubscriptions();

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
          if (error.statusCode === 404 || error.statusCode === 410) {
            await removeSubscription(subscription.endpoint);
            console.log('[Push Send] Removed invalid subscription:', subscription.endpoint);
          }
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

async function getSubscriptions() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data', 'subscriptions.json'), 'utf8');
    return JSON.parse(data);
  } catch { return []; }
}

async function removeSubscription(endpoint) {
  const subscriptions = await getSubscriptions();
  const filtered = subscriptions.filter(sub => sub.endpoint !== endpoint);
  const dir = path.join(process.cwd(), 'data');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'subscriptions.json'), JSON.stringify(filtered, null, 2));
}
