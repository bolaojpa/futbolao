
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Award, Crown, Star, Info } from 'lucide-react';
import { Separator } from "../ui/separator";

const ExplanationRow = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h4 className="font-bold">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    </div>
);

export function HonorificsExplanationModal({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Info className="w-5 h-5"/> Sistema de Títulos</DialogTitle>
          <DialogDescription>
            Os ícones no seu perfil representam o número de campeonatos que você venceu pela maior pontuação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
            <ExplanationRow 
                icon={<Star className="w-7 h-7 text-yellow-500 fill-yellow-400" />} 
                title="Aspirante (1-3 Títulos)"
                description="Você está começando sua jornada de vitórias. Cada estrela representa um título."
            />
            <Separator />
             <ExplanationRow 
                icon={<Award className="w-7 h-7 text-yellow-500 fill-yellow-400" />} 
                title="Veterano (4-9 Títulos)"
                description="Você já é um competidor experiente. Os prêmios mostram sua consistência."
            />
            <Separator />
             <ExplanationRow 
                icon={<Crown className="w-7 h-7 text-yellow-500 fill-yellow-400" />} 
                title="Lenda (10+ Títulos)"
                description="Você alcançou o topo! As coroas são reservadas para os maiores campeões."
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
