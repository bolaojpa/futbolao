

'use server';

import { suggestPredictions, SuggestPredictionsOutput } from '@/ai/flows/suggest-predictions';
import type { Prediction, UserType, SuggestPredictionsInput, Match } from '@/lib/types';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addLog } from '@/lib/firebase/firestore';

export async function getAiSuggestion(input: SuggestPredictionsInput): Promise<SuggestPredictionsOutput | { error: string }> {
  try {
    const result = await suggestPredictions(input);
    return result;
  } catch (error) {
    console.error("Error getting AI suggestion:", error);
    return { error: "Não foi possível obter uma sugestão da IA no momento. Tente novamente mais tarde." };
  }
}

export async function savePrediction(data: Omit<Prediction, 'id' | 'createdAt' | 'updatedAt' | 'pontos' | 'palpiteCombo'>, actor: Pick<UserType, 'id' | 'apelido' | 'funcao'>): Promise<{ success: boolean; error?: string; }> {
    try {
        const predictionsRef = collection(db, 'predictions');
        const q = query(
            predictionsRef,
            where('userId', '==', data.userId),
            where('matchId', '==', data.matchId),
            limit(1)
        );
        const snapshot = await getDocs(q);

        const matchDocRef = doc(db, 'matches', data.matchId);
        const matchDoc = await getDoc(matchDocRef);
        const matchData = matchDoc.data() as Match | undefined;
        const matchName = matchData ? `${matchData.timeA} vs ${matchData.timeB}` : `partida desconhecida`;

        const userDocRef = doc(db, 'users', data.userId);
        const palpiteText = `${data.palpiteUsuario.placarA}-${data.palpiteUsuario.placarB}`;
        const ultimoPalpite = {
            matchId: data.matchId,
            palpite: palpiteText
        };
        
        let activityDescription: string;

        if (snapshot.empty) {
            await addDoc(predictionsRef, {
                ...data,
                pontos: 0,
                acertoTipo: 'erro',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            activityDescription = `Fez um novo palpite (${palpiteText}) para ${matchName}`;
        } else {
            const docId = snapshot.docs[0].id;
            const docRef = doc(db, 'predictions', docId);
            await updateDoc(docRef, {
                palpiteUsuario: data.palpiteUsuario,
                updatedAt: serverTimestamp(),
            });
            activityDescription = `Alterou um palpite para (${palpiteText}) em ${matchName}`;
        }
        
        const ultimaAtividade = {
            timestamp: serverTimestamp(),
            description: activityDescription,
        };

        await updateDoc(userDocRef, { ultimoPalpite, ultimaAtividade });

        // Adiciona log da ação
        await addLog({
            action: 'prediction_update',
            actor: actor,
            details: activityDescription,
        });

        return { success: true };

    } catch (error) {
        console.error("Error saving prediction:", error);
        return { success: false, error: "Falha ao salvar o palpite no servidor." };
    }
}


export async function saveComboPick(userId: string, matchId: string, totalGols: number | null, actor: Pick<UserType, 'id' | 'apelido' | 'funcao'>): Promise<{ success: boolean; error?: string }> {
     try {
        const predictionsRef = collection(db, 'predictions');
        const q = query(
            predictionsRef,
            where('userId', '==', userId),
            where('matchId', '==', matchId),
            limit(1)
        );
        const snapshot = await getDocs(q);
        const now = serverTimestamp();
        let activityDescription = '';
        
        const matchDocRef = doc(db, 'matches', matchId);
        const matchDoc = await getDoc(matchDocRef);
        const matchData = matchDoc.data() as Match | undefined;
        const matchName = matchData ? `${matchData.timeA} vs ${matchData.timeB}` : `partida desconhecida`;


        if (snapshot.empty) {
             await addDoc(predictionsRef, {
                matchId,
                userId,
                palpiteUsuario: { placarA: null, placarB: null },
                palpiteCombo: totalGols !== null ? { totalGols } : null,
                pontos: 0,
                acertoTipo: 'erro',
                createdAt: now,
                updatedAt: now,
            });
            activityDescription = `Usou uma Ficha de Combo (${totalGols} gols) em ${matchName}`;
        } else {
            const docId = snapshot.docs[0].id;
            const docRef = doc(db, 'predictions', docId);
            await updateDoc(docRef, {
                palpiteCombo: totalGols !== null ? { totalGols } : null,
                updatedAt: now,
            });
            activityDescription = totalGols !== null 
                ? `Alterou uma Ficha de Combo para (${totalGols} gols) em ${matchName}`
                : `Removeu uma Ficha de Combo de ${matchName}`;
        }
        
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { ultimaAtividade: { timestamp: now, description: activityDescription } });

        await addLog({
            action: 'prediction_update',
            actor: actor,
            details: activityDescription,
        });

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
            championPicks: [...otherPicks, { championshipId, teams }],
            ultimaAtividade: {
                timestamp: serverTimestamp(),
                description: "Salvou palpites de campeão"
            }
        });
        
        return { success: true };
    } catch (error) {
        console.error("Error saving champion picks:", error);
        return { success: false, error: "Falha ao salvar os palpites de campeão." };
    }
}
