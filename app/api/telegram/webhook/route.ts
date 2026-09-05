import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleTelegramUpdate } from '@/lib/telegram/bot';
import { validWebhookSecret } from '@/lib/telegram/security';
const user=z.object({id:z.number().int(),username:z.string().max(100).optional()});
const message=z.object({message_id:z.number().int(),text:z.string().max(4096).optional(),chat:z.object({id:z.number().int()}),from:user.optional()});
const updateSchema=z.object({update_id:z.number().int(),message:message.optional(),callback_query:z.object({id:z.string().max(100),data:z.string().max(64).optional(),from:user,message:message.optional()}).optional()});
export async function POST(request:Request){if(!validWebhookSecret(request.headers.get('x-telegram-bot-api-secret-token'),process.env.TELEGRAM_WEBHOOK_SECRET))return NextResponse.json({ok:false},{status:401});try{const update=updateSchema.parse(await request.json());await handleTelegramUpdate(update);return NextResponse.json({ok:true})}catch(error){console.error('Telegram webhook rejected an update',{error:error instanceof Error?error.message:'unknown'});return NextResponse.json({ok:false},{status:400})}}
