# GAS Push Scheduler Setup

Vercel Hobby plan only supports daily cron.  
To send reminders every 5 minutes, trigger `/api/cron/send-reminders` from Google Apps Script.

## 1. Server Env

Set these in Vercel project env:

- `CRON_SECRET` (required)
- `GAS_CRON_TOKEN` (optional, recommended)
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `JSONBIN_URL`
- `JSONBIN_API_KEY`

`GAS_CRON_TOKEN` is used by GAS. If omitted, `CRON_SECRET` is used.

## 2. GAS Script

Create a new Apps Script project and add:

```javascript
function triggerCloverPushCron() {
  const endpoint = "https://clover-protocols-isaka.vercel.app/api/cron/send-reminders";
  const token = PropertiesService.getScriptProperties().getProperty("GAS_CRON_TOKEN");

  const response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ auth_token: token }),
    muteHttpExceptions: true
  });

  Logger.log("Status: " + response.getResponseCode());
  Logger.log("Body: " + response.getContentText());
}
```

Then set Script Property:

- Key: `GAS_CRON_TOKEN`
- Value: same value as Vercel `GAS_CRON_TOKEN`

## 3. Time Trigger

In Apps Script:

1. Triggers
2. Add Trigger
3. Function: `triggerCloverPushCron`
4. Event source: Time-driven
5. Type: Minutes timer
6. Interval: Every 5 minutes

## 4. Expected Response

Success response looks like:

```json
{
  "success": true,
  "sentReminders": 1,
  "sentNotifications": 3,
  "remainingReminders": 0
}
```

If there are no due reminders:

```json
{
  "success": true,
  "sent": 0
}
```

## 5. Quick Checks

- `/api/push/subscribe` receives at least one subscription.
- `/api/push/schedule-reminder` stores reminders.
- GAS execution logs show `Status: 200`.
- Browser notification permission is `granted`.
