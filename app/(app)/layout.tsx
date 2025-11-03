// app/(app)/layout.tsx  (SERVER component)
import { auth } from '@clerk/nextjs/server';
import ClientAppShell from '@/components/ClientAppShell';

export default async function AppSectionLayout({ children }: { children: React.ReactNode }) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) redirectToSignIn({ returnBackUrl: '/project' });

  return <ClientAppShell>{children}</ClientAppShell>;
}
