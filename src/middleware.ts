import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const AUTH_REQUIRED_PREFIXES = ['/postar', '/perfil', '/mensagens'];
const AUTH_GUEST_ONLY_PREFIXES = ['/login', '/cadastro'];

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
}

export async function middleware(request: NextRequest) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fjtbdoeahdtellzbxpsy.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_3TfAipTG33KDBTbsgzP9oQ_aDipKcny';

  const { pathname } = request.nextUrl;
  const hasCookie = hasSupabaseAuthCookie(request);
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRequired = AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isGuestOnly = AUTH_GUEST_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Saída imediata sem chamada de rede quando não há cookie de sessão Supabase
  if (!hasCookie) {
    if (isAdminRoute || isAuthRequired) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/feed', request.url));
    }
  }

  if (isAuthRequired && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestOnly && user) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/postar/:path*',
    '/perfil/:path*',
    '/mensagens/:path*',
    '/login',
    '/cadastro',
  ],
};
