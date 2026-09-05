import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleTelegramUpdate } from '@/lib/telegram/bot';
import { validWebhookSecret } from '@/lib/telegram/security';
const user=z.object({id:z.number().int(),username:z.string().max(100).optional()});
const photo=z.object({file_id:z.string().max(200),file_unique_id:z.string().max(200),file_size:z.number().int().optional(),width:z.number().int(),height:z.number().int()});
const document=z.object({file_id:z.string().max(200),file_unique_id:z.string().max(200),file_size:z.number().int().optional(),mime_type:z.string().max(100).optional(),file_name:z.string().max(255).optional()});
const message=z.object({message_id:z.number().int(),text:z.string().max(4096).optional(),caption:z.string().max(1024).optional(),photo:z.array(photo).max(10).optional(),document:document.optional(),chat:z.object({id:z.number().int()}),from:user.optional()});
const updateSchema=z.object({update_id:z.number().int(),message:message.optional(),callback_query:z.object({id:z.string().max(100),data:z.string().max(64).optional(),from:user,message:message.optional()}).optional()});
export async function POST(request:Request){if(!validWebhookSecret(request.headers.get('x-telegram-bot-api-secret-token'),process.env.TELEGRAM_WEBHOOK_SECRET))return NextResponse.json({ok:false},{status:401});try{const update=updateSchema.parse(await request.json());await handleTelegramUpdate(update);return NextResponse.json({ok:true})}catch(error){console.error('Telegram webhook rejected an update',{error:error instanceof Error?error.message:'unknown'});return NextResponse.json({ok:false},{status:400})}}
