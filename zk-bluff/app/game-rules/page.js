import { JoystickIcon, MegaphoneIcon, NotepadTextIcon } from 'lucide-react';
import Navigation from '@/components/ui/nav';

export default function howto() {
  return (
    <main className="flex flex-col relative h-full w-full overflow-auto sm:overflow-hidden bg-radial from-[#BA2237] from-30% to-[#261447] select-none">
        <Navigation></Navigation>
        <div className="flex justify-center items-center">
            <h1 className="text-4xl lg:text-7xl font-bold text-white">
                HOW TO PLAY:
            </h1>
        </div>
        <div className="flex justify-center items-center mt-10 flex-col sm:flex-row">
            <h3 className="text-xl sm:text-3xl font-bold text-white">
                OBJECTIVE: 
            </h3>
            <p className="ml-5 text-xs sm:text-2xl text-white">
                Be the first player to get rid of all your cards.
            </p>
        </div>
        <div className="flex-col sm:flex-row flex justify-center items-center space-y-10 p-5 sm:space-y-0 sm:space-x-10 mt-10 text-white">
            <div className="w-[300] h-[350] items-center flex flex-col bg-black/20 shadow-2xl p-5 rounded-2xl">
                <div className="bg-[#F30000]/40 rounded-2xl p-2">
                    <JoystickIcon className="w-[50] h-[50]">
                    </JoystickIcon>
                </div>
                    <h4 className="text-2xl font-bold mt-2">
                        PLAYING CARDS:
                    </h4>
                <div className="flex justify-center h-full items-center flex-col">
                    <div className="text-start mt-2 ml-2">
                        <li>
                            Cards must be placed in an ascending order (e.g. 1,2,3).
                        </li>
                        <li>
                            You can only place one or multiple cards at a time.
                        </li>
                        <li>
                            Cards must have the same rank when placing multiple cards.
                        </li>
                    </div>
                </div>
            </div>
            <div className="w-[300] h-[350] items-center flex flex-col bg-black/20 shadow-2xl p-5 rounded-2xl">
                <div className="bg-[#F30000]/40 rounded-2xl p-2">
                    <MegaphoneIcon className="w-[50] h-[50]">
                    </MegaphoneIcon>
                </div>
                    <h4 className="text-2xl font-bold mt-2">
                        CALLING BS:
                    </h4>
                <div className="flex justify-center h-full items-center flex-col">
                    <div className="text-start mt-2 ml-2">
                        <li>
                            You can only call BS after the card has been placed.
                        </li>
                        <li>
                            If a player is caught lying, they must pick up the pile.
                        </li>
                        <li>
                            If the accused is not lying, the accuser must pick up the pile.
                        </li>
                    </div>
                </div>
            </div>
            <div className="w-[300] h-[350] items-center flex flex-col bg-black/20 shadow-2xl p-5 rounded-2xl">
                <div className="bg-[#F30000]/40 rounded-2xl p-2">
                    <NotepadTextIcon className="w-[50] h-[50]">
                    </NotepadTextIcon>
                </div>
                    <h4 className="text-2xl font-bold mt-2">
                        OTHER RULES:
                    </h4>
                <div className="flex justify-center h-full items-center flex-col">
                    <div className="text-start mt-2 ml-2">
                        <li>
                            The Joker can be played as any cards in the deck.   
                        </li>
                        <li>
                            Can't play a valid card(s)? Just Bluff (BS) and don't get caught!
                        </li>
                    </div>
                </div>
            </div>

        </div>
    </main>
  );
}