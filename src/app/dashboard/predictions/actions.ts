
'use server';

import { suggestPredictions, SuggestPredictionsInput } from '@/ai/flows/suggest-predictions';
import { addOrUpdatePrediction } from '@/lib/firebase/firestore';
import type { Prediction } from '@/lib/types';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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


export async function saveChampionPicks(userId: string, championshipId: string, teams: string[]): Promise<{ success: boolean; error?: string; }> {
    if (!userId || !championshipId || !teams) {
        return { success: false, error: "Dados inválidos fornecidos." };
    }
    const userRef = doc(db, "users", userId);
    try {
        // Primeiro, remove qualquer palpite antigo para este campeonato para evitar duplicatas
        await updateDoc(userRef, {
            championPicks: arrayRemove({ championshipId, teams: [] }) // Isso é um truque; não podemos remover sem saber o array exato, então teremos que filtrar no cliente e reescrever.
        });
        
        const userDoc = await doc(db, 'users', userId).get();
        const userData = userDoc.data();
        const existingPicks = userData.championPicks || [];
        
        const otherPicks = existingPicks.filter((p: any) => p.championshipId !== championshipId);

        // Adiciona o novo palpite
        await updateDoc(userRef, {
            championPicks: [...otherPicks, { championshipId, teams }]
        });
        
        return { success: true };
    } catch (error) {
        console.error("Error saving champion picks:", error);
        return { success: false, error: "Falha ao salvar os palpites de campeão." };
    }
}
