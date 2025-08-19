import { EditProfileForm } from '@/components/profile/edit-profile-form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { User } from 'lucide-react';

export default function EditProfilePage() {
    return (
        <div className="container mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <User className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Editar Perfil</h1>
                    <p className="text-muted-foreground">
                        Atualize suas informações pessoais e de exibição.
                    </p>
                </div>
            </div>
             <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Suas Informações</CardTitle>
                    <CardDescription>
                        Suas alterações serão refletidas em todo o site.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EditProfileForm />
                </CardContent>
            </Card>
        </div>
    );
}
