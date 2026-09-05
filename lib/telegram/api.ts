import {APP_URL} from '@/lib/app-url';

const endpoint=(method:string)=>{const token=process.env.TELEGRAM_BOT_TOKEN;if(!token)throw new Error('Telegram is not configured');return `https://api.telegram.org/bot${token}/${method}`};
async function call(method:string,body:Record<string,unknown>){const response=await fetch(endpoint(method),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(!response.ok){const result=await response.json().catch(()=>null) as {description?:string}|null;throw new Error(`Telegram ${method} failed${result?.description?`: ${result.description}`:''}`)}}
export const sendMessage=(chatId:number,text:string,replyMarkup?:Record<string,unknown>)=>call('sendMessage',{chat_id:chatId,text,...(replyMarkup?{reply_markup:replyMarkup}:{})});
export const answerCallback=(id:string,text?:string)=>call('answerCallbackQuery',{callback_query_id:id,...(text?{text}:{})});
export const editMessage=(chatId:number,messageId:number,text:string)=>call('editMessageText',{chat_id:chatId,message_id:messageId,text});
export const draftKeyboard=(id:string,payment:boolean)=>({inline_keyboard:[[{text:payment?'Confirm Payment':'Confirm',callback_data:`qe_confirm:${id}`}],[{text:'Edit',callback_data:`qe_edit:${id}`},{text:'Cancel',callback_data:`qe_cancel:${id}`}]]});
export const financeKeyboard=()=>({inline_keyboard:[[{text:'Open Finance',url:`${APP_URL}/telegram`}]]});
