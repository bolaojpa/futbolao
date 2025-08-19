
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hourglass } from "lucide-react";
import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center shadow-2xl">
        <CardHeader>
          <div className="mx-auto bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-full w-fit">
            <Hourglass className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl font-headline mt-4">Cadastro em Análise</CardTitle>
          <CardDescription>
            Sua conta foi criada com sucesso e está aguardando aprovação de um administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Você receberá uma notificação por e-mail assim que sua conta for ativada. Isso geralmente leva algumas horas. Agradecemos a sua paciência!
          </p>
        </CardContent>
        <CardContent>
          <Button asChild>
            <Link href="/login">Voltar para o Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
