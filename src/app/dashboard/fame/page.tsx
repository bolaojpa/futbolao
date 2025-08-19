import { ChampionBanner } from '@/components/fame/champion-banner';
import { mockHallOfFame } from '@/lib/data';
import { ShieldCheck } from 'lucide-react';

export default function FamePage() {
    // Pega o banner mais recente para exibir
    const latestBanner = mockHallOfFame.length > 0 ? mockHallOfFame[mockHallOfFame.length - 1] : null;

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

            {latestBanner ? (
                <div className="w-full max-w-sm mx-auto">
                    <ChampionBanner {...latestBanner} />
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>O Hall da Fama ainda está sendo construído. Volte em breve!</p>
                </div>
            )}
            
        </div>
    );
}
