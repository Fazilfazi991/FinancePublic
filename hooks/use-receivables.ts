"use client";
import { useCallback, useEffect, useState } from 'react';
import type { Receivable } from '@/lib/receivables';
export function useReceivables() {
  const [items,setItems]=useState<Receivable[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const reload=useCallback(async()=>{
    setLoading(true);setError('');
    try {
      const response=await fetch('/api/receivables',{cache:'no-store'});
      const result=await response.json();
      if(!response.ok)throw new Error(result?.error?.message||'Unable to load Money to Receive.');
      setItems(result);
    } catch(caught){setError(caught instanceof Error?caught.message:'Unable to load Money to Receive.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void reload()},[reload]);
  return {items,loading,error,reload};
}
