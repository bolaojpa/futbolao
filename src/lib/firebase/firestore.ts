

import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit,
  getDoc,
  increment,
  runTransaction,
  Timestamp,
  setDoc,
  arrayUnion,
} from 'firebase/firestore';
import type { UserType, Team, Championship, Match, Prediction, Notification, EmergencyMessage } from '../types';

/**
 * Fetches all users from the Firestore 'users' collection.
 */
export async function getUsers(): Promise<UserType[]> {
  const usersCollection = collection(db, 'users');
  const userSnapshot = await getDocs(usersCollection);
  const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserType));
  return userList;
}

/**
 * Updates the status of a specific user in Firestore.
 * @param userId - The ID of the user to update.
 * @param newStatus - The new status to set for the user.
 */
export async function updateUserStatus(userId: string, newStatus: UserType['status']) {
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, { status: newStatus });
}

/**
 * Updates the role of a specific user in Firestore.
 * @param userId - The ID of the user to update.
 * @param newRole - The new role to set for the user.
 */
export async function updateUserRole(userId: string, newRole: UserType['funcao']) {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { funcao: newRole });
}

/**
 * Deletes multiple users from Firestore in a single batch operation.
 * @param userIds - An array of user IDs to delete.
 */
export async function deleteUsers(userIds: string[]): Promise<void> {
    const batch = writeBatch(db);

    userIds.forEach(userId => {
        const userDocRef = doc(db, 'users', userId);
        batch.delete(userDocRef);
    });

    await batch.commit();
}


/**
 * Updates a user's stats for a specific championship after a match is finalized.
 * This function handles creating the stats object if it doesn't exist and increments stats.
 * @param userId The ID of the user to update.
 * @param championshipId The ID of the championship for which to update stats.
 * @param pointsGanhos The points earned in the finalized match.
 * @param acertoTipo The type of hit ('bucha', 'situacao', etc.)
 * @param predictionId The ID of the prediction document to update with the points.
 */
export async function updateUserStatsAfterMatch(
    userId: string, 
    championshipId: string,
    pointsGanhos: number,
    acertoTipo: Prediction['acertoTipo'],
    predictionId: string
) {
    const userRef = doc(db, 'users', userId);
    const predictionRef = doc(db, 'predictions', predictionId);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error(`User with ID ${userId} does not exist!`);
            }

            // 1. Update a pontuação e o tipo de acerto no documento de palpite
            transaction.update(predictionRef, { pontos: pointsGanhos, acertoTipo: acertoTipo });

            const userData = userDoc.data() as UserType;
            let champStats = [...(userData.championshipStats || [])];
            let statsIndex = champStats.findIndex(s => s.championshipId === championshipId);
            
            const isAcertoExato = acertoTipo === 'bucha' || acertoTipo === 'combo';
            const isAcertoSituacao = acertoTipo === 'situacao' || acertoTipo === 'bonus';

            if (statsIndex === -1) {
                // Se não existem stats para este campeonato, cria um novo registro
                champStats.push({
                    championshipId: championshipId,
                    pontos: pointsGanhos,
                    acertosExatos: isAcertoExato ? 1 : 0,
                    acertosSituacao: isAcertoSituacao ? 1 : 0,
                    maiorSequencia: 0 // Inicia a maior sequência como 0
                });
            } else {
                // Se já existem, incrementa os valores
                const existingStats = champStats[statsIndex];
                existingStats.pontos = (existingStats.pontos || 0) + pointsGanhos;
                if (isAcertoExato) existingStats.acertosExatos = (existingStats.acertosExatos || 0) + 1;
                if (isAcertoSituacao) existingStats.acertosSituacao = (existingStats.acertosSituacao || 0) + 1;
            }
            
            // 3. Atualiza o documento do usuário com os novos stats e incrementa o total de jogos
            transaction.update(userRef, { 
                championshipStats: champStats,
                totalJogos: increment(1),
                ultimaAtividade: serverTimestamp(),
            });
        });
    } catch (e) {
        console.error("User stats update transaction failed: ", e);
        throw e;
    }
}


