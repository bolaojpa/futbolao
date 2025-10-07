

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, User, AtSign, Heart } from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, query, collection, where, getDocs, updateDoc as firestoreUpdateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getSystemSettings, updateUserLastLogin, getTeams, addLog } from '@/lib/firebase/firestore';
import type { Team, UserType } from '@/lib/types';
import { Combobox } from '@/components/ui/combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleIcon } from '@/components/shared/icons';

function AppLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 2a10 10 0 1 0-7.07 17.07" />
            <path d="m12 12-2 4 4 2 2-4-4-2z" />
        </svg>
    )
}

export default function WelcomePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Common state for both forms
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Signup-only state
    const [nome, setNome] = useState('');
    const [apelido, setApelido] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [timeCoracao, setTimeCoracao] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);

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

    const handleRedirectBasedOnUser = async (user: FirebaseUser) => {
        const userDocRef = doc(db, "users", user.uid);
        const providerId = user.providerData[0]?.providerId || 'password';
        try {
            await updateUserLastLogin(user.uid, providerId); // Passa o providerId
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data() as UserType;
                 await addLog({
                    action: 'login',
                    actor: { id: userData.id, apelido: userData.apelido, funcao: userData.funcao },
                    details: `Login bem-sucedido via ${user.providerData[0]?.providerId || 'email'}.`
                });

                if (userData.funcao === 'admin' || userData.funcao === 'moderator') router.push('/admin');
                else if (userData.status === 'pendente') router.push('/pending-approval');
                else if (userData.status === 'bloqueado') router.push('/account-blocked');
                else router.push('/dashboard');
            } else {
                router.push('/pending-approval');
            }
        } catch (error) {
            console.error("Error fetching user data for redirect:", error);
            toast({ variant: "destructive", title: "Erro de Redirecionamento", description: "Não foi possível buscar seus dados. Redirecionando para o dashboard." });
            router.push('/dashboard');
        }
    };

    const handleGoogleAuth = async (isSigningUp: boolean) => {
        setIsLoading(true);
        const settings = await getSystemSettings();
        if (isSigningUp && !settings.allowRegistrations) {
            toast({ variant: "destructive", title: "Cadastro Desabilitado", description: "O cadastro de novos usuários está temporariamente desabilitado." });
            setIsLoading(false);
            return;
        }

        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const googleUser = result.user;
            const userDocRef = doc(db, "users", googleUser.uid);
            const userDoc = await getDoc(userDocRef);
            const providerId = googleUser.providerData[0]?.providerId || 'google.com';

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    id: googleUser.uid, nome: googleUser.displayName, apelido: googleUser.displayName?.split(' ')[0] || googleUser.email, email: googleUser.email, fotoPerfil: googleUser.photoURL, status: 'pendente', funcao: 'usuario', dataCadastro: serverTimestamp(), titulos: 0, totalJogos: 0, championshipStats: [], urlImagemPersonalizada: '', presenceStatus: 'Disponível', providerId: providerId,
                });
            } else {
                const existingData = userDoc.data() as UserType;
                const updates: Partial<UserType> = { 
                    nome: googleUser.displayName || existingData.nome,
                    providerId: providerId 
                };
                
                if (!existingData.urlImagemPersonalizada && googleUser.photoURL) {
                    updates.fotoPerfil = googleUser.photoURL;
                }
                
                await firestoreUpdateDoc(userDocRef, updates);
            }
            handleRedirectBasedOnUser(googleUser);
        } catch (error: any) {
            toast({ variant: "destructive", title: `Erro ao autenticar com Google`, description: "Não foi possível autenticar com o Google. Tente novamente." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            handleRedirectBasedOnUser(userCredential.user);
        } catch (error: any) {
            await addLog({
                action: 'login_fail',
                actor: { id: 'system', apelido: email, funcao: 'usuario' },
                details: `Falha no login para o email: ${email}`
            });
            toast({
                variant: "destructive",
                title: "Erro de Login",
                description: "Email ou senha inválidos. Por favor, tente novamente.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        const settings = await getSystemSettings();
        if (!settings.allowRegistrations) {
            toast({ variant: "destructive", title: "Cadastro Desabilitado", description: "O cadastro de novos usuários está temporariamente desabilitado. Fale com o administrador." });
            return;
        }
        if (password !== confirmPassword) {
            toast({ variant: "destructive", title: "Erro de Cadastro", description: "As senhas não coincidem." });
            return;
        }
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                nome,
                apelido: apelido || '',
                email: user.email,
                fotoPerfil: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=random`,
                status: 'pendente',
                funcao: 'usuario',
                providerId: 'password',
                dataCadastro: serverTimestamp(),
                timeCoracao: timeCoracao || '',
                titulos: 0,
                totalJogos: 0,
                championshipStats: [],
                urlImagemPersonalizada: '',
                presenceStatus: 'Disponível',
            });
            router.push('/pending-approval');
        } catch (error: any) {
            let description = "Ocorreu um erro durante o cadastro. Tente novamente.";
            if (error.code === 'auth/email-already-in-use') {
                description = "Este endereço de e-mail já está em uso.";
            } else if (error.code === 'auth/weak-password') {
                description = "A senha é muito fraca. Tente uma senha com pelo menos 6 caracteres.";
            }
            toast({ variant: "destructive", title: "Erro de Cadastro", description });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="flex flex-col items-center justify-center text-center mb-8">
                <AppLogo />
                <h1 className="text-4xl font-bold font-headline mt-4">FutBolão Pro</h1>
                <p className="text-muted-foreground mt-2">Seu app de palpites de futebol.</p>
            </div>
            <Tabs defaultValue="login" className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Entrar</TabsTrigger>
                    <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <Card className="shadow-none border-t-0 rounded-t-none">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-headline">Acesse sua conta</CardTitle>
                            <CardDescription>Use sua conta para continuar.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" className="w-full" type="button" onClick={() => handleGoogleAuth(false)} disabled={isLoading}>
                                <GoogleIcon className="mr-2 h-4 w-4" /> Continuar com Google
                            </Button>
                            <div className="flex items-center space-x-2 my-4">
                                <Separator className="flex-1" />
                                <span className="px-2 text-xs text-muted-foreground">OU</span>
                                <Separator className="flex-1" />
                            </div>
                            <form onSubmit={handleEmailLogin} className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input type="email" placeholder="seu@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input type="password" placeholder="Sua senha" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="remember-me" disabled={isLoading} />
                                        <Label htmlFor="remember-me" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"> Manter conectado </Label>
                                    </div>
                                    <Link href="/forgot-password" passHref className={cn('text-sm font-semibold text-primary hover:underline', isLoading && 'pointer-events-none')}> Esqueceu a senha? </Link>
                                </div>
                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                                    {isLoading ? 'Entrando...' : 'Entrar com Email'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="signup">
                     <Card className="shadow-none border-t-0 rounded-t-none">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-headline">Crie sua conta</CardTitle>
                            <CardDescription>É rápido e fácil. Vamos começar!</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" className="w-full" type="button" onClick={() => handleGoogleAuth(true)} disabled={isLoading}>
                                <GoogleIcon className="mr-2 h-4 w-4" /> Cadastrar com Google
                            </Button>
                            <div className="flex items-center space-x-2 my-4">
                                <Separator className="flex-1" />
                                <span className="px-2 text-xs text-muted-foreground">OU</span>
                                <Separator className="flex-1" />
                            </div>
                            <form onSubmit={handleEmailSignup} className="space-y-4">
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
                                    <Combobox options={teams.map(t => ({ label: t.name, value: t.name }))} value={timeCoracao} onChange={setTimeCoracao} placeholder="Time do Coração (opcional)" searchPlaceholder="Buscar time..." notFoundMessage="Nenhum time encontrado." className="pl-10" />
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
                                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                                    {isLoading ? 'Criando conta...' : 'Criar Conta com Email'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
