

'use server';

import { suggestPredictions, SuggestPredictionsInput, SuggestPredictionsOutput } from '@/ai/flows/suggest-predictions';
import { addOrUpdatePrediction } from '@/lib/firebase/firestore';
import type { Prediction, UserType } from '@/lib/types';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function getAiSuggestion(input: SuggestPredictionsInput): Promise<SuggestPredictionsOutput | { error: string }> {
  try {
    const result = await suggestPredictions(input);
    return result;
  } catch (error) {
    console.error("Error getting AI suggestion:", error);
    return { error: "Não foi possível obter uma sugestão da IA no momento. Tente novamente mais tarde." };
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


export async function saveChampionPicks(userId: string, championshipId: string, teams: string[]): Promise<{ success: boolean; error?: string; }> {
    if (!userId || !championshipId) {
        return { success: false, error: "Dados inválidos fornecidos." };
    }
    const userRef = doc(db, "users", userId);
    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
             return { success: false, error: "Usuário não encontrado." };
        }
        
        const userData = userDoc.data() as UserType;
        const existingPicks = userData.championPicks || [];
        
        const otherPicks = existingPicks.filter((p: any) => p.championshipId !== championshipId);

        await updateDoc(userRef, {
            championPicks: [...otherPicks, { championshipId, teams }]
        });
        
        return { success: true };
    } catch (error) {
        console.error("Error saving champion picks:", error);
        return { success: false, error: "Falha ao salvar os palpites de campeão." };
    }
}
