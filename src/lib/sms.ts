import "server-only";
import { logServerError } from "@/lib/errors";

export async function sendDriverSms(mobile: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const sender = (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_FROM || "").trim();
  if (!sid || !token || !sender || !/^[6-9]\d{9}$/.test(mobile)) return false;

  const params = new URLSearchParams({ To: `+91${mobile}`, Body: body });
  if (sender.startsWith("MG")) params.set("MessagingServiceSid", sender);
  else params.set("From", sender);

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      cache: "no-store",
    });
    if (!response.ok) logServerError("driver-sms", new Error(`Twilio returned ${response.status}`));
    return response.ok;
  } catch (error) {
    logServerError("driver-sms", error);
    return false;
  }
}
