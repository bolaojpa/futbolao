
"use client";

import Image from "next/image";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChampionBannerProps {
  id: string;
  campeonatoLogoUrl: string;
  campeonatoNome: string;
  campeaoGeralNome: string;
  campeaoGeralAvatarUrl: string;
  modoEquipes: "selecao" | "times" | "mista";
  palpiteiroNome: string;
  palpiteiroAvatarUrl: string;
  displayMode?: 'photo_and_names' | 'names_only';
  backgroundUrl?: string;
}

const Section = ({
  height,
  children,
  className = "",
}: {
  height: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div style={{ height }} className={`w-full flex ${className}`}>
    {children}
  </div>
);

export function ChampionBanner({
  campeonatoLogoUrl,
  campeonatoNome,
  campeaoGeralNome,
  campeaoGeralAvatarUrl,
  modoEquipes,
  palpiteiroNome,
  palpiteiroAvatarUrl,
  displayMode = 'photo_and_names',
  backgroundUrl,
}: ChampionBannerProps) {
  const showPhotos = displayMode === 'photo_and_names';
  const hasMultipleCampeoes = campeaoGeralNome.includes(",");
  const hasMultiplePalpiteiros = palpiteiroNome.includes(",");
  
  // Condicional para não exibir os nomes placeholder
  const finalCampeaoNome = campeaoGeralNome.includes("(Em Breve)") ? "" : campeaoGeralNome;
  const finalPalpiteiroNome = palpiteiroNome.includes("(Em Breve)") ? "" : palpiteiroNome;


  return (
    <div
      className="w-full h-full aspect-[857/828] bg-cover bg-center bg-gradient-to-br from-yellow-300/20 via-primary/20 to-background shadow-2xl border-2 border-primary/50 flex flex-col p-[0.33%] text-white relative overflow-hidden [container-type:inline-size] rounded-lg"
      style={{
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
      }}
    >
      {/* Overlay com opacidade */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-0"></div>

      {/* Conteúdo do banner (com z-index maior para ficar sobre o overlay) */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top Section */}
        <Section height="32.78%">
          <div style={{ width: '31.28%' }} className="flex justify-center items-center h-full p-[5%]">
            <Image
              src={campeonatoLogoUrl}
              alt={`Logo ${campeonatoNome}`}
              width={150}
              height={150}
              className="object-contain h-full w-auto [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.7))]"
            />
          </div>

          <div style={{ width: '68.72%' }} className="flex justify-center items-center h-full">
            <h2 className="text-[10cqw] font-extrabold tracking-wider uppercase text-center [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">
              Ganhadores
            </h2>
          </div>
        </Section>

        {/* Middle Section */}
        <Section height="33.11%" className="flex-col justify-start items-center text-center p-[2%]">
          <h3 className="text-[6cqw] font-semibold uppercase tracking-wider text-yellow-300 font-headline [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">
            CAMPEÃO GERAL
          </h3>
          <div className={cn("flex items-center justify-center gap-[2%]", showPhotos ? "flex-row" : "flex-col")}>
            {showPhotos && campeaoGeralAvatarUrl && finalCampeaoNome && (
              <Image
                src={campeaoGeralAvatarUrl}
                alt={`Avatar de ${finalCampeaoNome}`}
                width={80}
                height={80}
                className="w-[18%] h-auto aspect-square rounded-full border-[0.5cqw] border-yellow-400"
              />
            )}
            <p className={cn("font-bold whitespace-nowrap",
              hasMultipleCampeoes ? "text-[4cqw]" : "text-[5cqw]",
              !showPhotos && (hasMultipleCampeoes ? "text-[4.5cqw]" : "text-[6cqw]"),
              !finalCampeaoNome && "h-[6cqw]" // Mantém a altura para evitar que o layout quebre
            )}>{finalCampeaoNome}</p>
          </div>
        </Section>

        {/* Bottom Section */}
        <Section height="33.28%" className="flex-col justify-start items-center text-center p-[2%]">
          <h3 className="text-[6cqw] font-semibold uppercase tracking-wider text-yellow-300 font-headline [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">
            {modoEquipes === "selecao" ? "PALPITE DA SELEÇÃO" : "PALPITE DA EQUIPE"}
          </h3>
          <div className={cn("flex items-center justify-center gap-[2%]", showPhotos ? "flex-row" : "flex-col")}>
            {showPhotos && palpiteiroAvatarUrl && finalPalpiteiroNome && (
              <Image
                src={palpiteiroAvatarUrl}
                alt={`Avatar de ${finalPalpiteiroNome}`}
                width={80}
                height={80}
                className="w-[18%] h-auto aspect-square rounded-full border-[0.5cqw] border-yellow-400"
              />
            )}
            <p className={cn("font-bold",
              hasMultiplePalpiteiros ? "text-[3.5cqw]" : "text-[4.5cqw]",
              !showPhotos && (hasMultiplePalpiteiros ? "text-[4cqw]" : "text-[5cqw]"),
              !finalPalpiteiroNome && "h-[5cqw]" // Mantém a altura para evitar que o layout quebre
            )}>{finalPalpiteiroNome}</p>
          </div>
        </Section>
      </div>

       {/* Decorative elements */}
      <Crown
        className="absolute -top-[10%] -right-[10%] w-[35%] h-[35%] text-yellow-400/10 rotate-12"
        strokeWidth={1}
      />
    </div>
  );
}
