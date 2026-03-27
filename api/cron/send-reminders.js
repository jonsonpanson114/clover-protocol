const webpush = require('web-push');
const fs = require('fs').promises;
const path = require('path');

export default async function handler(req, res) {
  // セキュリティチェック
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    console.log('[Cron] Unauthorized access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = Date.now();
    const reminders = await getScheduledReminders();
    const subscriptions = await getSubscriptions();

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

    // 送信する必要のあるリマインダーを抽出（1分以内）
    const remindersToSend = reminders.filter(r =>
      r.targetTime <= now && r.targetTime > now - 60000
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

    // 送信済みリマインダーを削除
    const remainingReminders = reminders.filter(r =>
      !remindersToSend.some(sent => sent.id === r.id)
    );
    await saveScheduledReminders(remainingReminders);

    console.log('[Cron] Completed. Sent:', sentCount, 'Remaining:', remainingReminders.length);

    return res.status(200).json({ success: true, sent: remindersToSend.length });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getScheduledReminders() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data', 'scheduled-reminders.json'), 'utf8');
    return JSON.parse(data);
  } catch { return []; }
}

async function saveScheduledReminders(reminders) {
  const dir = path.join(process.cwd(), 'data');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'scheduled-reminders.json'), JSON.stringify(reminders, null, 2));
}

async function getSubscriptions() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data', 'subscriptions.json'), 'utf8');
    return JSON.parse(data);
  } catch { return []; }
}
