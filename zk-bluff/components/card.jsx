"use client"
import Image from "next/image"

const suitIcons = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
  joker: "✪",
}

export default function Card({ card, isSelected, onSelect, isCenter, faceDown }) {
  if (!card) return null;

  const isRed = card.suit === "hearts" || card.suit === "diamonds"

  return (
    <div
      className={`w-32 aspect-[2.5/3.5] perspective transition-transform duration-300 ${
        !isCenter ? "cursor-pointer" : ""
      } ${
        isSelected ? "-translate-y-3.75" : "translate-y-0"
      }`}
      onClick={(!isCenter && !faceDown) ? onSelect : undefined}
    >
      <div className="relative h-full w-full">
        {/* FACE DOWN VIEW */}
        {faceDown ? (
          <div className="absolute z-20 w-30 aspect-5/7 rounded-xl bg-blue-950 outline outline-white shadow-2xl flex items-center justify-center scale-105">
            {/* <div className="w-20 h-28 border-2 border-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white/20 text-4xl">?</span>
            </div> */}
            <div className="text-white text-2xl font-bold flex items-center justify-center flex-col"><Image src="../CardIcon.svg" width={60} height={60} alt="Logo"></Image>ZK-BLUFF</div>
          </div>
        ) : (
          /* FRONT VIEW */
          <div className="absolute inset-0 rounded-xl outline bg-white shadow-md select-none overflow-hidden">
            <div className={`h-full p-2 flex flex-col justify-between ${isRed ? "text-red-600" : "text-black"}`}>
              <div className="text-sm font-semibold self-start leading-none">
                <div>{card.rank}</div>
                <div>{suitIcons[card.suit]}</div>
              </div>

              <div className="flex items-center justify-center text-5xl">
                {suitIcons[card.suit]}
              </div>

              <div className="text-sm font-semibold leading-none rotate-180 self-end">
                <div>{card.rank}</div>
                <div>{suitIcons[card.suit]}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}