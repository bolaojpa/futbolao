
'use client';

import { useState, useRef } from 'react';
import Autoplay from "embla-carousel-autoplay"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { mockHallOfFame } from "@/lib/data"
import { ChampionBanner, ChampionBannerProps } from "./champion-banner";
import { Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function HallOfFameCarousel() {
  const [selectedBanner, setSelectedBanner] = useState<ChampionBannerProps | null>(null);
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )

  const orderedHallOfFame = [...mockHallOfFame].reverse();

  if (!orderedHallOfFame || orderedHallOfFame.length === 0) {
    return (
      <Card>
        <CardContent className="flex aspect-video items-center justify-center p-6">
          <span className="text-muted-foreground">O Hall da Fama ainda está sendo construído. Volte em breve!</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="relative w-full max-w-sm mx-auto flex items-center justify-center">
        <Carousel 
            className="w-full"
            plugins={[autoplayPlugin.current]}
            onMouseEnter={autoplayPlugin.current.stop}
            onMouseLeave={autoplayPlugin.current.reset}
            opts={{
                align: "start",
                loop: true,
            }}
        >
          <CarouselContent>
            {orderedHallOfFame.map((entry) => (
              <CarouselItem key={entry.id}>
                <div className="p-1 relative group">
                    <ChampionBanner {...entry} />
                    <div 
                      className="absolute inset-1 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer rounded-md"
                      onClick={() => setSelectedBanner(entry)}
                    >
                      <Eye className="w-16 h-16 text-white" />
                    </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-0 sm:left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10" />
          <CarouselNext className="absolute right-0 sm:right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10" />
        </Carousel>
      </div>

      <Dialog open={!!selectedBanner} onOpenChange={(isOpen) => !isOpen && setSelectedBanner(null)}>
        <DialogContent className="max-w-4xl p-0 border-0 bg-transparent">
           <DialogHeader className="sr-only">
            <DialogTitle>Banner do Campeão</DialogTitle>
            <DialogDescription>
              Visualização ampliada do banner de um campeão de um campeonato anterior.
            </DialogDescription>
          </DialogHeader>
          {selectedBanner && <ChampionBanner {...selectedBanner} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
