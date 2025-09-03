
import { ChampionPrediction } from '@/components/rules/champion-prediction';
import { PredictionForm } from '@/components/predictions/prediction-form';
import { CalendarCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function PredictionsPage() {
    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
            <div>
                <div className="flex items-center gap-4">
                    <CalendarCheck className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Fazer Palpites</h1>
                        <p className="text-muted-foreground">
                            Envie seus palpites para as próximas partidas e campeões.
                        </p>
                    </div>
                </div>
            </div>

            <ChampionPrediction />
            
            <Separator />

            <PredictionForm />

        </div>
    );
}
