'use client';

import Link from "next/link";
import Image from "next/image";
import Button from "./Button";
import BrandWord from "@/components/landing/BrandWord";

export default function NavPrimary() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-800/50 backdrop-blur-xl" style={{ backgroundColor: 'rgba(12, 12, 12, 0.8)' }}>
      <div className="container flex h-16 items-center justify-between">
        {/* Logo + brand */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/deply-mark.svg"
            alt="Deply"
            width={24}
            height={24}
            priority
            className="h-8 w-8"
          />
           <BrandWord variant="shield"  animated={true} className="text-xl leading-none md:text-2xl text-white" />
        </Link>


        {/* CTAs */}
        <div className="flex items-center gap-2">
          {/* goes to your auth, not the dashboard */}
          <Button variant="ghost" as="a" href="/sign-in">Sign in</Button>
          {/* after sign-in you can redirect to /watchlist */}
          <Button as="a" href="/sign-in?redirect=%2Fproject">Start free</Button>
        </div>
      </div>
    </nav>
  );
}
