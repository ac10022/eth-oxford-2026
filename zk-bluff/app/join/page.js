"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/ui/nav";
 

export default function JoinGame() {
  const [gameCode, setGameCode] = useState("");
  const [userName, setUserName] = useState("");
  const [blameCode, setBlameCode] = useState(false);
  const [blameDetail, setBlameDetail] = useState(false);
  const router = useRouter();

  const setBlameCodeFunc = () => {
    setBlameCode(false);
  }

  const setBlameDetailFunc = () => {
    setBlameDetail(false);
  }
  
  const handleJoin = () => {
    if (!gameCode || !userName) {
      // alert("Please enter both a name and a game code!");
      // return;
      setBlameDetail(true);
    }
    else if (gameCode.length !== 6)
      {setBlameCode(true);}
    else if (gameCode.length === 6)
    {localStorage.setItem("zk_user_name", userName);
      router.push(`/online/${gameCode.toUpperCase()}`);
    }
    else {alert("Please enter a valid code")}
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-radial from-[#BA2237] to-[#261447] p-4">
      <Navigation></Navigation>
      {blameDetail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white/60 border-5 border-white p-8 rounded-2xl text-center max-w-lg flex flex-col items-center gap-4">
        <h2 className="text-4xl font-bold text-white mb-2">PLEASE ENSURE THAT ALL FIELDS ARE COMPLETED</h2>
        <button onClick={setBlameDetailFunc} className="text-2xl bg-[#F30000]/60 font-bold text-white p-2 rounded-xl cursor-pointer">TRY AGAIN</button>
        </div>
        </div>}
      {blameCode && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white/60 border-5 border-white p-8 rounded-2xl text-center max-w-lg flex flex-col items-center gap-4">
        <h2 className="text-4xl font-bold text-white mb-2">PLEASE ENTER A VALID CODE</h2>
        <button onClick={setBlameCodeFunc} className="text-2xl bg-[#F30000]/60 font-bold text-white p-2 rounded-xl cursor-pointer">TRY AGAIN</button>
        </div>
        </div>}
      <div className="flex justify-center items-center p-15">
      <div className="bg-black/40 p-8 rounded-2xl backdrop-blur-md w-full max-w-md border border-white/20 flex items-center justify-center flex-col">
        <h1 className="text-white text-3xl md:text-5xl font-bold mb-6 text-center">JOIN GAME</h1>
        
        <div className="space-y-4">
          <div>
            <label className="text-white font-bold text-sm md:text-xl ml-1">YOUR NAME</label>
            <input 
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="ENTER NAME"
              className="w-full p-4 mt-2 rounded-xl bg-white/10 border border-white/20 text-white text-xl focus:outline-2 outline-white focus:border-white"
            />
          </div>
          <div>
            <label className="text-white font-bold text-sm md:text-xl ml-1">GAME CODE</label>
            <input 
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              placeholder="ENTER GAME CODE"
              className="w-full p-4 mt-2 rounded-xl bg-white/10 border border-white/20 text-white text-xl focus:outline-2 outline-white focus:border-white"
            />
          </div>

          <button 
            onClick={handleJoin}
            className="w-full py-4 hover:bg-[#F30000]/60 bg-red-600 text-white font-bold text-2xl rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            JOIN LOBBY
          </button>
        </div>
      </div>
      </div>
    </main>
  );
}