'use client'

import Link from 'next/link'
import Image from 'next/image'
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="h-[100dvh] w-full overflow-hidden">
      <div className="flex h-full w-full">
        <aside
          className="flex min-w-0 flex-col gap-14 p-12 text-white flex-[7]"
          style={{ background: 'linear-gradient(90deg, #4B0082 0%, #10001C 100%)' }}
        >
          <div className="flex items-center gap-3">
            <Image src="/deply-mark.svg" alt="Deply" width={56} height={56} priority />
            <span className="text-2xl font-semibold">Deply</span>
          </div>

          <h1 className="max-w-[760px] text-[56px] leading-[64px] font-semibold">
            Automatically find and fix OSS risks across your current and future codebase
          </h1>

          <div className="mt-6 flex flex-col gap-10">
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

        <section className="flex min-w-0 flex-[5] items-center justify-center bg-[#FAFAFA]">
          <div className="w-[620px] max-w-[92vw]">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 md:p-8">
              <h2 className="mb-1 text-[32px] font-semibold leading-10 text-black">Create your account</h2>
              <p className="mb-6 text-sm text-gray-600">No credit card required</p>

              <SignUp
                path="/sign-up"
                routing="path"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/"
                appearance={{
                  layout: { logoPlacement: 'none', socialButtonsPlacement: 'bottom' },
                  variables: {
                    colorPrimary: '#4B0082',
                    colorText: '#111111',
                    colorInputBackground: '#FFFFFF',
                    colorInputText: '#111111',
                    colorBackground: 'transparent',
                    borderRadius: '12px',
                  },
                  elements: {
                    rootBox: 'w-full',
                    card: 'bg-transparent shadow-none border-0 p-0',
                    header: 'hidden',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',

                    form: 'w-full',
                    formField: 'w-full',
                    formFieldInput: 'h-11 rounded-lg text-[16px] border-[#E5E7EB]',
                    formButtonPrimary: 'h-14 rounded-lg text-[16px] bg-[#111] hover:opacity-90',

                    socialButtons: 'gap-3 w-full',
                    socialButtonsBlockButton:
                      'h-14 rounded-lg text-[16px] border border-[#E5E7EB] data-[provider=github]:bg-[#1F2328] data-[provider=github]:text-white',
                    socialButtonsProviderIcon__github: 'w-5 h-5',
                    socialButtonsProviderIcon__google: 'w-5 h-5',
                    dividerRow: 'my-4',
                    dividerText: 'text-gray-500',

                    footer: 'hidden',
                  },
                }}
              />

              <p className="mt-4 text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/sign-in" className="font-medium text-[#4B0082] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
