import AppShell from "@/components/app-shell";
import { auth } from "@clerk/nextjs/server";

export default async function AppSectionLayout({ children }: {children: React.ReactNode}) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) redirectToSignIn({ returnBackUrl: "/project" });

  return <AppShell>{children}</AppShell>;   // ✅ the only place you mount the shell
}
