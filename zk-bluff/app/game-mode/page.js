"use client"
import { useEffect, useState } from "react";
import { TabletSmartphone, Smartphone, ArrowLeftCircleIcon } from 'lucide-react';
import Link from 'next/link';
import { gameCode } from '@/lib/gamecode';
import { useRouter } from 'next/navigation';
// #28a1e2
// #53e4cc

export default function Home() {
  const [name, setName] = useState("")
  const [nameStatus, setNameStatus] = useState(false)
  const router = useRouter();

  const nameFunc = () => {
    setNameStatus(true);
  }

  const removeNameFunc = () => {
    setNameStatus(false);
  }

  function gameRoom(){
    const code = gameCode();
    localStorage.setItem("zk_user_name", name)
    router.push(`/online/${code}`)
  }
  return (
    <div className="flex min-h-screen items-center overflow-hidden justify-center bg-radial from-[#BA2237] from-30% to-[#261447] select-none">
      <main className="flex flex-col justify-center p-5 sm:p-10 rounded-2xl bg-black/20">
        <Link href="/" className="w-15 h-15 hover:scale-110 justify-center items-center flex">
          <ArrowLeftCircleIcon className="w-10 h-10 text-white"></ArrowLeftCircleIcon>
        </Link>
        {nameStatus && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-white/40 outline-4 outline-white p-8 rounded-2xl text-center max-w-lg flex flex-col items-center space-y-5">
                    <h1 className="text-5xl text-white font-bold">ENTER NAME</h1>
                    <input onChange={(e) => setName(e.target.value)}></input>
                    <input 
                    type="text"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ENTER NAME"
                    className="w-[200] p-4 rounded-xl bg-white/10 border border-white/20 text-white text-xl focus:outline-2 outline-white focus:border-white"
                    />
                    <button onClick={gameRoom} className="mt-5 cursor-pointer text-white text-2xl p-2 font-bold bg-[#F30000]/60 rounded-xl w-[200]">SET NAME</button>
                    <button onClick={removeNameFunc} className="cursor-pointer text-white text-2xl p-2 font-bold bg-[#F30000]/60 rounded-xl w-[200]">BACK BUTTON</button>
                    </div>
                </div>}
        <div>
          <div className="flex flex-row justify-center">
            <h1 className="font-bold text-2xl lg:text-6xl items-center justify-center flex text-white mt-2">
              PICK YOUR GAME MODE:
            </h1>
          </div> 
          <div className="flex flex-row mt-8 justify-center items-center">
            <button onClick={nameFunc} className="hover:scale-105 flex flex-col items-center w-40 h-70 md:h-100 md:w-75 bg-[#53e4cc]/80 mr-5 rounded-3xl shadow-2xl cursor-pointer">
                <TabletSmartphone className="size-8 sm:size-12 mt-5 text-white"/>
                <h3 className="text-lg sm:text-3xl text-white font-bold">
                  Multiple Devices
                </h3>
                <ul className="text-gray-300">
                  3-10 Players
                </ul>
                <div className="mt-5 sm:mt-20 text-white text-left font-bold ml-5 sm:ml-3">
                  <li>
                    Players join the room by a code
                  </li>
                  <li>
                    Every player has their own device
                  </li>
                  <li>
                    AI-Bluff detector
                  </li>
                </div>
            </button>
            <Link href="/singleplayer" className="hover:scale-105 flex flex-col items-center w-40 h-70 md:h-100 md:w-75 bg-[#28a1e2]/80 ml-5 rounded-3xl shadow-2xl">
                <Smartphone className="size-8 sm:size-12 mt-5 text-white"/>
                <h3 className="text-lg sm:text-3xl text-white font-bold">
                  Single Device
                </h3>
                <ul className="text-gray-300">
                  3-8 Players
                </ul>
                <div className="mt-5 sm:mt-20 text-white text-left font-bold ml-5 sm:ml-3">
                  <li>
                    Only one device
                  </li>
                  <li>
                    Device gets passed around
                  </li>
                  <li>
                    Bluff can happen one at a time
                  </li>
                </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
