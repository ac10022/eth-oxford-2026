import { HomeIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function error() {
  return (
    <main className="flex h-full flex-col overflow-hidden select-none bg-radial from-[#BA2237] from-30% to-[#261447]">
      <div className="flex-col lg:flex-row flex">
        <div className="flex justify-center flex-col ml-20 text-white gap-y-5 w-[550]">
          <Image src="LogoWhite.svg" width={200} height={200} alt="Logo">
          </Image>
          <h1 className="mt-15 text-2xl md:text-5xl font-bold">
            WHOOPS... <br /> Something went wrong!
          </h1>
          <div className="mt-5 justify-center items-center">
            <Link href="./" className="text-2xl md:text-4xl font-bold rounded-2xl bg-[#F30000]/60 w-[200] md:w-[300] items-center justify-center flex">
              <div className="flex flex-row m-2">
                <HomeIcon className="mt-2 size-5 md:size-7 mr-2"></HomeIcon>
                Back to Home
              </div>
            </Link>
          </div>
        </div>
          <div className="relative flex items-center justify-center ml-30 mt-45 w-[200] h-[250] md:w-[500] md:h-[400] hover:scale-110">
                <div className="absolute z-10 w-64 aspect-5/7 rounded-xl bg-blue-950 outline outline-white shadow-2xl flex items-center justify-center rotate-[-8deg] -translate-x-32 scale-95">
                    <div className="text-white text-3xl font-bold flex items-center justify-center flex-col"><Image src="../CardIcon.svg" width={120} height={120} alt="Logo"></Image>ZK-BLUFF</div>
                </div>
                <div className="absolute z-20 w-64 aspect-5/7 rounded-xl bg-blue-950 outline outline-white shadow-2xl flex items-center justify-center scale-105">
                    <div className="text-white text-3xl font-bold flex items-center justify-center flex-col"><Image src="../CardIcon.svg" width={120} height={120} alt="Logo"></Image>ZK-BLUFF</div>
                </div>
                <div className="absolute z-10 w-64 aspect-5/7 rounded-xl bg-blue-950 outline outline-white shadow-2xl flex items-center justify-center rotate-[8deg] translate-x-32 scale-95">
                    <div className="text-white text-3xl font-bold flex items-center justify-center flex-col"><Image src="../CardIcon.svg" width={120} height={120} alt="Logo"></Image>ZK-BLUFF</div>
              </div>
          </div>
      </div>
    </main>
  );
}