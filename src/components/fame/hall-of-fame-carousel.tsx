
'use client';

import { useState } from 'react';
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

export function HallOfFameCarousel() {
  const [selectedBanner, setSelectedBanner] = useState<ChampionBannerProps | null>(null);

  if (!mockHallOfFame || mockHallOfFame.length === 0) {
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
      <Carousel 
          className="w-full max-w-xl mx-auto"
          opts={{
              align: "start",
              loop: true,
          }}
      >
        <CarouselContent>
          {mockHallOfFame.map((entry) => (
            <CarouselItem key={entry.id}>
              <div className="p-1 relative group">
                  <ChampionBanner {...entry} />
                  <div 
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                    onClick={() => setSelectedBanner(entry)}
                  >
                    <Eye className="w-16 h-16 text-white" />
                  </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>

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
