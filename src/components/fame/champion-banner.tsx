
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
  tipoPalpite: "selecao" | "equipe";
  palpiteiroNome: string;
  palpiteiroAvatarUrl: string;
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
  tipoPalpite,
  palpiteiroNome,
  palpiteiroAvatarUrl,
}: ChampionBannerProps) {
  return (
    <div
      className="w-full h-full aspect-[857/828] bg-gradient-to-br from-yellow-300/20 via-primary/20 to-background shadow-2xl border-2 border-primary/50 flex flex-col p-[0.33%] text-white relative overflow-hidden [container-type:inline-size]"
      style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
    >
      {/* Decorative elements */}
      <Crown
        className="absolute -top-[10%] -right-[10%] w-[35%] h-[35%] text-yellow-400/10 rotate-12"
        strokeWidth={1}
      />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] -z-10"></div>

      {/* Top Section */}
      <Section height="32.78%">
        <div style={{ width: '31.28%' }} className="flex justify-center items-center h-full p-[5%]">
          <Image
            src={campeonatoLogoUrl}
            alt={`Logo ${campeonatoNome}`}
            width={150}
            height={150}
            className="object-contain h-full w-auto"
          />
        </div>

        <div style={{ width: '68.72%' }} className="flex justify-center items-center h-full">
          <h2 className="text-[10cqw] font-extrabold tracking-wider uppercase text-center">
            Ganhadores
          </h2>
        </div>
      </Section>

      {/* Middle Section */}
      <Section height="33.11%" className="flex-col justify-center items-center text-center p-[2%]">
        <h3 className="text-[5cqw] font-semibold uppercase tracking-wider text-yellow-300 font-headline whitespace-nowrap">
          CAMPEÃO GERAL
        </h3>
        <div className="flex items-center justify-center gap-[4%] mt-[2%] w-full">
          <Image
            src={campeaoGeralAvatarUrl}
            alt={`Avatar de ${campeaoGeralNome}`}
            width={80}
            height={80}
            className="w-[16%] h-auto aspect-square rounded-full border-[0.5cqw] border-yellow-400"
          />
          <p className="text-[6.5cqw] font-bold whitespace-nowrap truncate">{campeaoGeralNome}</p>
        </div>
      </Section>

      {/* Bottom Section */}
      <Section height="33.28%" className="flex-col justify-center items-center text-center p-[2%]">
        <h3 className="text-[5cqw] font-semibold uppercase tracking-wider text-yellow-300 font-headline whitespace-nowrap">
          {tipoPalpite === "selecao" ? "PALPITE DA SELEÇÃO" : "PALPITE DA EQUIPE"}
        </h3>
        <div className="flex items-center justify-center gap-[4%] mt-[2%] w-full">
          <Image
            src={palpiteiroAvatarUrl}
            alt={`Avatar de ${palpiteiroNome}`}
            width={80}
            height={80}
            className="w-[16%] h-auto aspect-square rounded-full border-[0.5cqw] border-yellow-400"
          />
          <p className="text-[6.5cqw] font-bold whitespace-nowrap truncate">{palpiteiroNome}</p>
        </div>
      </Section>
    </div>
  );
}
