import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Trophy, Users, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const features = [
    {
      icon: <Trophy className="w-6 h-6 text-primary" />,
      title: 'Compita com Amigos',
      description: 'Crie ou participe de bolões e mostre quem entende mais de futebol.',
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: 'Ranking em Tempo Real',
      description: 'Acompanhe sua posição e a de outros jogadores a cada rodada.',
    },
    {
      icon: <BrainCircuit className="w-6 h-6 text-primary" />,
      title: 'Sugestões com IA',
      description: 'Use nossa inteligência artificial para te ajudar a dar palpites mais certeiros.',
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-primary" />,
      title: 'Resultados e Pontuação',
      description: 'Confira os placares e sua pontuação assim que as partidas acabam.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-blue-100 dark:from-background dark:to-gray-900">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary font-headline">FutBolão Pro</h1>
        <nav>
          <Button asChild variant="ghost">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild className="bg-accent hover:bg-accent/90">
            <Link href="/signup">Criar Conta</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 flex flex-col items-center justify-center text-center">
        <section className="py-20 md:py-32">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 font-headline tracking-tight">
            A Emoção do Futebol na Palma da Sua Mão
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Participe de bolões, desafie seus amigos e prove que você é o mestre dos palpites. Com rankings em tempo real e a ajuda da nossa IA, a diversão é garantida.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/signup">Comece a Jogar Agora</Link>
          </Button>
        </section>

        <section id="features" className="w-full py-20">
            <h3 className="text-3xl font-bold mb-12 text-center font-headline">Tudo que você precisa para ser o campeão</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="bg-card/80 backdrop-blur-sm border-border/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <CardTitle className="font-headline text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FutBolão Pro. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
