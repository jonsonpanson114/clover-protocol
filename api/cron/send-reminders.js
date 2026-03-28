import webpush from 'web-push';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // セキュリティチェック
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    console.log('[Cron] Unauthorized access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = Date.now();

    // JSONBin.ioからデータを取得
    const data = await getDataFromJSONBin();
    const reminders = data.reminders || [];
    const subscriptions = data.subscriptions || [];

    console.log('[Cron] Checking reminders at', new Date(now).toISOString());
    console.log('[Cron] Total reminders:', reminders.length, 'Total subscriptions:', subscriptions.length);

    if (subscriptions.length === 0) {
      console.log('[Cron] No subscriptions, skipping');
      return res.status(200).json({ success: true, sent: 0 });
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // 送信する必要のあるリマインドを抽出（1時間以内且つ過去のもの）
    const remindersToSend = reminders.filter(r =>
      r.targetTime <= now && r.targetTime > now - 3600000
    );

    console.log('[Cron] Reminders to send:', remindersToSend.length);

    if (remindersToSend.length === 0) {
      return res.status(200).json({ success: true, sent: 0 });
    }

    // Push通知を送信
    let sentCount = 0;
    for (const reminder of remindersToSend) {
      const payload = JSON.stringify({
        title: 'CLOVER PROTOCOL',
        body: `指令の時間だぜ: ${reminder.missionTitle}`,
        data: { reminderId: reminder.id }
      });

      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(subscription, payload);
          sentCount++;
        } catch (error) {
          console.error('[Cron] Failed to send to', subscription.endpoint, ':', error.message);
        }
      }

      console.log('[Cron] Sent reminder:', reminder.id);
    }

    // 全てのリマインダーから送信済みのものを除外
    const remainingReminders = reminders.filter(r =>
      !remindersToSend.some(sent => sent.id === r.id)
    );

    // JSONBin.ioを更新 (全データを保持)
    await saveToJSONBin({ reminders: remainingReminders, subscriptions });

    console.log('[Cron] Completed. Sent:', sentCount, 'Remaining:', remainingReminders.length);

    return res.status(200).json({ success: true, sent: remindersToSend.length });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getDataFromJSONBin() {
  const JSONBIN_URL = process.env.JSONBIN_URL;
  const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

  if (!JSONBIN_URL || !JSONBIN_API_KEY) {
    console.error('[Cron] JSONBin configuration missing');
    return { reminders: [], subscriptions: [] };
  }

  try {
    const response = await fetch(JSONBIN_URL, {
      headers: {
        'X-Master-Key': JSONBIN_API_KEY
      }
    });

    const data = await response.json();
    return data.record || { reminders: [], subscriptions: [] };
  } catch (error) {
    console.error('[Cron] Failed to fetch from JSONBin:', error);
    return { reminders: [], subscriptions: [] };
  }
}

async function saveToJSONBin(data) {
  const JSONBIN_URL = process.env.JSONBIN_URL;
  const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

  await fetch(JSONBIN_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_API_KEY
    },
    body: JSON.stringify(data)
  });

  console.log('[Cron] Saved to JSONBin');
}
