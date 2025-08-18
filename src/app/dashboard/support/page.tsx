import { SupportForm } from '@/components/support/support-form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { LifeBuoy } from 'lucide-react';

export default function SupportPage() {
    return (
        <div className="container mx-auto space-y-8">
            <div className="flex items-center gap-4">
                 <LifeBuoy className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Suporte</h1>
                    <p className="text-muted-foreground">
                        Precisa de ajuda ou tem alguma sugestão? Envie uma mensagem para nossa equipe.
                    </p>
                </div>
            </div>
            
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Enviar Mensagem</CardTitle>
                    <CardDescription>
                        Sua mensagem será enviada diretamente para um administrador. Responderemos o mais breve possível.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SupportForm />
                </CardContent>
            </Card>

        </div>
    );
}
