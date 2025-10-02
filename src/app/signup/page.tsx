
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, User, AtSign, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getSystemSettings, updateUserLastLogin, getTeams } from '@/lib/firebase/firestore';
import type { Team } from '@/lib/types';
import { Combobox } from '@/components/ui/combobox';


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

export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [nome, setNome] = useState('');
    const [apelido, setApelido] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [timeCoracao, setTimeCoracao] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchTeams() {
            try {
                const fetchedTeams = await getTeams();
                setTeams(fetchedTeams.filter(t => t.type === 'club'));
            } catch (error) {
                toast({ title: "Erro ao buscar times", variant: "destructive" });
            }
        }
        fetchTeams();
    }, [toast]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        const settings = await getSystemSettings();
        if (!settings.allowRegistrations) {
            toast({
                variant: "destructive",
                title: "Cadastro Desabilitado",
                description: "O cadastro de novos usuários está temporariamente desabilitado. Fale com o administrador.",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Erro de Cadastro",
                description: "As senhas não coincidem.",
            });
            return;
        }
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user info in Firestore
            await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                nome,
                apelido: apelido || '', // Garante que seja uma string vazia se não preenchido
                email: user.email,
                fotoPerfil: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=random`,
                status: 'pendente',
                funcao: 'usuario',
                dataCadastro: serverTimestamp(),
                timeCoracao: timeCoracao || '',
                titulos: 0,
                totalJogos: 0,
                championshipStats: [],
            });
            
            router.push('/pending-approval');

        } catch (error: any) {
            let description = "Ocorreu um erro durante o cadastro. Tente novamente.";
            if (error.code === 'auth/email-already-in-use') {
                description = "Este endereço de e-mail já está em uso.";
            } else if (error.code === 'auth/weak-password') {
                description = "A senha é muito fraca. Tente uma senha com pelo menos 6 caracteres.";
            }
            toast({
                variant: "destructive",
                title: "Erro de Cadastro",
                description: description,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setIsLoading(true);
         const settings = await getSystemSettings();
        if (!settings.allowRegistrations) {
            toast({
                variant: "destructive",
                title: "Cadastro Desabilitado",
                description: "O cadastro de novos usuários está temporariamente desabilitado. Fale com o administrador.",
            });
             setIsLoading(false);
            return;
        }

        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

             await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                nome: user.displayName,
                apelido: '', // Apelido começa em branco
                email: user.email,
                fotoPerfil: user.photoURL,
                status: 'pendente',
                funcao: 'usuario',
                dataCadastro: serverTimestamp(),
                titulos: 0,
                totalJogos: 0,
                championshipStats: [],
            }, { merge: true }); // Merge to not overwrite existing data if user logs in again

            router.push('/pending-approval');
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro ao cadastrar com Google",
                description: "Não foi possível criar a conta com o Google. Tente novamente.",
            });
        } finally {
            setIsLoading(false);
        }
    };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Crie sua conta</CardTitle>
          <CardDescription>Junte-se ao FutBolão Pro e comece a palpitar!</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignup} disabled={isLoading}>
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Continuar com Google
              </Button>
              <div className="flex items-center space-x-2">
                  <Separator className="flex-1" />
                  <span className="px-2 text-xs text-muted-foreground">OU</span>
                  <Separator className="flex-1" />
              </div>
              <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input type="text" placeholder="Nome completo" className="pl-10" required value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input type="text" placeholder="Apelido (como aparecerá no ranking)" className="pl-10" value={apelido} onChange={(e) => setApelido(e.target.value)} />
              </div>
               <div className="relative">
                 <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                 <Combobox
                    options={teams.map(t => ({ label: t.name, value: t.name }))}
                    value={timeCoracao}
                    onChange={setTimeCoracao}
                    placeholder="Time do Coração (opcional)"
                    searchPlaceholder="Buscar time..."
                    notFoundMessage="Nenhum time encontrado."
                />
              </div>
              <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input type="email" placeholder="seu@email.com" className="pl-10" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input type="password" placeholder="Crie uma senha forte" className="pl-10" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input type="password" placeholder="Confirme sua senha" className="pl-10" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            <div className="text-center text-sm">
              Já tem uma conta?{' '}
              <Link href="/" className="font-semibold text-primary hover:underline">
                Faça login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

