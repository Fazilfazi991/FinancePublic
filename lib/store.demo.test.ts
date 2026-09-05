import {beforeEach,describe,expect,it,vi} from 'vitest';
import {useFinanceStore} from './store';

const empty={accounts:[],transactions:[],debts:[],goals:[],expenses:[],incomes:[],projects:[]};
describe('authenticated demo hydration',()=>{
  beforeEach(()=>{useFinanceStore.setState({...empty,demoMode:false,loaded:true});vi.restoreAllMocks()});
  it('loads an empty user demo and hydrates immediately from the server workspace',async()=>{const workspace={...empty,accounts:[{id:'server-demo',isDemo:true}]};const fetchMock=vi.fn().mockResolvedValueOnce({ok:true}).mockResolvedValueOnce({ok:true,json:async()=>workspace});vi.stubGlobal('fetch',fetchMock);expect(await useFinanceStore.getState().loadDemoData()).toBe(true);expect(useFinanceStore.getState().accounts).toHaveLength(1);expect(useFinanceStore.getState().demoMode).toBe(true);expect(fetchMock).toHaveBeenNthCalledWith(2,'/api/workspace',{cache:'no-store'})});
  it('does not call the demo API when real data exists',async()=>{useFinanceStore.setState({accounts:[{id:'real'} as never]});const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);expect(await useFinanceStore.getState().loadDemoData()).toBe(false);expect(fetchMock).not.toHaveBeenCalled()});
});
