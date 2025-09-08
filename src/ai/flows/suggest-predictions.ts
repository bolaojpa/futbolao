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
  matchId: z.string().describe('The ID of the match to suggest predictions for.'),
  predictionData: z
    .array(z.object({
      userNickname: z.string(),
      prediction: z.string(),
    }))
    .describe('An array of user predictions for the match.'),
});
export type SuggestPredictionsInput = z.infer<typeof SuggestPredictionsInputSchema>;

const SuggestPredictionsOutputSchema = z.object({
  suggestedPrediction: z.string().describe('A sugestão de previsão da IA com base nas tendências dos palpites dos usuários (formato: "X-Y").'),
});
export type SuggestPredictionsOutput = z.infer<typeof SuggestPredictionsOutputSchema>;

export async function suggestPredictions(input: SuggestPredictionsInput): Promise<SuggestPredictionsOutput> {
  return suggestPredictionsFlow(input);
}

const suggestPredictionsPrompt = ai.definePrompt({
  name: 'suggestPredictionsPrompt',
  input: {schema: SuggestPredictionsInputSchema},
  output: {schema: SuggestPredictionsOutputSchema},
  prompt: `Você é um especialista em futebol e apostas esportivas.

  Com base nas seguintes previsões de outros usuários para a partida com ID {{matchId}}, analise a tendência e sugira uma previsão com alta probabilidade de acerto.

  Previsões dos usuários:
  {{#each predictionData}}
  - {{this.userNickname}}: {{this.prediction}}
  {{/each}}

  A sua sugestão final DEVE estar no formato "Placar Time A - Placar Time B", por exemplo: "2-1". Não adicione nenhum texto extra.
  Apresente a sua sugestão de previsão em Português (PT-BR).`,
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
