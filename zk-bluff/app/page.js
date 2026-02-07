"use client";
import Link from "next/link";
import Navigation from "@/components/ui/navigation";
import BubbleBackground from "@/components/ui/bubble-background";
import { CircleQuestionMarkIcon, MoveRightIcon } from 'lucide-react';

export default function Home() {
  return (

      <main className="flex flex-col relative h-full overflow-hidden bg-transparent select-none">
        {/* previous background before initial change*/}
        {/* min-w-screen bg-linear-to-tl/increasing from-[#0F6987] to-[#604ce0] */}
        <div className="absolute inset-0 z-0">
          <BubbleBackground/>
        </div>
          <Navigation>
          </Navigation>
        <div className="relative z-10 w-screen h-screen flex flex-col justify-center items-center grow text-center">
          <h1 className="pb-5 font-bold text-4xl sm:text-6xl lg:text-7xl text-white">
            WELCOME TO ZK-BLUFF
          </h1>
          <h2 className="pb-10 font-semibold text-xs sm:text-xl md:text-3xl text-gray-100">
            Immerse yourself to an anti-cheating bluff game
          </h2>

            <div className="flex flex-col sm:flex-row items-center justify-center text-white">
              <Link href="/game-rules" className="flex p-3 font-bold text-lg sm:text-2xl bg-[#F30000]/60 mx-10 rounded-3xl hover:scale-110">
                <CircleQuestionMarkIcon className="mr-2 size-6 md:size-8"></CircleQuestionMarkIcon>
                How To Play
              </Link>
              <Link href="/game-mode" className="flex items-center justify-center p-2 font-bold text-lg sm:text-2xl mx-10 hover:scale-110">
                Create Game
                <MoveRightIcon className="ml-3 size-6 md:size-8"></MoveRightIcon>
              </Link> 
            </div>
          </div>
      </main>
  );
}