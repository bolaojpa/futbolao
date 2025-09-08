
'use client';

import { HallOfFameCarousel } from '@/components/fame/hall-of-fame-carousel';
import { mockHallOfFame } from '@/lib/data';
import { ShieldCheck, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
                <Card>
                    <CardContent className="p-10 text-center">
                        <div className="mx-auto w-fit bg-muted p-4 rounded-full mb-4">
                            <Trophy className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold">O Hall da Fama Aguarda Seus Campeões!</h3>
                        <p className="text-muted-foreground mt-2">
                           Quando campeonatos forem finalizados com a opção de banner ativada, <br/> os banners dos vencedores aparecerão aqui.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
