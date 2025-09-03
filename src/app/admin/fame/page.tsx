
'use client';

import { HallOfFameCarousel } from '@/components/fame/hall-of-fame-carousel';
import { mockHallOfFame } from '@/lib/data';
import { ShieldCheck } from 'lucide-react';

export default function AdminFamePage() {
    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                 <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Hall da Fama</h1>
                    <p className="text-muted-foreground">
                        Visualize os banners dos campeões de cada temporada.
                    </p>
                </div>
            </div>

            {mockHallOfFame.length > 0 ? (
                <HallOfFameCarousel banners={mockHallOfFame} />
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>Nenhum banner encontrado. Crie campeonatos e ative a opção de banner para vê-los aqui.</p>
                </div>
            )}
        </div>
    );
}
