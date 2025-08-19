'use client';

import Image from "next/image";
import { Crown } from "lucide-react";

export interface ChampionBannerProps {
  id: string;
  campeonatoLogoUrl: string;
  campeonatoNome: string;
  campeaoGeralNome: string;
  campeaoGeralAvatarUrl: string;
  tipoPalpite: "selecao" | "equipe";
  palpiteiroNome: string;
  palpiteiroAvatarUrl: string;
}

export function ChampionBanner({
  campeonatoLogoUrl,
  campeonatoNome,
  campeaoGeralNome,
  campeaoGeralAvatarUrl,
  tipoPalpite,
  palpiteiroNome,
  palpiteiroAvatarUrl,
}: ChampionBannerProps) {
  return (
    <div 
        className="w-full h-full aspect-[857/828] bg-gradient-to-br from-yellow-300/20 via-primary/20 to-background shadow-2xl border-2 border-primary/50 flex flex-col p-[3%] text-white relative overflow-hidden"
        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
    >
        {/* Decorative elements */}
        <Crown className="absolute -top-[10%] -right-[10%] w-[35%] h-[35%] text-yellow-400/10 rotate-12" strokeWidth={1}/>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] -z-10"></div>

        {/* Top Section */}
        <div className="flex-1 flex justify-between items-center border-b-2 border-white/20 pb-[2%]">
            <div className="w-1/4 flex justify-start items-center h-full">
                <Image 
                    src={campeonatoLogoUrl} 
                    alt={`Logo ${campeonatoNome}`}
                    width={100}
                    height={100}
                    className="object-contain h-[80%] w-auto" 
                />
            </div>
            <div className="w-3/4 flex justify-center items-center">
                 <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-widest uppercase text-center">Ganhadores</h2>
            </div>
        </div>

        {/* Middle Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center border-b-2 border-white/20 py-[2%]">
            <h3 className="text-xl md:text-2xl font-semibold uppercase tracking-wider text-yellow-300 font-headline">CAMPEÃO GERAL</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
                <Image src={campeaoGeralAvatarUrl} alt={`Avatar de ${campeaoGeralNome}`} width={80} height={80} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 sm:border-4 border-yellow-400" />
                <p className="text-lg md:text-xl font-bold">{campeaoGeralNome}</p>
            </div>
        </div>

        {/* Bottom Section */}
        <div className="flex-1 flex flex-col items-center justify-start text-center pt-[2%]">
            <h3 className="text-xl md:text-2xl font-semibold uppercase tracking-wider text-yellow-300 font-headline">
                {tipoPalpite === 'selecao' ? 'PALPITE DA SELEÇÃO' : 'PALPITE DA EQUIPE'}
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
                <Image src={palpiteiroAvatarUrl} alt={`Avatar de ${palpiteiroNome}`} width={80} height={80} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 sm:border-4 border-yellow-400" />
                <p className="text-lg md:text-xl font-bold">{palpiteiroNome}</p>
            </div>
        </div>
    </div>
  );
}
