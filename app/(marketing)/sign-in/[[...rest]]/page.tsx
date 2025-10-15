// app/(auth)/sign-in/[[...rest]]/page.tsx
'use client'

import Image from 'next/image'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="h-[100dvh] w-full overflow-hidden">
      <div className="flex h-full w-full">
        {/* LEFT */}
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

        {/* RIGHT — perfectly centered card on a dark background */}
        <section className="grid min-w-0 flex-[5] place-items-center" style={{ backgroundColor: 'rgb(12, 12, 12)' }}>
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"              // <-- makes the "Create one" link appear
            fallbackRedirectUrl="/project"
            appearance={{
              layout: {
                logoPlacement: 'inside',
                logoImageUrl: '/deply-mark.svg',
                socialButtonsPlacement: 'top',
              },
              variables: {
                colorPrimary: 'rgb(84, 0, 250)',
                colorText: '#FFFFFF',
                colorBackground: 'rgb(18, 18, 18)',
                colorInputBackground: 'rgb(12, 12, 12)',
                colorInputText: '#FFFFFF',
                borderRadius: '12px',
              },
              elements: {
                rootBox: 'w-[520px] max-w-[92vw]',
                card: 'rounded-xl border border-[#2A2A2A] shadow-lg p-8',
                headerTitle: 'text-[28px] leading-9 font-semibold text-white',
                headerSubtitle: 'text-sm text-gray-300',
                formFieldInput: 'h-11 rounded-lg text-[16px] border-[#2A2A2A] text-white',
                formButtonPrimary: 'h-12 rounded-lg text-[16px] text-white',
                socialButtons: 'gap-3 w-full',
                socialButtonsBlockButton:
                  'h-12 rounded-lg text-[16px] border border-[#2A2A2A] text-white hover:bg-[#2A2A2A] data-[provider=github]:bg-[#1F2328] data-[provider=github]:text-white',
                dividerRow: 'my-4',
                dividerText: 'text-gray-400',
                footer: 'mt-2',
                footerActionText: 'text-sm text-gray-300',
                footerActionLink: 'text-[rgb(84,0,250)] hover:underline', // "Create one"
              },
            }}
          />
        </section>
      </div>
    </main>
  )
}
