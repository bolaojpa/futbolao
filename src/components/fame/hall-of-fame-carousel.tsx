
'use client';

import { useRef } from 'react';
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
import { ChampionBanner } from "./champion-banner";


export function HallOfFameCarousel() {
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
    <Carousel 
        className="w-full max-w-sm mx-auto relative"
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
             <ChampionBanner {...entry} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-0 sm:left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10" />
      <CarouselNext className="absolute right-0 sm:right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10" />
    </Carousel>
  )
}