/**
 * Resets the statistics for a specific user.
 * This includes setting total games and titles to 0, clearing championship stats,
 * and deleting all of the user's prediction documents.
 * @param userId - The ID of the user to reset.
 */
export async function resetUserStats(userId: string): Promise<void> {
    const batch = writeBatch(db);

    // 1. Reset user document stats
    const userDocRef = doc(db, 'users', userId);
    batch.update(userDocRef, {
        championshipStats: [],
        totalJogos: 0,
        titulos: 0,
        ultimoPalpite: null
    });

    // 2. Find and delete all predictions for the user
    const predictionsRef = collection(db, 'predictions');
    const predictionsQuery = query(predictionsRef, where('userId', '==', userId));
    const predictionsSnapshot = await getDocs(predictionsQuery);

    predictionsSnapshot.forEach(predictionDoc => {
        batch.delete(predictionDoc.ref);
    });

    // 3. Commit all operations
    await batch.commit();
}


/**
 * Fetches all teams from the Firestore 'teams' collection.
 */
export async function getTeams(): Promise<Team[]> {
  const teamsCollection = collection(db, 'teams');
  const q = query(teamsCollection, orderBy('name', 'asc'));
  const teamSnapshot = await getDocs(q);
  const teamList = teamSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
  return teamList;
}

/**
 * Adds a new team to the Firestore 'teams' collection.
 * @param teamData - The data for the new team.
 */
export async function addTeam(teamData: Omit<Team, 'id'>): Promise<Team> {
  const teamsCollection = collection(db, 'teams');
  const docRef = await addDoc(teamsCollection, teamData);
  return { id: docRef.id, ...teamData };
}

/**
 * Deletes multiple teams from Firestore in a single batch operation.
 * @param teamIds - An array of team IDs to delete.
 */
export async function deleteTeams(teamIds: string[]): Promise<void> {
    const batch = writeBatch(db);

    teamIds.forEach(teamId => {
        const teamDocRef = doc(db, 'teams', teamId);
        batch.delete(teamDocRef);
    });

    await batch.commit();
}

/**
 * Fetches all championships from the Firestore 'championships' collection,
 * sorted by creation date (newest first).
 */
export async function getChampionships(): Promise<Championship[]> {
    const championshipsCollection = collection(db, 'championships');
    const q = query(championshipsCollection, orderBy('createdAt', 'desc'));
    const championshipSnapshot = await getDocs(q);
    const championshipList = championshipSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Championship));
    return championshipList;
}


/**
 * Adds a new championship to the Firestore 'championships' collection.
 * @param championshipData - The data for the new championship.
 */
export async function addChampionship(championshipData: Omit<Championship, 'id' | 'status' | 'createdAt'>): Promise<Championship> {
    const championshipsCollection = collection(db, 'championships');
    const dataWithTimestamp = {
        ...championshipData,
        status: 'ativo' as const,
        createdAt: serverTimestamp() 
    };
    const docRef = await addDoc(championshipsCollection, dataWithTimestamp);
    // Return a complete Championship object, although createdAt will be a server value
    return { 
      id: docRef.id, 
      ...championshipData, 
      status: 'ativo',
    };
}


/**
 * Updates an existing championship in Firestore.
 * @param championshipId - The ID of the championship to update.
 * @param championshipData - An object containing the fields to update.
 */
export async function updateChampionship(championshipId: string, championshipData: Partial<Omit<Championship, 'id'>>): Promise<void> {
    const championshipDocRef = doc(db, 'championships', championshipId);
    await updateDoc(championshipDocRef, championshipData);
}

/**
 * Deletes a championship and all of its associated matches and predictions from Firestore.
 * @param championshipId - The ID of the championship to delete.
 */
