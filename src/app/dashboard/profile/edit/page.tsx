import { EditProfileForm } from '@/components/profile/edit-profile-form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function EditProfilePage() {
    return (
        <div className="container mx-auto space-y-8">
             <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Editar Perfil</CardTitle>
                    <CardDescription>
                        Atualize suas informações pessoais. Suas alterações serão refletidas em todo o site.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EditProfileForm />
                </CardContent>
            </Card>
        </div>
    );
}
