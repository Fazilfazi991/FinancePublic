const token=process.env.TELEGRAM_BOT_TOKEN,secret=process.env.TELEGRAM_WEBHOOK_SECRET;
if(!token||!secret)throw new Error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET first.');
const appUrl=(process.env.NEXT_PUBLIC_APP_URL||'https://zorx.online').replace(/\/$/,'');
const api=async(method,options)=>{const response=await fetch(`https://api.telegram.org/bot${token}/${method}`,options);if(!response.ok)throw new Error(`Telegram rejected ${method}.`);const result=await response.json();if(!result.ok)throw new Error(`Telegram ${method} failed.`);return result.result};
const health=info=>({url:info.url||'',pending_update_count:info.pending_update_count??0,last_error_message:info.last_error_message||null});
const bot=await api('getMe');
const before=await api('getWebhookInfo');
await api('setWebhook',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:`${appUrl}/api/telegram/webhook`,secret_token:secret,allowed_updates:['message','callback_query'],drop_pending_updates:false})});
const after=await api('getWebhookInfo');
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,secretKey=process.env.SUPABASE_SECRET_KEY;
let database={configured:Boolean(supabaseUrl&&secretKey)};
if(supabaseUrl&&secretKey){const response=await fetch(`${supabaseUrl}/rest/v1/telegram_updates?select=telegram_update_id&limit=0`,{headers:{apikey:secretKey,authorization:`Bearer ${secretKey}`}});database={configured:true,status:response.status,ok:response.ok};if(!response.ok){const error=await response.json().catch(()=>({}));database.code=error.code||null;database.message=error.message||null}}
console.log(JSON.stringify({bot:{id:bot.id,username:bot.username,is_bot:bot.is_bot},before:health(before),after:health(after),database},null,2));
