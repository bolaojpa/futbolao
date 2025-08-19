import { NotificationSettings } from '@/components/settings/notification-settings';
import { ThemeSettings } from '@/components/settings/theme-settings';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="container mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Configurações</h1>
                    <p className="text-muted-foreground">
                        Gerencie as preferências da sua conta e do aplicativo.
                    </p>
                </div>
            </div>
            
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Aparência</CardTitle>
                    <CardDescription>
                        Personalize a aparência do aplicativo. Sua preferência será salva para a próxima visita.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ThemeSettings />
                </CardContent>
            </Card>

            <NotificationSettings />

        </div>
    );
}
