
import Image from "next/image";
import { Crown } from "lucide-react";
import { useRef, useState, useLayoutEffect } from 'react';

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
  const targetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const updateScale = () => {
      if (targetRef.current) {
        const parentWidth = targetRef.current.offsetWidth;
        // The banner's original design width is 857px.
        // We calculate the scale factor based on the parent's width.
        const newScale = parentWidth / 857;
        setScale(newScale);
      }
    };

    updateScale(); // Initial scale
    window.addEventListener('resize', updateScale); // Update on resize

    // Debounce resize events for performance
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateScale, 100);
    };

    window.addEventListener('resize', handleResize);


    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <div
      ref={targetRef}
      className="aspect-[857/828] w-full" // This maintains the aspect ratio
    >
      <div 
        className="origin-top-left flex flex-col"
        style={{
            width: `857px`,
            height: `828px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
        }}
      >
        <div 
            className="w-full h-full bg-gradient-to-br from-yellow-300/20 via-primary/20 to-background shadow-2xl border-2 border-primary/50 flex flex-col p-6 text-white relative overflow-hidden"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
        >
            {/* Decorative elements */}
            <Crown className="absolute -top-[10%] -right-[10%] w-[35%] h-[35%] text-yellow-400/10 rotate-12" strokeWidth={1}/>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] -z-10"></div>

            {/* Top Section */}
            <div className="flex-1 flex justify-between items-center border-b-2 border-white/20 pb-4">
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
                     <h2 className="text-[5rem] font-extrabold tracking-widest uppercase">Ganhadores</h2>
                </div>
            </div>

            {/* Middle Section */}
            <div className="flex-1 flex flex-col items-center justify-center text-center border-b-2 border-white/20 py-4">
                <h3 className="text-[4rem] font-semibold uppercase tracking-wider text-yellow-300 font-headline">CAMPEÃO GERAL</h3>
                <div className="flex flex-row items-center justify-center gap-4 mt-4">
                    <Image src={campeaoGeralAvatarUrl} alt={`Avatar de ${campeaoGeralNome}`} width={80} height={80} className="w-20 h-20 rounded-full border-4 border-yellow-400" />
                    <p className="text-[3rem] font-bold">{campeaoGeralNome}</p>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="flex-1 flex flex-col items-center justify-start text-center pt-4">
                <h3 className="text-[4rem] font-semibold uppercase tracking-wider text-yellow-300 font-headline">
                    {tipoPalpite === 'selecao' ? 'PALPITE DA SELEÇÃO' : 'PALPITE DA EQUIPE'}
                </h3>
                <div className="flex flex-row items-center justify-center gap-4 mt-4">
                    <Image src={palpiteiroAvatarUrl} alt={`Avatar de ${palpiteiroNome}`} width={80} height={80} className="w-20 h-20 rounded-full border-4 border-yellow-400" />
                    <p className="text-[3rem] font-bold">{palpiteiroNome}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
