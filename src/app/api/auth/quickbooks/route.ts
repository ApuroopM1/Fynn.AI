import { NextRequest, NextResponse } from 'next/server';

// Step 1: GET handler - redirects user to Intuit's OAuth login page
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  // If this is the callback from Intuit (has 'code' param)
  const code = searchParams.get('code');
  const realmId = searchParams.get('realmId');

  if (code && realmId) {
    // Exchange the authorization code for an access token
    try {
      const tokenResponse = await fetch(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(
              `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
            ).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.QB_REDIRECT_URI || '',
          }),
        }
      );

      const tokens = await tokenResponse.json();

      // Store tokens - for now, return them (later save to Supabase)
     // Redirect to dashboard with token stored in cookie
      const response = NextResponse.redirect(
        new URL('/dashboard', request.url)
      );
      response.cookies.set('qb_access_token', tokens.access_token, {
        httpOnly: true,
        secure: true,
        maxAge: tokens.expires_in || 3600,
        path: '/',
      });
      response.cookies.set('qb_realm_id', realmId, {
        httpOnly: true,
        secure: true,
        maxAge: tokens.expires_in || 3600,
        path: '/',
      });
      return response;
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to exchange token' },
        { status: 500 }
      );
    }
  }

  // If no code, redirect user to Intuit's authorization page
  const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
  authUrl.searchParams.set('client_id', process.env.QB_CLIENT_ID || '');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting');
  authUrl.searchParams.set('redirect_uri', process.env.QB_REDIRECT_URI || '');
  authUrl.searchParams.set('state', 'fynn-qb-connect');

  return NextResponse.redirect(authUrl.toString());
}