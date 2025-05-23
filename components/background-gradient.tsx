"use client"

import { cn } from "@/lib/utils"

export function BackgroundGradient() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Main central gradient */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 transform-gpu">
        <div
          className="h-[500px] w-[500px] rounded-full bg-gradient-to-r from-indigo-600 via-blue-700 to-blue-400 opacity-25 blur-[140px]"
        />
      </div>

      {/* Fixed accent points */}
      <div className="absolute right-[20%] top-[25%] -z-10 transform-gpu">
        <div
          className="h-[300px] w-[300px] rounded-full bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 opacity-20 blur-[100px]"
        />
      </div>

      <div className="absolute left-[25%] bottom-[20%] -z-10 transform-gpu">
        <div
          className="h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-800 via-blue-600 to-cyan-500 opacity-20 blur-[120px]"
        />
      </div>

      <div className="absolute left-[15%] top-[15%] -z-10 transform-gpu">
        <div
          className="h-[250px] w-[250px] rounded-full bg-gradient-to-br from-purple-800 via-violet-700 to-indigo-600 opacity-25 blur-[90px]"
        />
      </div>

      {/* Additional scattered gradients */}
      <div className="absolute right-[10%] bottom-[15%] -z-10 transform-gpu">
        <div
          className="h-[200px] w-[200px] rounded-full bg-gradient-to-bl from-blue-600 via-indigo-700 to-violet-800 opacity-15 blur-[80px]"
        />
      </div>

      <div className="absolute right-[35%] top-[10%] -z-10 transform-gpu">
        <div
          className="h-[180px] w-[180px] rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 opacity-20 blur-[75px]"
        />
      </div>

      <div className="absolute left-[40%] top-[30%] -z-10 transform-gpu">
        <div
          className="h-[220px] w-[220px] rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 opacity-15 blur-[85px]"
        />
      </div>

      <div className="absolute left-[5%] bottom-[35%] -z-10 transform-gpu">
        <div
          className="h-[160px] w-[160px] rounded-full bg-gradient-to-tr from-violet-700 to-purple-800 opacity-20 blur-[70px]"
        />
      </div>

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.025] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
} 