'use client';
import { useEffect,useState } from 'react';import { GoogleAnalytics } from '@next/third-parties/google';
export function AnalyticsConsent({measurementId,required}:{measurementId?:string;required:boolean}){const[allowed,setAllowed]=useState(!required);useEffect(()=>{if(required)setAllowed(localStorage.getItem('zerodebt.analytics-consent')==='granted')},[required]);if(!measurementId||!allowed)return null;return <GoogleAnalytics gaId={measurementId}/>}
