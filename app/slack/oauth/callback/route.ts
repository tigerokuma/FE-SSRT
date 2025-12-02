// app/slack/oauth/callback/route.ts
// This route handles Slack OAuth callbacks from Slack
// It's outside the (app) folder so it's not protected by authentication
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND = (process.env.BACKEND_API_BASE || 'http://localhost:3001' || 'https://be-ssrt-2.onrender.com').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json(
      { error: 'Missing authorization code' },
      { status: 400 }
    );
  }

  // Build the backend URL with query parameters
  const backendUrl = new URL(`${BACKEND}/slack/oauth/callback`);
  searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  try {
    // Call the backend OAuth callback endpoint
    // The backend will handle the OAuth flow and redirect to the frontend
    const backendResponse = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'manual', // Don't follow redirects, we'll handle it
    });

    // If the backend returns a redirect (302/301), extract the Location header
    if (backendResponse.status >= 300 && backendResponse.status < 400) {
      const location = backendResponse.headers.get('location');
      if (location) {
        // Redirect to the location provided by the backend
        return NextResponse.redirect(location);
      }
    }

    // If it's not a redirect, return the response
    const contentType = backendResponse.headers.get('content-type') || 'application/json';
    const body = await backendResponse.text();

    return new NextResponse(body, {
      status: backendResponse.status,
      headers: {
        'content-type': contentType,
      },
    });
  } catch (error) {
    console.error('Slack OAuth callback error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process OAuth callback',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

