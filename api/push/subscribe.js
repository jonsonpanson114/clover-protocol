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
    const { subscription } = req.body;
    if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription' });

    const subscriptions = await getSubscriptions();
    const existingIndex = subscriptions.findIndex(sub => sub.endpoint === subscription.endpoint);

    if (existingIndex === -1) {
      subscriptions.push({ ...subscription, createdAt: Date.now() });
      await saveSubscriptions(subscriptions);
      console.log('[Push Subscribe] New subscription added:', subscription.endpoint);
    } else {
      console.log('[Push Subscribe] Subscription already exists:', subscription.endpoint);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSubscriptions() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data', 'subscriptions.json'), 'utf8');
    return JSON.parse(data);
  } catch { return []; }
}

async function saveSubscriptions(subscriptions) {
  const dir = path.join(process.cwd(), 'data');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'subscriptions.json'), JSON.stringify(subscriptions, null, 2));
  console.log('[Push Subscribe] Subscriptions saved:', subscriptions.length);
}
