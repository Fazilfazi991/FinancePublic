const token=process.env.TELEGRAM_BOT_TOKEN,secret=process.env.TELEGRAM_WEBHOOK_SECRET;
if(!token||!secret)throw new Error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET first.');
const appUrl=(process.env.NEXT_PUBLIC_APP_URL||'https://zorx.online').replace(/\/$/,'');
const response=await fetch(`https://api.telegram.org/bot${token}/setWebhook`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:`${appUrl}/api/telegram/webhook`,secret_token:secret,allowed_updates:['message','callback_query'],drop_pending_updates:false})});
if(!response.ok)throw new Error('Telegram rejected the webhook configuration.');
const result=await response.json();if(!result.ok)throw new Error('Telegram webhook configuration failed.');
console.log('Telegram webhook configured successfully.');
