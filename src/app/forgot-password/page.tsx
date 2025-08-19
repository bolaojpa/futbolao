
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu e-mail e enviaremos um link para você voltar a acessar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="email" placeholder="seu@email.com" className="pl-10" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Enviar Link de Recuperação
          </Button>
          <div className="text-center text-sm">
            Lembrou sua senha?{' '}
            <Link href="/" className="font-semibold text-primary hover:underline">
              Voltar para o Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
