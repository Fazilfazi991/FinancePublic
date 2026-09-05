import {describe,expect,it} from 'vitest';
import {friendlyOtpError,normalizeOtp} from './otp';
describe('email OTP helpers',()=>{it('normalizes a pasted code to six digits',()=>expect(normalizeOtp('12 34-5678')).toBe('123456'));it('explains invalid or expired codes',()=>expect(friendlyOtpError('Token has expired')).toContain('incorrect or has expired'));it('explains rate limits',()=>expect(friendlyOtpError('rate limit exceeded')).toContain('Too many attempts'))});
