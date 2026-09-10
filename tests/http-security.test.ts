import {describe,expect,it} from 'vitest';
const base=process.env.TEST_BASE_URL;
describe.skipIf(!base)('unauthenticated finance API',()=>{
 for(const path of ['/api/receivables','/api/accounts','/api/debts','/api/transactions','/api/settings','/api/ai/chat','/api/ai/conversations/00000000-0000-0000-0000-000000000000'])it(`rejects GET ${path}`,async()=>expect((await fetch(`${base}${path}`,{cache:'no-store'})).status).toBe(401));
 for(const path of ['/api/admin/overview','/api/admin/users','/api/admin/users/export'])it(`rejects unauthenticated admin GET ${path}`,async()=>expect((await fetch(`${base}${path}`,{cache:'no-store',redirect:'manual'})).status).toBe(401));
 it('rejects receivable mutations',async()=>expect((await fetch(`${base}/api/receivables`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status).toBe(401));
 it('rejects debt payment',async()=>expect((await fetch(`${base}/api/debt-payments`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status).toBe(401));
});
