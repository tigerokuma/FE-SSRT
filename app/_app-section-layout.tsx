import AppShell from "@/components/app-shell";
// If using Clerk/NextAuth later, you can add server checks here.

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
