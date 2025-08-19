"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ChampionBanner, ChampionBannerProps } from "./champion-banner";
import Autoplay from "embla-carousel-autoplay";

interface HallOfFameCarouselProps {
    banners: ChampionBannerProps[];
}

export function HallOfFameCarousel({ banners }: HallOfFameCarouselProps) {
  const sortedBanners = [...banners].reverse();

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 5000,
          stopOnInteraction: true,
        }),
      ]}
      className="w-full max-w-sm mx-auto relative"
    >
      <CarouselContent>
        {sortedBanners.map((banner) => (
          <CarouselItem key={banner.id}>
             <ChampionBanner {...banner} />
          </CarouselItem>
        ))}
      </CarouselContent>
       <CarouselPrevious className="absolute top-1/2 -translate-y-1/2 left-0 sm:left-2 md:-left-10" />
       <CarouselNext className="absolute top-1/2 -translate-y-1/2 right-0 sm:right-2 md:-right-10" />
    </Carousel>
  );
}
