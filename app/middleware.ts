import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = new URL(req.url)
  const wf = url.searchParams.get('wf')

  // If no toggle param, just continue.
  if (wf !== '1' && wf !== '0') return NextResponse.next()

  // Clean the URL (remove ?wf=) after we set/delete the cookie.
  url.searchParams.delete('wf')
  const res = NextResponse.redirect(url)

  if (wf === '1') {
    res.cookies.set('wf', '1', {
      path: '/',
      httpOnly: false,            // keep readable by client if you ever want to check it there
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,  // 30 days (optional)
    })
  } else {
    res.cookies.delete('wf')      // <-- no options here
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
