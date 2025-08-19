
'use client';

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
    <Carousel 
        className="w-full max-w-4xl mx-auto"
        opts={{
            align: "start",
            loop: true,
        }}
    >
      <CarouselContent>
        {mockHallOfFame.map((entry) => (
          <CarouselItem key={entry.id}>
            <div className="p-1">
                <ChampionBanner {...entry} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  )
}
