'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, User, AtSign } from 'lucide-react';
import Link from 'next/link';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15.545 6.558C16.803 6.026 18.225 5.5 19.82 5.5c2.815 0 5.18 2.04 5.18 4.75 0 2.45-1.68 4.425-3.955 4.918" />
            <path d="M16.5 10.5c0-1.24.96-2.25 2.25-2.25s2.25.96 2.25 2.25-.96 2.25-2.25 2.25-2.25-1.01-2.25-2.25Z" />
            <path d="M12.25 21.5c-4.22 0-7.75-3.48-7.75-7.75S8.03 6 12.25 6s7.75 3.48 7.75 7.75" />
            <path d="M3.5 13.75c0-3.322 2.678-6 6-6" />
            <path d="m9.25 13.75-1.5-1.5" />
            <path d="m9.25 13.75 1.5-1.5" />
        </svg>
    )
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Crie sua conta</CardTitle>
          <CardDescription>Junte-se ao FutBolão Pro e comece a palpitar!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button variant="outline" className="w-full">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Criar conta com Google
            </Button>
            <div className="flex items-center space-x-2">
                <Separator className="flex-1" />
                <span className="px-2 text-xs text-muted-foreground">OU</span>
                <Separator className="flex-1" />
            </div>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="text" placeholder="Nome completo" className="pl-10" />
            </div>
            <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="text" placeholder="Apelido (como aparecerá no ranking)" className="pl-10" />
            </div>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="email" placeholder="seu@email.com" className="pl-10" />
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="password" placeholder="Crie uma senha forte" className="pl-10" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/dashboard">Criar Conta</Link>
            </Button>
          <div className="text-center text-sm">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
