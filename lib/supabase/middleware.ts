import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from './config';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (values) => {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  }});
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const publicPath = path.startsWith('/auth');
  if (!user && !publicPath && !path.startsWith('/api/')) {
    const url = request.nextUrl.clone(); url.pathname = '/auth'; url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }
  if (user && path === '/auth') return NextResponse.redirect(new URL('/', request.url));
  return response;
}
