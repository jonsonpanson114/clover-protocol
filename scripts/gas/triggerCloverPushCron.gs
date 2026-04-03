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
