'use client';

import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {friendlyOtpError} from '@/lib/auth/otp';

const RESEND_SECONDS=60;
export function AuthForm({next='/'}:{next?:string}){
  const[email,setEmail]=useState(''),[submittedEmail,setSubmittedEmail]=useState(''),[linkSentEmail,setLinkSentEmail]=useState(''),[code,setCode]=useState(''),[message,setMessage]=useState(''),[pending,setPending]=useState(false),[cooldown,setCooldown]=useState(0);
  const inputRef=useRef<HTMLInputElement>(null),router=useRouter(),supabase=createClient();
  const otpEnabled=process.env.NEXT_PUBLIC_EMAIL_OTP_ENABLED==='true';
  const googleEnabled=process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED==='true';
  useEffect(()=>{if(!cooldown)return;const timer=setInterval(()=>setCooldown(value=>Math.max(0,value-1)),1000);return()=>clearInterval(timer)},[cooldown]);
  useEffect(()=>{if(submittedEmail)inputRef.current?.focus()},[submittedEmail]);

  const sendCode=async(target:string)=>{
    setPending(true);setMessage('');
    const{error}=await supabase.auth.signInWithOtp({email:target,options:{emailRedirectTo:`${location.origin}/auth/callback?next=${encodeURIComponent(next)}`}});
    if(error)setMessage(error.message.toLowerCase().includes('rate')?'Please wait before requesting another code.':'We could not send a code. Check your email address and connection, then try again.');
    else if(otpEnabled){setSubmittedEmail(target);setCooldown(RESEND_SECONDS)}else{setLinkSentEmail(target);setCooldown(RESEND_SECONDS)}
    setPending(false);
  };
  if(linkSentEmail)return <div className="space-y-5"><div><h2 className="text-xl font-semibold">Check your email</h2><p className="mt-2 text-sm text-muted-foreground">We sent a secure sign-in link to:<br/><strong className="break-all text-foreground">{linkSentEmail}</strong></p></div><Button type="button" variant="outline" className="h-12 w-full" disabled={pending||cooldown>0} onClick={()=>sendCode(linkSentEmail)}>{cooldown?`Resend in ${cooldown}s`:'Resend email'}</Button><Button type="button" variant="ghost" className="h-12 w-full" disabled={pending} onClick={()=>{setLinkSentEmail('');setMessage('')}}>Use another email</Button>{message&&<p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}</div>;
  const request=async(e:React.FormEvent)=>{e.preventDefault();await sendCode(email.trim())};
  const verify=async(e:React.FormEvent)=>{e.preventDefault();if(!/^\d{6}$/.test(code)){setMessage('Enter the complete 6-digit code.');return}setPending(true);setMessage('');const{error}=await supabase.auth.verifyOtp({email:submittedEmail,token:code,type:'email'});if(error){setMessage(friendlyOtpError(error.message));setPending(false);return}router.replace(next);router.refresh()};
  const google=async()=>{setPending(true);setMessage('');const{error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${location.origin}/auth/callback?next=${encodeURIComponent(next)}`}});if(error){setMessage('Google sign-in is not configured or is temporarily unavailable.');setPending(false)}};

  if(submittedEmail)return <div className="space-y-5"><div><h2 className="text-xl font-semibold">Check your email</h2><p className="mt-2 text-sm text-muted-foreground">We sent a 6-digit verification code to<br/><strong className="break-all text-foreground">{submittedEmail}</strong></p></div><form onSubmit={verify} className="space-y-4"><label htmlFor="email-otp" className="sr-only">6-digit verification code</label><Input ref={inputRef} id="email-otp" value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" aria-describedby={message?'otp-message':undefined} className="h-16 text-center text-3xl font-bold tracking-[0.45em] tabular-nums"/><Button className="h-12 w-full" disabled={pending||code.length!==6}>{pending?'Verifying…':'Verify & Continue'}</Button></form><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" disabled={pending||cooldown>0} onClick={()=>sendCode(submittedEmail)}>{cooldown?`Resend in ${cooldown}s`:'Resend code'}</Button><Button type="button" variant="ghost" disabled={pending} onClick={()=>{setSubmittedEmail('');setCode('');setMessage('')}}>Change email</Button></div>{message&&<p id="otp-message" role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}</div>;

  return <div className="space-y-5">{googleEnabled&&<><Button className="h-12 w-full" onClick={google} disabled={pending}>Continue with Google</Button><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border"/>or<span className="h-px flex-1 bg-border"/></div></>}<form onSubmit={request} className="space-y-3"><label htmlFor="email" className="text-sm font-medium">Email address</label><Input id="email" type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="user@example.com" autoComplete="email" required className="h-12"/><Button variant="outline" className="h-12 w-full" disabled={pending}>{pending?(otpEnabled?'Sending code…':'Sending link…'):(otpEnabled?'Send verification code':'Continue with Email')}</Button>{!otpEnabled&&<p className="text-xs text-muted-foreground">We&apos;ll send you a secure sign-in link.</p>}</form>{message&&<p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}</div>;
}
