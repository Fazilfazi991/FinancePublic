export interface OcrLine { text:string; confidence:number; box?:number[][] }
export interface OcrResponse { success:boolean; lines:OcrLine[]; full_text:string; processing_ms:number }
export type PaymentStatus='success'|'failed'|'pending'|'unknown';
export interface ReceiptNormalization { amount:number|null; merchant:string|null; date:string; dateFound:boolean; status:PaymentStatus; reference:string|null; confidence:number; warnings:string[] }
