
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
        className="aspect-[857/828] w-full rounded-lg bg-gradient-to-br from-yellow-300/20 via-primary/20 to-background shadow-2xl border-2 border-primary/50 flex flex-col p-8 text-white relative overflow-hidden"
    >
        {/* Decorative elements */}
        <Crown className="absolute -top-12 -right-12 w-48 h-48 text-yellow-400/10 rotate-12" strokeWidth={1}/>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] -z-10"></div>

        {/* Top Section (33%) */}
        <div className="flex-1 flex justify-between items-center border-b-2 border-white/20">
            <div className="flex items-center gap-4">
                <Image 
                    src={campeonatoLogoUrl} 
                    alt={`Logo ${campeonatoNome}`} 
                    width={80} 
                    height={80} 
                    className="object-contain" 
                />
            </div>
            <h2 className="text-4xl font-extrabold tracking-widest uppercase text-shadow">GANHADORES</h2>
        </div>

        {/* Middle Section (33%) */}
        <div className="flex-1 flex flex-col items-center justify-center text-center border-b-2 border-white/20 py-4">
            <h3 className="text-xl font-semibold uppercase tracking-wider text-yellow-300">CAMPEÃO GERAL</h3>
            <div className="flex items-center gap-4 mt-4">
                <Image src={campeaoGeralAvatarUrl} alt={`Avatar de ${campeaoGeralNome}`} width={80} height={80} className="rounded-full border-4 border-yellow-400" />
                <p className="text-5xl font-bold font-headline">{campeaoGeralNome}</p>
            </div>
        </div>

        {/* Bottom Section (33%) */}
        <div className="flex-1 flex flex-col items-center justify-start pt-6 text-center">
            <h3 className="text-xl font-semibold uppercase tracking-wider text-yellow-300">
                {tipoPalpite === 'selecao' ? 'PALPITE DA SELEÇÃO' : 'PALPITE DA EQUIPE'}
            </h3>
            <div className="flex items-center gap-4 mt-4">
                <Image src={palpiteiroAvatarUrl} alt={`Avatar de ${palpiteiroNome}`} width={60} height={60} className="rounded-full border-4 border-yellow-400" />
                <p className="text-3xl font-bold font-headline">{palpiteiroNome}</p>
            </div>
        </div>
    </div>
  );
}
