import { PredictionForm } from '@/components/predictions/prediction-form';

export default function PredictionsPage() {
    return (
        <div className="container mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Fazer Palpites</h1>
                <p className="text-muted-foreground">
                    Envie seus palpites para as próximas partidas. Os palpites são bloqueados quando a partida começa.
                </p>
            </div>
            
            <PredictionForm />

        </div>
    );
}
