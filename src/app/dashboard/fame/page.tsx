import { HallOfFameCarousel } from '@/components/fame/hall-of-fame-carousel';
import { mockHallOfFame } from '@/lib/data';
import { ShieldCheck } from 'lucide-react';

export default function FamePage() {
    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                 <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Hall da Fama</h1>
                    <p className="text-muted-foreground">
                        Um espaço dedicado aos grandes campeões de cada temporada.
                    </p>
                </div>
            </div>

            <div>
                 {mockHallOfFame.length > 0 ? (
                    <HallOfFameCarousel banners={mockHallOfFame} />
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>O Hall da Fama ainda está sendo construído. Volte em breve!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
