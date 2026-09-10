import { z } from 'zod';

export const EVENT_NAMES = ["receivable_created","receivable_updated","receivable_deleted","receivable_payment_created","receivable_payment_updated","receivable_payment_deleted","support_zero_debt_clicked",'signup_started','signup_completed','email_verified','login_completed','onboarding_completed','cta_clicked','account_created','transaction_created','debt_created','debt_payment_added','goal_created','goal_contribution_added','budget_created','ai_advisor_opened','ai_advisor_message_sent','upgrade_clicked','subscription_started','subscription_cancelled','account_deleted'] as const;
export type EventName = typeof EVENT_NAMES[number];
const piiKey = /(^|_)(email|e_mail|name|full_name|first_name|last_name|phone|mobile|password|token|secret|address|account_number|iban|credential)s?$/i;
const sensitiveValue = /(?:[^@\s]+@[^@\s]+\.[^@\s]+)|(?:\+?\d[\d\s().-]{7,}\d)/;
const metadataAllowlist:Record<EventName,readonly string[]> = {
receivable_created:[],receivable_updated:[],receivable_deleted:[],receivable_payment_created:[],receivable_payment_updated:[],receivable_payment_deleted:[],support_zero_debt_clicked:[],
  signup_started:['method'],signup_completed:['method'],email_verified:[],login_completed:['method'],onboarding_completed:['steps'],cta_clicked:['cta_id','placement'],account_created:['account_type'],transaction_created:['transaction_type','source'],debt_created:['source'],debt_payment_added:['source'],goal_created:['category'],goal_contribution_added:['source'],budget_created:['category'],ai_advisor_opened:['placement'],ai_advisor_message_sent:['conversation_state'],upgrade_clicked:['placement','plan'],subscription_started:['plan'],subscription_cancelled:['plan','reason_code'],account_deleted:['reason_code']
};
export const publicEvents = new Set<EventName>(['signup_started','cta_clicked']);
export const eventSchema = z.object({
  eventName:z.enum(EVENT_NAMES), anonymousId:z.string().regex(/^[A-Za-z0-9_-]{8,80}$/).optional(), sessionId:z.string().regex(/^[A-Za-z0-9_-]{8,80}$/).optional(),
  pagePath:z.string().max(300).regex(/^\/(?!\/)/).optional(), source:z.enum(['app','web','onboarding']).default('app'),
  idempotencyKey:z.string().regex(/^[A-Za-z0-9_-]{8,120}$/).optional(), metadata:z.record(z.string(),z.union([z.string().max(120),z.number().finite(),z.boolean()])).default({})
}).strict();
export function validateMetadata(eventName:EventName, metadata:Record<string,string|number|boolean>) {
  const allowed = new Set(metadataAllowlist[eventName]);
  for (const [key,value] of Object.entries(metadata)) {
    if (!allowed.has(key) || piiKey.test(key) || (typeof value === 'string' && sensitiveValue.test(value))) throw new Error('invalid_metadata');
  }
  return metadata;
}
