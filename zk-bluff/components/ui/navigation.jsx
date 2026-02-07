import Image from "next/image";
import Link from "next/link";

export default function navigation() {
  return (
    <nav className="z-50 relative inset-0 items-center justify-between flex flex-row bg-transparent">
        <Link href = "/" className="w-50 hover:scale-110 flex justify-start ml-10">
            <Image
            className="justify-center"
            src="LogoWhite.svg"
            alt="SkyFare logo"
            width={120}
            height={120}
            priority
            />
        </Link>
      <div className="items-center mr-10 p-3 rounded-2xl bg-[#F30000]/60 hover:scale-110">
        <Link href="./join" className=" font-bold text-xl sm:text-3xl text-white">
          Join Game
        </Link>
      </div>
    </nav>
  );
}