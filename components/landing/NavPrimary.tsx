'use client';

import Link from "next/link";
import Image from "next/image";
import Button from "./Button";
import BrandWord from "@/components/landing/BrandWord";

export default function NavPrimary() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#E5E7EB] bg-white/90 backdrop-blur-md">
      <div className="container flex h-[80px] items-center justify-between">
        {/* Logo + brand */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/deply-mark.svg"
            alt="Deply"
            width={28}
            height={28}
            priority
            className="h-12 w-12"
          />
           <BrandWord variant="shield"  animated={true} className="text-[28px] leading-none md:text-[32px]" />
        </Link>

        {/* Center links (hide on small) */}
        <div className="hidden items-center gap-6 md:flex">
          <a className="text-base text-black" href="#product">Product</a>
          <a className="text-base text-black" href="#docs">Docs</a>
          <a className="text-base text-black" href="#pricing">Pricing</a>
          <a className="text-base text-black" href="#blog">Blog</a>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          {/* goes to your auth, not the dashboard */}
          <Button variant="ghost" as="a" href="/sign-in">Sign in</Button>
          {/* after sign-in you can redirect to /watchlist */}
          <Button as="a" href="/sign-in?redirect=%2Fwatchlist">Start free</Button>
        </div>
      </div>
    </nav>
  );
}
