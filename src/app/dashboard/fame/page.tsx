import { HallOfFameCarousel } from '@/components/fame/hall-of-fame-carousel';
import { ShieldCheck } from 'lucide-react';

export default function FamePage() {
    return (
        <div className="container mx-auto space-y-8">
            <div className="flex items-center gap-4">
                 <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Hall da Fama</h1>
                    <p className="text-muted-foreground">
                        Um espaço dedicado aos grandes campeões de cada temporada.
                    </p>
                </div>
            </div>

            <HallOfFameCarousel />
            
        </div>
    );
}
