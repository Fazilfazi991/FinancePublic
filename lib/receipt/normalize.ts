import type { OcrLine,PaymentStatus,ReceiptNormalization } from './types';
const money=/\b(?:INR|RS\.?|₹)?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\b/i;
const success=/\b(paid successfully|payment successful|transaction successful|paid|sent|completed)\b/i;
const failed=/\b(failed|declined|unsuccessful|cancelled)\b/i;
const pending=/\b(pending|processing)\b/i;
const total=/\b(grand total|amount paid|net amount|total)\b/i;
const excluded=/\b(subtotal|tax|discount|change)\b/i;
const merchant=/\b(?:paid to|merchant|to)\s*[:\-]?\s*(.+)$/i;
const reference=/\b(?:upi transaction id|utr|reference(?: number)?|transaction id)\s*[:#\-]?\s*([a-z0-9-]{6,})/i;
function amountFrom(text:string){const match=text.match(money);if(!match)return null;const value=Number(match[1].replaceAll(',',''));return Number.isFinite(value)&&value>0?value:null}
function isoDate(text:string){let m=text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);if(m)return `${m[1]}-${m[2]}-${m[3]}`;m=text.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})\b/);if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;m=text.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(20\d{2})\b/i);if(!m)return null;const month=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[2].slice(0,3).toLowerCase())+1;return `${m[3]}-${String(month).padStart(2,'0')}-${m[1].padStart(2,'0')}`}
export function normalizeReceipt(lines:OcrLine[],today:string):ReceiptNormalization{
 const texts=lines.map(line=>line.text.trim()).filter(Boolean);const full=texts.join('\n');let status:PaymentStatus=failed.test(full)?'failed':pending.test(full)?'pending':success.test(full)?'success':'unknown';
 const preferred=texts.filter(text=>total.test(text)&&!excluded.test(text)).map(amountFrom).find((value):value is number=>value!==null);const currencyCandidates=texts.filter(text=>/(?:₹|\bINR\b|\bRS\.?\s)/i.test(text)&&!excluded.test(text)&&!reference.test(text)).map(amountFrom).filter((value):value is number=>value!==null);const candidates=texts.filter(text=>!excluded.test(text)&&!reference.test(text)&&!isoDate(text)).map(amountFrom).filter((value):value is number=>value!==null);const amount=preferred??currencyCandidates[0]??(candidates.length?Math.max(...candidates):null);
 const merchantName=texts.map(text=>text.match(merchant)?.[1]?.trim()).find(value=>value&&value.length>1)??texts.find(text=>/restaurant|cafe|store|market|pharmacy|fuel|amazon|uber/i.test(text))??null;
 const foundDate=texts.map(isoDate).find((value):value is string=>Boolean(value))??null;const ref=full.match(reference)?.[1]??null;const confidence=lines.length?lines.reduce((sum,line)=>sum+line.confidence,0)/lines.length:0;const warnings:string[]=[];if(!foundDate)warnings.push('Date not found; using today.');if(confidence<.75)warnings.push('Please review carefully.');
 if(status==='unknown')warnings.push('Payment status not found; please review carefully.');return {amount,merchant:merchantName,date:foundDate??today,dateFound:Boolean(foundDate),status,reference:ref,confidence,warnings};
}
