import { createHash, timingSafeEqual } from 'node:crypto';
export const hashLinkToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export function validWebhookSecret(received:string|null,expected:string|undefined){if(!received||!expected)return false;const a=Buffer.from(received),b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b)}
export const validDraftCallback=(value:string)=>/^qe_(confirm|edit|cancel):[0-9a-f-]{36}$/i.test(value);
