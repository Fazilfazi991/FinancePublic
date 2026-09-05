import type { QuickEntryDraft } from '@/lib/quick-entry/parser';
export interface TelegramUser { id:number; username?:string }
export interface TelegramPhoto { file_id:string; file_unique_id:string; file_size?:number; width:number; height:number }
export interface TelegramDocument { file_id:string; file_unique_id:string; file_size?:number; mime_type?:string; file_name?:string }
export interface TelegramMessage { message_id:number; text?:string; caption?:string; photo?:TelegramPhoto[]; document?:TelegramDocument; chat:{id:number}; from?:TelegramUser }
export interface TelegramCallback { id:string; data?:string; from:TelegramUser; message?:TelegramMessage }
export interface TelegramUpdate { update_id:number; message?:TelegramMessage; callback_query?:TelegramCallback }
export interface StoredDraft { id:string; user_id:string; telegram_chat_id:number; draft:QuickEntryDraft; status:string; expires_at:string }
