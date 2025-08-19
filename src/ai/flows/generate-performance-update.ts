// This file uses server-side code.
'use server';

/**
 * @fileOverview Implements a Genkit flow to generate personalized performance update notifications.
 *
 * - generatePerformanceUpdate - A function that creates a personalized message based on a user's recent performance.
 * - PerformanceUpdateInput - The input type for the generatePerformanceUpdate function.
 * - PerformanceUpdateOutput - The return type for the generatePerformanceUpdate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PerformanceUpdateInputSchema = z.object({
  apelido: z.string().describe('O apelido do usuário.'),
  pontosGanhos: z.number().describe('O total de pontos que o usuário ganhou na última rodada.'),
  novaPosicao: z.number().describe('A nova posição do usuário no ranking.'),
  posicaoAnterior: z.number().describe('A posição anterior do usuário no ranking.'),
});
export type PerformanceUpdateInput = z.infer<typeof PerformanceUpdateInputSchema>;

const PerformanceUpdateOutputSchema = z.object({
  titulo: z.string().describe('Um título curto e impactante para a notificação.'),
  mensagem: z.string().describe('A mensagem de notificação personalizada e amigável.'),
});
export type PerformanceUpdateOutput = z.infer<typeof PerformanceUpdateOutputSchema>;

export async function generatePerformanceUpdate(input: PerformanceUpdateInput): Promise<PerformanceUpdateOutput> {
  return generatePerformanceUpdateFlow(input);
}

const generatePerformanceUpdatePrompt = ai.definePrompt({
  name: 'generatePerformanceUpdatePrompt',
  input: {schema: PerformanceUpdateInputSchema},
  output: {schema: PerformanceUpdateOutputSchema},
  prompt: `Você é um comentarista de um app de apostas esportivas chamado FutBolão Pro.
  Sua tarefa é criar uma notificação curta, amigável e personalizada para um usuário com base em seu desempenho na última rodada.

  Dados do usuário:
  - Apelido: {{apelido}}
  - Pontos Ganhos na Rodada: {{pontosGanhos}}
  - Posição Anterior: {{posicaoAnterior}}º
  - Nova Posição: {{novaPosicao}}º

  Se o usuário subiu no ranking (novaPosicao < posicaoAnterior), crie um título e uma mensagem de parabenização. Ex: "Você subiu no ranking!".
  Se o usuário desceu no ranking (novaPosicao > posicaoAnterior), crie uma mensagem de incentivo. Ex: "Continue na disputa!".
  Se ele manteve a posição, comente sobre a consistência. Ex: "Você se manteve firme!".
  Se os pontos ganhos foram 0, crie uma mensagem de incentivo para a próxima rodada.

  Seja criativo e use uma linguagem informal e divertida, como se fosse um amigo comentando o desempenho.
  Apresente a sua sugestão de notificação em Português (PT-BR).`,
});

const generatePerformanceUpdateFlow = ai.defineFlow(
  {
    name: 'generatePerformanceUpdateFlow',
    inputSchema: PerformanceUpdateInputSchema,
    outputSchema: PerformanceUpdateOutputSchema,
  },
  async input => {
    // Em uma aplicação real, aqui poderíamos adicionar lógica extra,
    // como buscar mais dados do usuário antes de chamar a IA.
    const {output} = await generatePerformanceUpdatePrompt(input);
    return output!;
  }
);
