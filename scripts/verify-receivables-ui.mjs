// Run with the isolated server from serve-receivables-ui.mjs. All API traffic is mocked.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE_PATH||'playwright');
const output=process.env.UI_ARTIFACT_DIR||'node_modules/.cache/receivables-ui';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
const page=await browser.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const account='10000000-0000-4000-8001-000000000001';
const row={id:'10000000-0000-4000-8002-000000000001',user_id:'test',person_name:'Ahmed',original_amount:5000,outstanding_amount:4000,source_account_id:account,transaction_id:'tx1',currency:'AED',lent_date:'2026-09-01',due_date:'2026-09-28',notes:'For moving costs.',created_at:'2026-09-01',updated_at:'2026-09-01',receivable_payments:[{id:'10000000-0000-4000-8003-000000000001',receivable_id:'10000000-0000-4000-8002-000000000001',user_id:'test',transaction_id:'tx2',amount:1000,destination_account_id:account,payment_date:'2026-09-05',notes:'First repayment',created_at:'',updated_at:''}]};
let rows=[structuredClone(row)];let fail=false;const posts=[];
await page.route('**/api/**',async route=>{
 const req=route.request();
 if(req.url().endsWith('/api/receivables')){
  if(req.method()==='POST'){
   const input=req.postDataJSON();posts.push(input);
   if(input.action==='payment_create'){rows[0].outstanding_amount-=input.amount;rows[0].receivable_payments.push({...row.receivable_payments[0],id:input.id,amount:input.amount,payment_date:input.date});}
   if(input.action==='payment_delete'){const pay=rows[0].receivable_payments.find(p=>p.id===input.id);rows[0].outstanding_amount+=pay.amount;rows[0].receivable_payments=rows[0].receivable_payments.filter(p=>p.id!==input.id);}
   await route.fulfill({json:rows[0]});
  }else await route.fulfill({status:fail?503:200,json:fail?{error:{message:'Unable to load. Try again.'}}:rows});
 }else await route.fulfill({json:{}});
});
const url='http://127.0.0.1:4177/tests/ui/receivables/index.html';
let checks=0;
async function verifyLayout(label){
 await page.evaluate(async()=>{await Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>{})))});
 const problems=await page.evaluate(()=>{
  const view=document.documentElement.clientWidth;
  const overflow=[...document.querySelectorAll('main *,[role="dialog"] *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>view+1||r.left< -1)&&getComputedStyle(el).position!=='fixed'}).map(el=>el.tagName+' '+el.textContent?.slice(0,50));
  const small=[...document.querySelectorAll('button,input,select,a[href]')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<43||r.width<43)}).map(el=>el.getAttribute('aria-label')||el.textContent);
  const tinyInputs=[...document.querySelectorAll('input,select,textarea')].filter(el=>view<768&&parseFloat(getComputedStyle(el).fontSize)<16).map(el=>el.tagName);
  return {overflow,small,tinyInputs};
 });
 assert.deepEqual(problems,{overflow:[],small:[],tinyInputs:[]},label);checks++;
 await page.screenshot({path:`${output}/${label}.png`,fullPage:true});
}
try{
 for(const width of (process.env.UI_SKIP_MATRIX?[]:[360,390,430,1280]))for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:900});await page.goto(url);await page.getByRole('heading',{name:'Ahmed',exact:true}).waitFor();
  await page.evaluate(t=>document.documentElement.classList.toggle('dark',t==='dark'),theme);
  await verifyLayout(`receivables-${width}-${theme}`);
  await page.getByRole('button',{name:'Add Money to Receive',exact:true}).click();await page.getByRole('dialog').waitFor();await verifyLayout(`form-${width}-${theme}`);await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.goto(url+'?view=support');await page.getByRole('heading',{name:'Support ZeroDebt'}).waitFor();await page.evaluate(t=>document.documentElement.classList.toggle('dark',t==='dark'),theme);await verifyLayout(`support-${width}-${theme}`);
  const link=page.getByRole('link',{name:/Buy Me a Coffee/});assert.equal(await link.getAttribute('href'),'https://buymeacoffee.com/thameemar');assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
 }
 await page.setViewportSize({width:390,height:844});await page.goto(url);await page.getByRole('heading',{name:'Ahmed',exact:true}).waitFor();
 await page.getByLabel('Search by person').fill('nobody');await page.getByText('No matching receivables.').waitFor();await page.getByLabel('Search by person').fill('Ahmed');checks++;
 await page.getByRole('button',{name:'View',exact:true}).click();await page.getByRole('heading',{name:'Payment history'}).waitFor();await verifyLayout('detail-390-light');await page.getByRole('button',{name:'Edit payment',exact:true}).click();assert.equal(await page.getByLabel('Amount (AED)',{exact:true}).inputValue(),'1000');await verifyLayout('edit-payment-390-light');await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Close',exact:true}).click();checks++;
 await page.getByRole('button',{name:'Record Payment',exact:true}).click();await page.getByRole('button',{name:'Full remaining amount'}).click();assert.equal(await page.getByLabel('Amount (AED)',{exact:true}).inputValue(),'4000');await page.getByLabel('Received Into').selectOption(account);await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('status').filter({hasText:'Fully repaid'}).waitFor();assert.equal(posts.at(-1).amount,4000);checks++;
 await page.locator('select').first().selectOption('Settled');await page.getByRole('heading',{name:'Ahmed',exact:true}).waitFor();checks++;
 rows=[];await page.reload();await page.getByRole('heading',{name:"You don't have any money to receive yet."}).waitFor();await verifyLayout('empty-390-light');
 fail=true;await page.reload();await page.getByRole('button',{name:'Retry'}).waitFor();fail=false;await page.getByRole('button',{name:'Retry'}).click();await page.getByRole('heading',{name:"You don't have any money to receive yet."}).waitFor();checks++;
 assert.deepEqual(errors,[]);console.log(JSON.stringify({checks,passed:checks,failed:0,browserErrors:errors,artifacts:output},null,2));
}catch(error){console.log(await page.locator("body").innerText());throw error;}finally{await browser.close()}
