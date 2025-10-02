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
  currentUserMatches: z.number().describe("O número de partidas que o usuário já disputou/palpitou neste campeonato."),
  totalUserMatches: z.number().describe("O número total de partidas que o usuário disputará no campeonato."),
  predictionData: z
    .array(z.object({
      prediction: z.string().describe('O placar apostado, no formato "X-Y".'),
      count: z.number().describe('O número de usuários que apostaram neste placar.'),
    }))
    .describe('Uma lista de palpites agregados de outros usuários para a partida.'),
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
  - Andamento do campeonato: Disputou {{currentUserMatches}} de {{totalUserMatches}} partidas.

  Tendências de palpites de outros jogadores (agregado):
  {{#each predictionData}}
  - Palpite "{{this.prediction}}": {{this.count}} aposta(s)
  {{/each}}

  Siga estas regras para formular sua sugestão:
  1.  Primeiro, identifique a tendência geral dos palpites (o resultado mais apostado).
  2.  Analise a posição do usuário e o andamento do campeonato para definir a estratégia:
      -   **Estratégia Conservadora (Manter Liderança):** Se o usuário está no topo (primeiros 25%) e o campeonato está avançado (mais de 70% das partidas disputadas), sugira uma aposta segura, próxima da tendência geral, para proteger a vantagem.
      -   **Estratégia de Risco Calculado (Ganhar Posições):** Se o usuário está no meio da tabela, ou se está no topo mas no início/meio do campeonato, sugira uma aposta um pouco diferente da maioria para tentar se destacar.
      -   **Estratégia Agressiva (Tudo ou Nada):** Se o usuário está na parte de baixo do ranking (últimos 25%), especialmente se o campeonato já passou da metade, sugira uma aposta arriscada, uma "zebra". Um resultado que poucos apostaram, pois ele precisa de um resultado diferente para subir.
  3.  A sua sugestão de placar DEVE estar no formato "Placar Time A-Placar Time B". Por exemplo: "2-1".
  4.  Forneça uma justificativa curta, amigável e estratégica para sua sugestão. Explique o porquê da sua escolha (arriscar, jogar seguro, se diferenciar) com base na situação do usuário no campeonato. NÃO mencione os palpites dos outros usuários diretamente na sua justificativa.

  Exemplo de Justificativa para Estratégia Conservadora: "Na reta final e na liderança, o ideal é não arriscar. Um 2-0 segue a tendência e garante pontos importantes para manter a ponta!"
  Exemplo de Justificativa para Risco Calculado: "Para dar um salto na tabela, que tal um empate surpreendente? Um 1-1 pode render pontos valiosos que a maioria não terá."
  Exemplo de Justificativa para Estratégia Agressiva: "Para sair das últimas posições, precisamos de uma zebra! Que tal um 1 a 0 para o time visitante? Se acontecer, você vai pular no ranking!"

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
