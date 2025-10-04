

'use server';

import { suggestPredictions, SuggestPredictionsOutput } from '@/ai/flows/suggest-predictions';
import type { Prediction, UserType, SuggestPredictionsInput } from '@/lib/types';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
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

export async function savePrediction(data: Omit<Prediction, 'id' | 'createdAt' | 'updatedAt' | 'pontos' | 'palpiteCombo'>): Promise<{ success: boolean; error?: string; }> {
    try {
        const predictionsRef = collection(db, 'predictions');
        const q = query(
            predictionsRef,
            where('userId', '==', data.userId),
            where('matchId', '==', data.matchId),
            limit(1)
        );
        const snapshot = await getDocs(q);

        const userDocRef = doc(db, 'users', data.userId);
        const ultimoPalpite = {
            matchId: data.matchId,
            palpite: `${data.palpiteUsuario.placarA}-${data.palpiteUsuario.placarB}`
        };

        if (snapshot.empty) {
            await addDoc(predictionsRef, {
                ...data,
                pontos: 0,
                acertoTipo: 'erro',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        } else {
            const docId = snapshot.docs[0].id;
            const docRef = doc(db, 'predictions', docId);
            await updateDoc(docRef, {
                palpiteUsuario: data.palpiteUsuario,
                updatedAt: serverTimestamp(),
            });
        }
        
        await updateDoc(userDocRef, { ultimoPalpite, ultimaAtividade: serverTimestamp() });
        return { success: true };

    } catch (error) {
        console.error("Error saving prediction:", error);
        return { success: false, error: "Falha ao salvar o palpite no servidor." };
    }
}


export async function saveComboPick(userId: string, matchId: string, totalGols: number | null): Promise<{ success: boolean; error?: string }> {
     try {
        const predictionsRef = collection(db, 'predictions');
        const q = query(
            predictionsRef,
            where('userId', '==', userId),
            where('matchId', '==', matchId),
            limit(1)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // Se não houver palpite, cria um com placar nulo mas com o combo
             await addDoc(predictionsRef, {
                matchId,
                userId,
                palpiteUsuario: { placarA: null, placarB: null },
                palpiteCombo: totalGols !== null ? { totalGols } : null,
                pontos: 0,
                acertoTipo: 'erro',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        } else {
            // Se houver palpite, apenas atualiza o combo
            const docId = snapshot.docs[0].id;
            const docRef = doc(db, 'predictions', docId);
            await updateDoc(docRef, {
                palpiteCombo: totalGols !== null ? { totalGols } : null,
                updatedAt: serverTimestamp(),
            });
        }
        
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { ultimaAtividade: serverTimestamp() });

        return { success: true };

    } catch (error) {
        console.error("Error saving combo pick:", error);
        return { success: false, error: "Falha ao salvar a ficha de combo." };
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
