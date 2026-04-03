# GAS プッシュ通知スケジューラ設定

Vercel Hobby プランでは Cron 実行が 1 日 1 回に制限されます。  
5分ごとにリマインダー通知を送るため、Google Apps Script から `/api/cron/send-reminders` を定期実行します。

## 1. サーバー環境変数

Vercel プロジェクトに以下を設定してください。

- `CRON_SECRET`（必須）
- `GAS_CRON_TOKEN`（任意だが推奨）
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `JSONBIN_URL`
- `JSONBIN_API_KEY`

`GAS_CRON_TOKEN` を未設定の場合は、`CRON_SECRET` が代わりに使われます。

## 2. GAS スクリプト

Apps Script プロジェクトを作成し、次を貼り付けます。

```javascript
function triggerCloverPushCron() {
  var endpoint = "https://clover-protocols-isaka.vercel.app/api/cron/send-reminders";
  var token = PropertiesService.getScriptProperties().getProperty("GAS_CRON_TOKEN");

  if (!token) {
    throw new Error("スクリプトプロパティ GAS_CRON_TOKEN が未設定です");
  }

  var response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      auth_token: token
    }),
    muteHttpExceptions: true
  });

  Logger.log("ステータス: " + response.getResponseCode());
  Logger.log("レスポンス: " + response.getContentText());
}

function testCloverPushCron() {
  triggerCloverPushCron();
}
```

Script Properties には以下を登録してください。

- キー: `GAS_CRON_TOKEN`
- 値: Vercel の `GAS_CRON_TOKEN` と同じ値

## 3. 時間トリガー

Apps Script で次を設定します。

1. トリガーを開く
2. トリガーを追加
3. 関数: `triggerCloverPushCron`
4. イベントのソース: 時間主導型
5. タイマーの種類: 分ベースのタイマー
6. 間隔: 5分ごと

## 4. 正常時レスポンス

送信対象がある場合の例:

```json
{
  "success": true,
  "sentReminders": 1,
  "sentNotifications": 3,
  "remainingReminders": 0
}
```

送信対象がない場合の例:

```json
{
  "success": true,
  "sent": 0
}
```

## 5. 動作確認チェック

- `/api/push/subscribe` に購読情報が 1 件以上ある
- `/api/push/schedule-reminder` にリマインダーが保存される
- GAS 実行ログが `ステータス: 200` になる
- ブラウザ通知権限が `granted` になっている
