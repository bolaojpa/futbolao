// This file uses server-side code.
'use server';

/**
 * @fileOverview Implements a Genkit flow to suggest predictions based on other users' tendencies.
 *
 * - suggestPredictions - A function that suggests predictions for a given match based on other user predictions.
 * - SuggestPredictionsInput - The input type for the suggestPredictions function.
 * - SuggestPredictionsOutput - The return type for the suggestPredictionsOutput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPredictionsInputSchema = z.object({
  userNickname: z.string().describe("O apelido do usuário que está pedindo a sugestão."),
  userPosition: z.number().describe("A posição atual do usuário no ranking do campeonato."),
  totalParticipants: z.number().describe("O número total de participantes no campeonato."),
  predictionData: z
    .array(z.object({
      userNickname: z.string(),
      prediction: z.string(),
    }))
    .describe('Uma lista de palpites de outros usuários para a partida.'),
});
export type SuggestPredictionsInput = z.infer<typeof SuggestPredictionsInputSchema>;

const SuggestPredictionsOutputSchema = z.object({
  suggestedPrediction: z.string().describe('A sugestão de previsão da IA (formato: "X-Y").'),
  justification: z.string().describe("A justificativa curta e amigável para a sugestão, explicando a estratégia."),
});
export type SuggestPredictionsOutput = z.infer<typeof SuggestPredictionsOutputSchema>;

export async function suggestPredictions(input: SuggestPredictionsInput): Promise<SuggestPredictionsOutput> {
  return suggestPredictionsFlow(input);
}

const suggestPredictionsPrompt = ai.definePrompt({
  name: 'suggestPredictionsPrompt',
  input: {schema: SuggestPredictionsInputSchema},
  output: {schema: SuggestPredictionsOutputSchema},
  prompt: `Você é um assistente estratégico para um bolão de futebol chamado FutBolão Pro.

  Sua tarefa é analisar a situação de um usuário no ranking e os palpites de outros jogadores para sugerir uma aposta inteligente e personalizada.

  Situação do usuário:
  - Apelido: {{userNickname}}
  - Posição no Ranking: {{userPosition}}º de {{totalParticipants}} participantes.

  Palpites de outros jogadores:
  {{#each predictionData}}
  - {{this.userNickname}}: {{this.prediction}}
  {{/each}}

  Siga estas regras para formular sua sugestão:
  1.  Primeiro, identifique a tendência geral dos palpites. Qual o resultado mais apostado?
  2.  Analise a posição do usuário:
      - Se ele estiver no topo (primeiros 25% do ranking), sugira uma aposta mais segura, próxima da tendência geral, para manter a liderança.
      - Se ele estiver no meio da tabela, sugira uma aposta um pouco diferente da maioria para tentar ganhar posições.
      - Se ele estiver na parte de baixo do ranking (últimos 25%), sugira uma aposta mais arriscada, uma "zebra". Um resultado que poucos apostaram, pois ele precisa de um resultado diferente para subir.
  3.  A sua sugestão de placar DEVE estar no formato "Placar Time A-Placar Time B". Por exemplo: "2-1".
  4.  Forneça uma justificativa curta, amigável e estratégica para sua sugestão. Explique o porquê da sua escolha (arriscar ou jogar seguro).

  Exemplo de Justificativa: "Como você está na liderança, o mais seguro é apostar na vitória do favorito. Um 2 a 0 garante bons pontos se a maioria acertar."
  Exemplo de Justificativa 2: "Para sair das últimas posições, precisamos de uma zebra! Que tal um 1 a 0 para o time visitante? Se acontecer, você vai pular no ranking!"

  Apresente a sua sugestão em Português (PT-BR).`,
});

const suggestPredictionsFlow = ai.defineFlow(
  {
    name: 'suggestPredictionsFlow',
    inputSchema: SuggestPredictionsInputSchema,
    outputSchema: SuggestPredictionsOutputSchema,
  },
  async input => {
    const {output} = await suggestPredictionsPrompt(input);
    return output!;
  }
);
