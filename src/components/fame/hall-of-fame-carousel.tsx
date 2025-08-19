"use client"

import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { ChampionBanner, ChampionBannerProps } from "./champion-banner";
import Autoplay from "embla-carousel-autoplay";
import { Eye } from "lucide-react";

interface HallOfFameCarouselProps {
    banners: ChampionBannerProps[];
}

export function HallOfFameCarousel({ banners }: HallOfFameCarouselProps) {
  const [selectedBanner, setSelectedBanner] = useState<ChampionBannerProps | null>(null);

  // Garante que o banner mais recente apareça primeiro.
  const sortedBanners = [...banners].reverse();

  return (
    <>
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
          className="w-full max-w-sm mx-auto"
        >
          <CarouselContent>
            {sortedBanners.map((banner) => (
              <CarouselItem key={banner.id} className="group relative">
                <div className="p-1 cursor-pointer" onClick={() => setSelectedBanner(banner)}>
                  <ChampionBanner {...banner} />
                   <div className="absolute inset-1 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                        <Eye className="w-12 h-12 text-white" />
                    </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute top-1/2 -translate-y-1/2 left-0 sm:left-2 md:-left-10" />
          <CarouselNext className="absolute top-1/2 -translate-y-1/2 right-0 sm:right-2 md:-right-10" />
        </Carousel>

        <Dialog open={!!selectedBanner} onOpenChange={(isOpen) => !isOpen && setSelectedBanner(null)}>
            <DialogContent className="max-w-3xl w-full p-0 border-0">
                {selectedBanner && <ChampionBanner {...selectedBanner} />}
            </DialogContent>
        </Dialog>
    </>
  );
}
