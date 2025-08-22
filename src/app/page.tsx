
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
        >
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
        </svg>
    )
}

function AppLogo() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-12 h-12 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 2a10 10 0 1 0-7.07 17.07" />
            <path d="m12 12-2 4 4 2 2-4-4-2z" />
        </svg>
    )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
       <div className="flex flex-col items-center justify-center text-center mb-8">
            <AppLogo />
            <h1 className="text-4xl font-bold font-headline mt-4">FutBolão Pro</h1>
            <p className="text-muted-foreground mt-2">Seu app de palpites de futebol.</p>
       </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Acessar sua conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <Button variant="outline" className="w-full">
              <GoogleIcon className="mr-2 h-4 w-4" />
              Continuar com Google
            </Button>
            <div className="flex items-center space-x-2">
                <Separator className="flex-1" />
                <span className="px-2 text-xs text-muted-foreground">OU</span>
                <Separator className="flex-1" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="email" placeholder="seu@email.com" className="pl-10" />
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="password" placeholder="Sua senha" className="pl-10" />
            </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Checkbox id="remember-me" />
                    <Label htmlFor="remember-me" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Mantenha-me conectado
                    </Label>
                </div>
                <Link href="/forgot-password" passHref>
                    <span className="text-sm font-semibold text-primary hover:underline">
                        Esqueceu a senha?
                    </span>
                </Link>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full bg-primary hover:bg-primary/90">
            <Link href="/dashboard">Entrar</Link>
          </Button>
          <div className="text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Crie uma agora
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
