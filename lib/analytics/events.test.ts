import { describe,expect,it } from 'vitest';import { eventSchema,publicEvents,validateMetadata } from './events';
describe('analytics event validation',()=>{
 it('accepts only the documented event taxonomy',()=>{expect(eventSchema.safeParse({eventName:'debt_created',metadata:{source:'manual'}}).success).toBe(true);expect(eventSchema.safeParse({eventName:'made_up_event',metadata:{}}).success).toBe(false)});
 it('rejects user ids and extra top-level fields',()=>expect(eventSchema.safeParse({eventName:'cta_clicked',userId:'victim',metadata:{}}).success).toBe(false));
 it('rejects PII keys and values',()=>{expect(()=>validateMetadata('cta_clicked',{email:'person@example.com'})).toThrow();expect(()=>validateMetadata('cta_clicked',{cta_id:'person@example.com'})).toThrow();expect(()=>validateMetadata('transaction_created',{amount:100})).toThrow()});
 it('allows only approved anonymous events',()=>{expect(publicEvents.has('cta_clicked')).toBe(true);expect(publicEvents.has('transaction_created')).toBe(false)});
 it('requires bounded scalar metadata',()=>{expect(eventSchema.safeParse({eventName:'cta_clicked',metadata:{cta_id:{nested:true}}}).success).toBe(false);expect(eventSchema.safeParse({eventName:'cta_clicked',metadata:{cta_id:'x'.repeat(121)}}).success).toBe(false)});
});
