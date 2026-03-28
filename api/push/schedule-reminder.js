// Node.jsでfetchを使うためのpolyfill
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { reminder } = req.body;

    if (!reminder || !reminder.id || !reminder.missionTitle || !reminder.targetTime) {
      return res.status(400).json({ error: 'Invalid reminder data' });
    }

    // JSONBin.ioに保存
    await saveToJSONBin(reminder);

    console.log('[Push Schedule] Reminder scheduled:', reminder.id, 'for', new Date(reminder.targetTime).toISOString());

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Push Schedule] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function saveToJSONBin(reminder) {
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
  const reminders = currentData.record?.reminders || [];

  // 追加
  reminders.push({ ...reminder, scheduledAt: Date.now() });

  // 更新
  await fetch(JSONBIN_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_API_KEY
    },
    body: JSON.stringify({ reminders })
  });

  console.log('[Push Schedule] Saved to JSONBin:', reminders.length);
}
