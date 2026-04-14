// src/app/(site)/page.js
"use client";

import Hero from "@/components/landing/Hero";
import WhoWeServe from "@/components/landing/WhoWeServe";
import ProblemSolution from "@/components/landing/ProblemSolution";
import Stats from "@/components/landing/Stats";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import FAQ from "@/components/landing/FAQ";
import AppDownload from "@/components/landing/AppDownload";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <WhoWeServe />
      <ProblemSolution />
      <Stats />
      <HowItWorks />
      <Features />
      <FAQ />
      <AppDownload />
    </main>
  );
}
