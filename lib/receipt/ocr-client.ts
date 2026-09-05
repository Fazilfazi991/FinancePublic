import type { OcrResponse } from './types';
const MAX_IMAGE_BYTES=10*1024*1024;
export class OcrNotConfiguredError extends Error{}
export class OcrUnavailableError extends Error{}
export async function readImage(bytes:ArrayBuffer,mimeType:string):Promise<OcrResponse>{
 const url=process.env.OCR_SERVICE_URL,key=process.env.OCR_SERVICE_API_KEY;if(!url||!key)throw new OcrNotConfiguredError('ocr_not_configured');if(bytes.byteLength>MAX_IMAGE_BYTES)throw new Error('image_too_large');
 const form=new FormData();form.append('image',new Blob([bytes],{type:mimeType}),'telegram-image');
 try{const response=await fetch(`${url.replace(/\/$/,'')}/ocr`,{method:'POST',headers:{authorization:`Bearer ${key}`},body:form,signal:AbortSignal.timeout(Number(process.env.OCR_SERVICE_TIMEOUT_MS??15000))});if(!response.ok)throw new OcrUnavailableError('ocr_unavailable');const result=await response.json() as OcrResponse;if(!result.success||!Array.isArray(result.lines)||result.lines.length>250)throw new OcrUnavailableError('ocr_invalid_response');return result}catch(error){if(error instanceof OcrNotConfiguredError||error instanceof OcrUnavailableError)throw error;throw new OcrUnavailableError('ocr_unavailable')}
}
export {MAX_IMAGE_BYTES};
