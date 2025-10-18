// app/(auth)/sign-up/[[...rest]]/page.tsx
'use client'

import Image from 'next/image'
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="h-[100dvh] w-full overflow-hidden">
      <div className="flex h-full w-full">
        {/* LEFT — marketing panel */}
        <aside
          className="flex min-w-0 flex-col gap-12 p-12 text-white flex-[7]"
          style={{ background: 'linear-gradient(90deg, #4B0082 0%, #10001C 100%)' }}
        >
          <div className="flex items-center gap-3">
            <Image src="/deply-mark.svg" alt="Deply" width={56} height={56} priority />
            <span className="text-2xl font-semibold">Deply</span>
          </div>

          <h1 className="max-w-[760px] text-[56px] leading-[64px] font-semibold">
            Automatically find and fix OSS risks across your current and future codebase
          </h1>

          <div className="mt-2 flex flex-col gap-8">
            <div>
              <div className="text-[22px] font-semibold">Integrate your projects</div>
              <div className="text-xs font-medium opacity-90">Connect GitHub to import repos</div>
            </div>
            <div>
              <div className="text-[22px] font-semibold">Scan for OSS vulnerabilities</div>
              <div className="text-xs font-medium opacity-90">SBOM + OSV intelligence</div>
            </div>
            <div>
              <div className="text-[22px] font-semibold">Alert current &amp; potential risk</div>
              <div className="text-xs font-medium opacity-90">Graph-aware early warning</div>
            </div>
          </div>
        </aside>

        {/* RIGHT — solid dark background, perfectly centered card */}
        <section className="relative flex min-w-0 flex-[5] items-center justify-center bg-[#0B0E12]">
          <div className="w-full max-w-[520px] px-4">
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/project"
              appearance={{
                layout: {
                  logoPlacement: 'inside',
                  logoImageUrl: '/deply-mark.svg',
                  socialButtonsPlacement: 'top',
                },
                variables: {
                  colorPrimary: '#6366F1',          // Indigo CTAs on dark
                  colorText: '#FFFFFF',
                  colorBackground: '#0F1115',       // Charcoal card
                  colorInputBackground: '#111418',
                  colorInputText: '#FFFFFF',
                  borderRadius: '12px',
                },
                elements: {
                  rootBox: 'w-full mx-auto',
                  card:
                    'rounded-xl border border-white/10 bg-[#0F1115] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-6 sm:p-8',
                  headerTitle: 'text-[24px] sm:text-[28px] leading-9 font-semibold text-white',
                  headerSubtitle: 'text-sm text-gray-400',
                  formFieldLabel: 'text-gray-300',
                  formFieldInput:
                    'h-11 rounded-lg text-[16px] bg-[#111418] border border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                  formButtonPrimary:
                    'h-12 rounded-lg text-[16px] bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#0F1115] transition',
                  socialButtons: 'gap-3 w-full',
                  socialButtonsBlockButton:
                    'h-12 rounded-lg text-[16px] border border-white/10 bg-[#111418] text-white hover:bg-[#151923] data-[provider=github]:bg-[#1F2328] data-[provider=github]:text-white',
                  dividerRow: 'my-4',
                  dividerText: 'text-gray-500',
                  footer: 'mt-2',
                  footerActionText: 'text-sm text-gray-400',
                  footerActionLink: 'text-indigo-400 hover:underline',
                },
              }}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
