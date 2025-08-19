
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  // Em uma aplicação real, aqui teríamos a lógica para extrair
  // o 'actionCode' da URL e verificar sua validade com o Firebase.
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Redefinir sua Senha</CardTitle>
          <CardDescription>
            Crie uma nova senha forte para sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="password" placeholder="Nova senha" className="pl-10" />
            </div>
             <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="password" placeholder="Confirme a nova senha" className="pl-10" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            {/* O link aqui seria dinâmico após a redefinição bem-sucedida */}
            <Link href="/">Salvar Nova Senha</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
