
'use server';

import { suggestPredictions, SuggestPredictionsInput } from '@/ai/flows/suggest-predictions';

export async function getAiSuggestion(input: SuggestPredictionsInput): Promise<{ suggestion: string | null; error: string | null; }> {
  try {
    const result = await suggestPredictions(input);
    return { suggestion: result.suggestedPrediction, error: null };
  } catch (error) {
    console.error("Error getting AI suggestion:", error);
    return { suggestion: null, error: "Não foi possível obter uma sugestão da IA no momento. Tente novamente mais tarde." };
  }
}
