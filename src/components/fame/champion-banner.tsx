
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
        className="aspect-[857/828] w-full rounded-lg bg-gradient-to-br from-yellow-300/20 via-primary/20 to-background shadow-2xl border-2 border-primary/50 flex flex-col p-[3vw] text-white relative overflow-hidden"
        style={{ textShadow: '0.2vw 0.2vw 0.4vw rgba(0,0,0,0.5)' }}
    >
        {/* Decorative elements */}
        <Crown className="absolute -top-[5vw] -right-[5vw] w-[18vw] h-[18vw] text-yellow-400/10 rotate-12" strokeWidth={1}/>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] -z-10"></div>

        {/* Top Section */}
        <div className="flex-1 flex justify-between items-center border-b-2 border-white/20 py-[1vw]">
            <div className="w-1/4 flex justify-start items-center h-full">
                <Image 
                    src={campeonatoLogoUrl} 
                    alt={`Logo ${campeonatoNome}`}
                    width={100}
                    height={100}
                    className="object-contain h-[90%] w-auto" 
                />
            </div>
            <div className="w-3/4 flex justify-center items-center">
                 <h2 className="text-[6.5vw] md:text-[5vw] lg:text-[4.5vw] font-extrabold tracking-widest uppercase">Ganhadores</h2>
            </div>
        </div>

        {/* Middle Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center border-b-2 border-white/20 py-[1.5vw]">
            <h3 className="text-[5vw] md:text-[4vw] lg:text-[3.5vw] font-semibold uppercase tracking-wider text-yellow-300 font-headline">CAMPEÃO GERAL</h3>
            <div className="flex items-center gap-[1.5vw] mt-[1.5vw]">
                <Image src={campeaoGeralAvatarUrl} alt={`Avatar de ${campeaoGeralNome}`} width={80} height={80} className="w-[9vw] h-[9vw] md:w-[7vw] md:h-[7vw] rounded-full border-[0.4vw] border-yellow-400" />
                <p className="text-[4vw] md:text-[3vw] lg:text-[2.5vw] font-bold">{campeaoGeralNome}</p>
            </div>
        </div>

        {/* Bottom Section */}
        <div className="flex-1 flex flex-col items-center justify-start pt-[2.5vw] text-center">
            <h3 className="text-[5vw] md:text-[4vw] lg:text-[3.5vw] font-semibold uppercase tracking-wider text-yellow-300 font-headline">
                {tipoPalpite === 'selecao' ? 'PALPITE DA SELEÇÃO' : 'PALPITE DA EQUIPE'}
            </h3>
            <div className="flex items-center gap-[1.5vw] mt-[1.5vw]">
                <Image src={palpiteiroAvatarUrl} alt={`Avatar de ${palpiteiroNome}`} width={60} height={60} className="w-[7vw] h-[7vw] md:w-[5vw] md:h-[5vw] rounded-full border-[0.4vw] border-yellow-400" />
                <p className="text-[4vw] md:text-[3vw] lg:text-[2.5vw] font-bold">{palpiteiroNome}</p>
            </div>
        </div>
    </div>
  );
}
