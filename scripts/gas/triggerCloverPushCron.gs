function triggerCloverPushCron() {
  var endpoint = "https://clover-protocols-isaka.vercel.app/api/cron/send-reminders";
  var token = PropertiesService.getScriptProperties().getProperty("GAS_CRON_TOKEN");

  if (!token) {
    throw new Error("Missing Script Property: GAS_CRON_TOKEN");
  }

  var response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      auth_token: token
    }),
    muteHttpExceptions: true
  });

  Logger.log("Status: " + response.getResponseCode());
  Logger.log("Body: " + response.getContentText());
}

function testCloverPushCron() {
  triggerCloverPushCron();
}
