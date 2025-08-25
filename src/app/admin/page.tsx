
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <ShieldAlert className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Painel do Administrador</h1>
                    <p className="text-muted-foreground">Bem-vindo. Use os menus para gerenciar o aplicativo.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Visão Geral</CardTitle>
                    <CardDescription>
                        Esta é a página inicial do seu painel de controle.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Selecione uma opção na barra lateral para começar a gerenciar os usuários, campeonatos e outras áreas do FutBolão Pro.</p>
                </CardContent>
            </Card>
        </div>
    );
}
