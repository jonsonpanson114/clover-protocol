import fetch from 'node-fetch';

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

    // JSONBin.ioに保存
    await saveToJSONBin(subscription);

    console.log('[Push Subscribe] New subscription added:', subscription.endpoint);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function saveToJSONBin(subscription) {
  const JSONBIN_URL = process.env.JSONBIN_URL;
  const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

  if (!JSONBIN_URL || !JSONBIN_API_KEY) {
    throw new Error('JSONBin configuration missing');
  }

  // 現在のデータを取得
  const currentResponse = await fetch(JSONBIN_URL, {
    headers: {
      'X-Master-Key': JSONBIN_API_KEY
    }
  });

  const currentData = await currentResponse.json();
  const record = currentData.record || { reminders: [], subscriptions: [] };
  const subscriptions = record.subscriptions || [];

  // 重複チェック
  const existingIndex = subscriptions.findIndex(sub => sub.endpoint === subscription.endpoint);

  if (existingIndex === -1) {
    subscriptions.push({ ...subscription, createdAt: Date.now() });
  }

  // 更新 (既存のリマインダーも保持する)
  await fetch(JSONBIN_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_API_KEY
    },
    body: JSON.stringify({ ...record, subscriptions })
  });

  console.log('[Push Subscribe] Saved to JSONBin:', subscriptions.length);
}
