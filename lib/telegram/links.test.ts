import {describe,expect,it} from 'vitest';
import {buildTelegramStartUrl} from './links';
describe('Telegram connection deep link',()=>{it('preserves the complete start payload',()=>expect(buildTelegramStartUrl('letszerodebt_bot','abc_DEF-123')).toBe('https://t.me/letszerodebt_bot?start=abc_DEF-123'))});
