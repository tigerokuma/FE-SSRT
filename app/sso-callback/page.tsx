// app/sso-callback/page.tsx
'use client';
import { AuthenticateWithRedirectCallback, useUser } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SsoCallback() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const ran = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (ran.current || !isLoaded) return;
      ran.current = true;

      // Give Clerk a moment to finalize externalAccounts
      await new Promise(r => setTimeout(r, 200));
      await user?.reload();

      const hasVerifiedGithub = user?.externalAccounts?.some((ea: any) => {
        const p = String(ea.provider).toLowerCase();
        const verified = ea?.verification?.status === 'verified' || ea?.approved === true;
        return (p === 'github' || p === 'oauth_github') && verified;
      });

      if (hasVerifiedGithub) {
        // always go through our Next.js proxy (adds Clerk JWT)
        const apiBase = "/api/backend";
        // prefer an endpoint that ingests by clerk_id
        await fetch(`${apiBase}/users/ingest-clerk-github-by-clerk-id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clerk_id: user!.id }),
          credentials: 'include',
        }).catch(() => {});
      }

      router.replace('/settings');
    };
    run();
  }, [isLoaded, user, router]);

  return <AuthenticateWithRedirectCallback />;
}
