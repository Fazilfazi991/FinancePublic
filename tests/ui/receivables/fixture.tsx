import React from 'react';
import { createRoot } from 'react-dom/client';
import ReceivablesPage from '../../../app/receivables/page';
import SupportPage from '../../../app/support/page';
import { ReceivablesSummary } from '../../../components/receivables-summary';
import { useFinanceStore } from '../../../lib/store';
import '../../../app/globals.css';
// Isolated browser fixture. No Supabase client or real account/session is used.
const accounts=[{id:'10000000-0000-4000-8001-000000000001',name:'Emirates NBD',currency:'AED',type:'current' as const,openingBalance:20000,institution:'Bank',color:'',createdAt:''},{id:'10000000-0000-4000-8001-000000000002',name:'Savings',currency:'AED',type:'savings' as const,openingBalance:10000,institution:'Bank',color:'',createdAt:''}];
useFinanceStore.setState({accounts,loaded:true});
const view=new URLSearchParams(location.search).get('view');
createRoot(document.getElementById('root')!).render(<div className="app-main min-h-screen pb-28 pt-16 lg:pt-0"><div className="mx-auto max-w-7xl p-4 lg:p-8">{view==='support'?<SupportPage/>:view==='summary'?<ReceivablesSummary/>:<ReceivablesPage/>}</div></div>);
