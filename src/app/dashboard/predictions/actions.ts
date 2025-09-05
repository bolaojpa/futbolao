
'use server';

import { suggestPredictions, SuggestPredictionsInput } from '@/ai/flows/suggest-predictions';
import { addOrUpdatePrediction } from '@/lib/firebase/firestore';
import type { Prediction } from '@/lib/types';

export async function getAiSuggestion(input: SuggestPredictionsInput): Promise<{ suggestion: string | null; error: string | null; }> {
  try {
    const result = await suggestPredictions(input);
    return { suggestion: result.suggestedPrediction, error: null };
  } catch (error) {
    console.error("Error getting AI suggestion:", error);
    return { suggestion: null, error: "Não foi possível obter uma sugestão da IA no momento. Tente novamente mais tarde." };
  }
}

export async function savePrediction(data: Omit<Prediction, 'id' | 'createdAt' | 'updatedAt' | 'pontos'>): Promise<{ success: boolean; error?: string; }> {
    try {
        await addOrUpdatePrediction({
            ...data,
            pontos: 0, // Pontuação inicial é sempre 0
        });
        return { success: true };
    } catch (error) {
        console.error("Error saving prediction:", error);
        return { success: false, error: "Falha ao salvar o palpite no servidor." };
    }
}
