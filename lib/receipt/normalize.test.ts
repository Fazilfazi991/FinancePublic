import {describe,expect,it} from 'vitest';
import {normalizeReceipt} from './normalize';
const lines=(...text:string[])=>text.map(value=>({text:value,confidence:.96}));
describe('receipt normalization',()=>{
 it('extracts a successful payment',()=>expect(normalizeReceipt(lines('Payment successful','Paid to ABC Restaurant','INR 500','5 Sep 2026'),'2026-09-06')).toMatchObject({amount:500,merchant:'ABC Restaurant',date:'2026-09-05',status:'success'}));
 it('prioritizes grand total over subtotal and tax',()=>expect(normalizeReceipt(lines('Subtotal 450','Tax 50','Grand Total 500'),'2026-09-05').amount).toBe(500));
 it('detects failed and pending payments',()=>{expect(normalizeReceipt(lines('Payment failed','INR 500'),'2026-09-05').status).toBe('failed');expect(normalizeReceipt(lines('Processing','INR 500'),'2026-09-05').status).toBe('pending')});
 it('defaults a missing date with a warning',()=>{const result=normalizeReceipt(lines('Total 300'),'2026-09-05');expect(result.date).toBe('2026-09-05');expect(result.warnings).toContain('Date not found; using today.')});
 it('extracts UTR without exposing it as the merchant',()=>expect(normalizeReceipt(lines('UTR: ABC123456','Paid to Grocery Store','Rs 300'),'2026-09-05')).toMatchObject({reference:'ABC123456',merchant:'Grocery Store'}));
});