export async function deleteChampionship(championshipId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // 1. Find all matches for the championship
    const matchesRef = collection(db, 'matches');
    const matchesQuery = query(matchesRef, where('campeonatoId', '==', championshipId));
    const matchesSnapshot = await getDocs(matchesQuery);

    const matchIds = matchesSnapshot.docs.map(d => d.id);

    // 2. For each match, find and delete all associated predictions
    if (matchIds.length > 0) {
        // Firestore limita queries 'in' a 30 itens. Se houver mais, precisa de múltiplos batches.
        const BATCH_SIZE = 30;
        for (let i = 0; i < matchIds.length; i += BATCH_SIZE) {
            const matchIdBatch = matchIds.slice(i, i + BATCH_SIZE);
            const predictionsRef = collection(db, 'predictions');
            const predictionsQuery = query(predictionsRef, where('matchId', 'in', matchIdBatch));
            const predictionsSnapshot = await getDocs(predictionsQuery);
            predictionsSnapshot.forEach(predictionDoc => {
                batch.delete(predictionDoc.ref);
            });
        }
    }

    // 3. Delete all matches for the championship
    matchesSnapshot.forEach(matchDoc => {
        batch.delete(matchDoc.ref);
    });

    // 4. Delete the championship document itself
    const championshipDocRef = doc(db, 'championships', championshipId);
    batch.delete(championshipDocRef);

    // 5. Commit the batch
    await batch.commit();
}


/**
 * Fetches all matches from the Firestore 'matches' collection.
 */
export async function getMatches(): Promise<Match[]> {
  const matchesCollection = collection(db, 'matches');
  const q = query(matchesCollection, orderBy('data', 'asc'));
  const matchSnapshot = await getDocs(q);
  const matchList = matchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
  return matchList;
}

/**
 * Adds a new match to the Firestore 'matches' collection.
 * @param matchData - The data for the new match.
 */
