
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function AccountBlockedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center shadow-2xl">
        <CardHeader>
          <div className="mx-auto bg-red-100 dark:bg-red-900/50 p-3 rounded-full w-fit">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-headline mt-4">Conta Bloqueada</CardTitle>
          <CardDescription>
            Sua conta foi bloqueada por um administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Se você acredita que isso é um engano, por favor, entre em contato com o suporte para mais informações.
          </p>
          <p className="font-semibold text-primary mt-4">suporte@futbolao.pro</p>
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
