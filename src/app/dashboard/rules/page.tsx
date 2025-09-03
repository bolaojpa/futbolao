
import { ChampionPrediction } from '@/components/rules/champion-prediction';
import { BookOpen } from 'lucide-react';

export default function RulesPage() {
    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Regras e Palpites de Campeão</h1>
                    <p className="text-muted-foreground">
                        Confira as regras e envie seus palpites de campeão para os campeonatos disponíveis.
                    </p>
                </div>
            </div>
            
            <ChampionPrediction />

        </div>
    );
}