export async function addMatch(matchData: Omit<Match, 'id'>): Promise<Match> {
  const matchesCollection = collection(db, 'matches');
  const docRef = await addDoc(matchesCollection, {
    ...matchData,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...matchData };
}

/**
 * Updates an existing match in Firestore.
 * @param matchId - The ID of the match to update.
 * @param matchData - An object containing the fields to update.
 */
export async function updateMatch(matchId: string, matchData: Partial<Match>): Promise<void> {
  const matchDocRef = doc(db, 'matches', matchId);
  await updateDoc(matchDocRef, matchData);
}

/**
 * Deletes a match from Firestore.
 * @param matchId - The ID of the match to delete.
 */
export async function deleteMatch(matchId: string): Promise<void> {
  const matchDocRef = doc(db, 'matches', matchId);
  await deleteDoc(matchDocRef);
}


// PREDICTION FUNCTIONS

/**
 * Fetches all predictions for a given match.
 * @param matchId The ID of the match.
 */
export async function getPredictionsForMatch(matchId: string): Promise<Prediction[]> {
  const q = query(collection(db, 'predictions'), where('matchId', '==', matchId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prediction));
}

/**
 * Fetches all predictions for a given user.
 * @param userId The ID of the user.
 */
export async function getPredictionsForUser(userId: string): Promise<Prediction[]> {
  const q = query(collection(db, 'predictions'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prediction));
}

/**
 * Adds or updates a user's prediction for a specific match.
 * If a prediction already exists, it will be updated. Otherwise, a new one is created.
 * @param predictionData The prediction data.
 */
export async function addOrUpdatePrediction(predictionData: Partial<Omit<Prediction, 'id' | 'createdAt' | 'updatedAt'>>) {
    if (!predictionData.userId || !predictionData.matchId) {
        throw new Error("User ID and Match ID are required.");
    }
    const predictionsRef = collection(db, 'predictions');
    const q = query(
        predictionsRef,
        where('userId', '==', predictionData.userId),
        where('matchId', '==', predictionData.matchId),
        limit(1)
    );

    const snapshot = await getDocs(q);
    const now = serverTimestamp();
    
    // Also update the user's last guess info
    const userDocRef = doc(db, 'users', predictionData.userId);

    const dataToSave = { ...predictionData, updatedAt: now };

    if (snapshot.empty) {
        // Add new prediction
        await addDoc(predictionsRef, {
            ...dataToSave,
            createdAt: now,
            acertoTipo: 'erro', // default value
            pontos: 0, // default value
        });
    } else {
        // Update existing prediction
        const docId = snapshot.docs[0].id;
        const docRef = doc(db, 'predictions', docId);
        await updateDoc(docRef, dataToSave);
    }
    
    // Update user's last guess in a separate operation
    if (predictionData.palpiteUsuario) {
         const ultimoPalpite = {
            matchId: predictionData.matchId,
            palpite: `${predictionData.palpiteUsuario.placarA}-${predictionData.palpiteUsuario.placarB}`
        };
        await updateDoc(userDocRef, { ultimoPalpite, ultimaAtividade: now });
    } else {
        await updateDoc(userDocRef, { ultimaAtividade: now });
    }
}


/**
 * Adds a new ephemeral toast notification for a specific user.
 * @param userId - The ID of the user to notify.
 * @param title - The title of the toast.
 * @param message - The message content of the toast.
 */
export async function addToastNotification(userId: string, title: string, message: string) {
  const toastCollection = collection(db, 'toast_notifications');
  await addDoc(toastCollection, {
    userId,
    title,
    message,
    createdAt: serverTimestamp(),
  });
}

/**
 * Adds a new persistent notification for a specific user.
 * @param userId - The ID of the user to notify.
 * @param title - The title of the notification.
 * @param message - The message content of the notification.
 * @param href - The URL the notification should link to.
 * @param type - The type of notification ('normal' or 'urgent').
 * @param originalMessage - The full original message content for urgent messages.
 */
export async function addNotification(
  userId: string,
  title: string,
  message: string,
  href: string,
  type: 'normal' | 'urgent',
  originalMessage?: EmergencyMessage
) {
  const notificationCollection = collection(db, 'notifications');
  const notificationData: Omit<Notification, 'id' | 'createdAt'> = {
    userId,
    title,
    message,
    href,
    read: false,
    type,
  };

  if (type === 'urgent' && originalMessage) {
    notificationData.originalMessage = originalMessage;
  }

  await addDoc(notificationCollection, {
    ...notificationData,
    createdAt: serverTimestamp(),
  });
}

/**
 * Updates a user's last login and last activity timestamps.
 * @param userId - The ID of the user to update.
 */
export async function updateUserLastLogin(userId: string): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    const now = serverTimestamp();
    await updateDoc(userDocRef, {
        ultimoLogin: now,
        ultimaAtividade: now, // Also update last activity on login
    });
}

/**
 * Updates the presence status of a specific user in Firestore.
 * @param userId - The ID of the user to update.
 * @param newStatus - The new presence status to set for the user.
 */
export async function updateUserPresenceStatus(userId: string, newStatus: UserType['presenceStatus']) {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { 
      presenceStatus: newStatus,
      ultimaAtividade: serverTimestamp(),
    });
}

/**
 * Saves or clears an urgent message in a central Firestore document.
 * @param messageData - The urgent message object. To clear the message, pass `active: false`.
 */
export async function updateUrgentMessage(messageData: Partial<EmergencyMessage>): Promise<void> {
    const urgentMessageRef = doc(db, 'system_messages', 'urgent');
    await setDoc(urgentMessageRef, messageData, { merge: true });
}

/**
 * Marks an urgent message as seen by a user.
 * @param userId - The ID of the user.
 * @param messageId - The ID of the urgent message that was seen.
 */
export async function markUrgentMessageAsSeen(userId: string, messageId: string) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    seenUrgentMessages: arrayUnion(messageId),
  });
}
    