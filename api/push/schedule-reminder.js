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
    const { reminder } = req.body;

    if (!reminder || !reminder.id || !reminder.missionTitle || !reminder.targetTime) {
      return res.status(400).json({ error: 'Invalid reminder data' });
    }

    const reminders = await getScheduledReminders();
    reminders.push({ ...reminder, scheduledAt: Date.now() });
    await saveScheduledReminders(reminders);

    console.log('[Push Schedule] Reminder scheduled:', reminder.id, 'for', new Date(reminder.targetTime).toISOString());

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Push Schedule] Error:', error);
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
  console.log('[Push Schedule] Total reminders saved:', reminders.length);
}
