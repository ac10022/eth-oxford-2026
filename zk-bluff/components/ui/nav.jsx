import Image from "next/image";
import Link from "next/link";

export default function nav() {
  return (
    <nav className="z-50 relative inset-0 items-center justify-center flex flex-row bg-transparent">
        <Link href = "/" className="w-50 hover:scale-110 flex justify-center">
            <Image
            className="justify-center"
            src="LogoWhite.svg"
            alt="SkyFare logo"
            width={120}
            height={120}
            priority
            />
        </Link>
    </nav>
  );
}