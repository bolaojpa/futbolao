

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
import type { UserType, Team, Championship, Match, Prediction, Notification, EmergencyMessage, SupportMessage, SupportReply, Log } from '../types';
import { useAuth } from '@/hooks/use-auth';

/**
 * Adds a new log entry to the 'logs' collection.
 * @param logData - The data for the new log entry.
 */
export async function addLog(logData: Omit<Log, 'id' | 'timestamp'>): Promise<void> {
    try {
        const logsCollection = collection(db, 'logs');
        await addDoc(logsCollection, {
            ...logData,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error adding log:", error);
        // Em um app de produção, você poderia usar um serviço de logging de erros aqui.
    }
}

/**
 * Fetches all logs from the Firestore 'logs' collection, ordered by timestamp descending.
 */
export async function getLogs(): Promise<Log[]> {
    const logsCollection = collection(db, 'logs');
    const q = query(logsCollection, orderBy('timestamp', 'desc'));
    const logSnapshot = await getDocs(q);
    const logList = logSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
    return logList;
}

/**
 * Deletes multiple logs from Firestore in a single batch operation.
 * @param logIds - An array of log IDs to delete.
 */
export async function deleteLogs(logIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    logIds.forEach(logId => {
        const logDocRef = doc(db, 'logs', logId);
        batch.delete(logDocRef);
    });
    await batch.commit();
}


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
 * Updates the profile information for a specific user.
 * @param userId - The ID of the user to update.
 * @param data - The profile data to update.
 */
export async function updateUserProfile(userId: string, data: Partial<Pick<UserType, 'nome' | 'apelido' | 'timeCoracao' | 'urlImagemPersonalizada' | 'fotoPerfil'>>): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        throw new Error("User not found");
    }
    const currentUserData = userDoc.data() as UserType;

    const changedFields: string[] = [];
    if (data.nome && data.nome !== currentUserData.nome) changedFields.push("nome");
    if (data.apelido && data.apelido !== currentUserData.apelido) changedFields.push("apelido");
    if (data.timeCoracao !== undefined && data.timeCoracao !== currentUserData.timeCoracao) changedFields.push("time do coração");
    if (data.urlImagemPersonalizada && data.urlImagemPersonalizada !== currentUserData.urlImagemPersonalizada) {
      changedFields.push("foto de perfil");
    } else if (data.urlImagemPersonalizada === '' && currentUserData.urlImagemPersonalizada) {
      changedFields.push("foto de perfil (removida)");
    }
    
    let activityDescription = "Atualizou o perfil";
    if (changedFields.length > 0) {
      activityDescription = `Atualizou ${changedFields.join(', ')}`;
    }
    
    const updateData: Partial<UserType> & { ultimaAtividade: any } = {
        ...data,
        ultimaAtividade: {
            timestamp: serverTimestamp(),
            description: activityDescription,
        }
    };
    
    if (data.urlImagemPersonalizada) {
        updateData.fotoPerfil = data.urlImagemPersonalizada;
    } else if (data.urlImagemPersonalizada === '') {
        const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nome || currentUserData.nome)}&background=random`;
        updateData.fotoPerfil = fallbackImage;
    }
    
    await addLog({
        action: 'profile_update',
        actor: { id: userId, apelido: currentUserData.apelido, funcao: currentUserData.funcao },
        details: activityDescription,
    });

    await updateDoc(userDocRef, updateData);
}


/**
 * Updates a single field for a specific user.
 * @param userId - The ID of the user to update.
 * @param data - An object with the field to update.
 */
export async function updateUserField(userId: string, data: Partial<UserType>): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) throw new Error("User not found");
    const currentUserData = userDoc.data() as UserType;

    let logDetail = `O campo '${Object.keys(data)[0]}' do usuário ${currentUserData.apelido} foi atualizado.`;
    if ('isGhost' in data) {
      logDetail = data.isGhost
        ? `Definiu o usuário ${currentUserData.apelido} como jogador IA.`
        : `Removeu o modo fantasma do usuário ${currentUserData.apelido}.`;
    }

    await addLog({
        action: 'user_management',
        actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' }, // Assumindo que a ação é feita por um admin
        details: logDetail,
    });

    await updateDoc(userDocRef, data);
}


/**
 * Updates the status of a specific user in Firestore.
 * If the user is being approved (status changes to 'ativo'),
 * it also triggers a welcome notification.
 * @param userId - The ID of the user to update.
 * @param newStatus - The new status to set for the user.
 */
export async function updateUserStatus(userId: string, newStatus: UserType['status']) {
    const userDocRef = doc(db, 'users', userId);
    
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) throw new Error("User not found");
    const userData = userDoc.data() as UserType;
    
    if (userData.status === 'pendente' && newStatus === 'ativo') {
        await addToastNotification(
            userId, 
            `Bem-vindo(a), ${userData.apelido || userData.nome}!`,
            'Seu cadastro foi aprovado. Dê seus palpites e boa sorte!'
        );
    }
    
    await addLog({
      action: 'user_management',
      actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' }, // Assumindo que a ação é feita por um admin
      details: `Alterou o status de "${userData.apelido}" de "${userData.status}" para "${newStatus}".`,
    });
    
    await updateDoc(userDocRef, { 
        status: newStatus,
        ultimaAtividade: {
            timestamp: serverTimestamp(),
            description: `Teve seu status alterado para "${newStatus}"`,
        }
    });
}


/**
 * Updates the role of a specific user in Firestore.
 * @param userId - The ID of the user to update.
 * @param newRole - The new role to set for the user.
 */
export async function updateUserRole(userId: string, newRole: UserType['funcao']) {
    const userDocRef = doc(db, 'users', userId);
    
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) throw new Error("User not found");
    const userData = userDoc.data() as UserType;
    
    await addLog({
        action: 'user_management',
        actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' }, // Assumindo que a ação é feita por um admin
        details: `Alterou a função de "${userData.apelido}" de "${userData.funcao}" para "${newRole}".`,
    });

    await updateDoc(userDocRef, { funcao: newRole });
}


/**
 * Deletes multiple users from Firestore in a single batch operation.
 * @param userIds - An array of user IDs to delete.
 */
export async function deleteUsers(userIds: string[]): Promise<void> {
    const batch = writeBatch(db);

    for (const userId of userIds) {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as UserType;
             await addLog({
                action: 'user_management',
                actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' }, // Assumindo que a ação é feita por um admin
                details: `Excluiu o usuário "${userData.apelido}" (ID: ${userId}).`,
            });
            batch.delete(userDocRef);
        }
    }

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
                ultimaAtividade: {
                    timestamp: serverTimestamp(),
                    description: "Pontuação atualizada após partida."
                },
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

    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data() as UserType;

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
    
    await addLog({
        action: 'user_management',
        actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' }, // Assumindo que a ação é feita por um admin
        details: `Resetou as estatísticas do usuário "${userData.apelido}".`,
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
  await addLog({
      action: 'championship_update',
      actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' },
      details: `Adicionou a equipe "${teamData.name}".`,
  });
  return { id: docRef.id, ...teamData };
}

/**
 * Updates an existing team in Firestore.
 * @param teamId - The ID of the team to update.
 * @param teamData - An object containing the fields to update.
 */
export async function updateTeam(teamId: string, teamData: Partial<Omit<Team, 'id'>>): Promise<void> {
    const teamDocRef = doc(db, 'teams', teamId);
    await updateDoc(teamDocRef, teamData);
    await addLog({
      action: 'championship_update',
      actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' },
      details: `Editou a equipe "${teamData.name}".`,
  });
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
    await addLog({
        action: 'championship_update',
        actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' },
        details: `Excluiu ${teamIds.length} equipe(s).`,
    });
    await batch.commit();
}

/**
 * Deletes all teams from the 'teams' collection in Firestore.
 */
export async function deleteAllTeams(): Promise<void> {
    const teamsCollection = collection(db, 'teams');
    const teamSnapshot = await getDocs(teamsCollection);
    const batch = writeBatch(db);

    teamSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await addLog({
        action: 'championship_update',
        actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' },
        details: `Excluiu TODAS as equipes do sistema.`,
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
    await addLog({
      action: 'championship_update',
      actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' },
      details: `Criou o campeonato "${championshipData.nome}".`,
    });
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
    
    // Log the change
    const champDoc = await getDoc(championshipDocRef);
    const champName = champDoc.data()?.nome || 'desconhecido';
    
    let details = `Editou o campeonato "${champName}".`;
    // Create specific log messages for significant status changes
    if (championshipData.status) {
        if (championshipData.status === 'arquivado' && champDoc.data()?.status === 'ativo') {
             details = `Finalizou o campeonato "${champName}".`;
        } else if (championshipData.status === 'ativo' && champDoc.data()?.status === 'arquivado') {
            details = `Restaurou o campeonato arquivado "${champName}".`;
        } else if (championshipData.status === 'arquivado' && champDoc.data()?.status !== 'ativo') {
            // This case handles archiving from a non-active state (like if it was already finalized)
            details = `Arquivou o campeonato "${champName}".`;
        } else {
             details = `Alterou o status do campeonato "${champName}" para "${championshipData.status}".`
        }
    }

     await addLog({
      action: 'championship_update',
      actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' },
      details: details,
    });
    
    await updateDoc(championshipDocRef, championshipData);
}

/**
 * Deletes a championship and all of its associated matches and predictions from Firestore.
 * @param championshipId - The ID of the championship to delete.
 */
export async function deleteChampionship(championshipId: string): Promise<void> {
    const batch = writeBatch(db);
    
    const champDoc = await getDoc(doc(db, 'championships', championshipId));
    const champName = champDoc.data()?.nome || 'desconhecido';

    // 1. Find all matches for the championship
    const matchesRef = collection(db, 'matches');
    const matchesQuery = query(matchesRef, where('campeonatoId', '==', championshipId));
    const matchesSnapshot = await getDocs(matchesQuery);

    const matchIds = matchesSnapshot.docs.map(d => d.id);

    // 2. For each match, find and delete all associated predictions
    if (matchIds.length > 0) {
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

    await addLog({
      action: 'championship_update',
      actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' },
      details: `Excluiu o campeonato "${champName}" e todos os seus dados.`,
    });

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
        const ultimaAtividade = {
            timestamp: now,
            description: `Fez um palpite (${ultimoPalpite.palpite})`
        };
        await updateDoc(userDocRef, { ultimoPalpite, ultimaAtividade });
    } else {
        await updateDoc(userDocRef, { ultimaAtividade: { timestamp: now, description: 'Atualizou um palpite' } });
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
  const notificationData: Partial<Notification> = { // Usando Partial para montar o objeto
    userId,
    title,
    message,
    href,
    read: false,
    type,
    createdAt: serverTimestamp() as Timestamp,
  };

  if (type === 'urgent' && originalMessage) {
    notificationData.originalMessage = originalMessage;
  }

  await addDoc(notificationCollection, notificationData);
}

/**
* Marks a specific notification as read and sets the read timestamp.
* @param notificationId - The ID of the notification to update.
*/
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notifDocRef = doc(db, 'notifications', notificationId);
  try {
    const notifDoc = await getDoc(notifDocRef);
    // Only update if it hasn't been read yet to avoid multiple timestamps.
    if (notifDoc.exists() && !notifDoc.data().read) {
        await updateDoc(notifDocRef, { 
            read: true,
            readAt: serverTimestamp(),
        });
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

/**
 * Updates a user's last login and last activity timestamps.
 * @param userId - The ID of the user to update.
 */
export async function updateUserLastLogin(userId: string): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
        ultimoLogin: serverTimestamp(),
        ultimaAtividade: {
            timestamp: serverTimestamp(),
            description: "Fez login"
        },
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
      ultimaAtividade: {
          timestamp: serverTimestamp(),
          description: `Alterou o status para "${newStatus}"`
      },
    });
}

/**
 * Saves or clears an urgent message in a central Firestore document.
 * @param messageData - The urgent message object. To clear the message, pass `active: false`.
 */
export async function updateUrgentMessage(messageData: Partial<EmergencyMessage>): Promise<void> {
    const urgentMessageRef = doc(db, 'system_messages', 'urgent');
    await addLog({
      action: 'system_message',
      actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' },
      details: `Enviou uma mensagem urgente: "${messageData.title}".`,
    });
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

// SUPPORT MESSAGES

/**
 * Adds a new support message to the Firestore 'support_messages' collection.
 * @param data - The data for the new support message.
 */
export async function addSupportMessage(data: Omit<SupportMessage, 'id' | 'createdAt' | 'isReadByAdmin' | 'hasUnreadAdminReply' | 'lastActivityAt' | 'readAt' | 'replies'>) {
    const supportCollection = collection(db, 'support_messages');
    const now = serverTimestamp();
    await addDoc(supportCollection, {
        ...data,
        isReadByAdmin: false,
        hasUnreadAdminReply: false,
        createdAt: now,
        lastActivityAt: now,
        readAt: null,
        replies: [],
    });
}

/**
 * Adds a reply from an admin to a support message.
 * @param messageId - The ID of the original support message.
 * @param replyData - The data for the reply.
 */
export async function addReplyToSupportMessage(messageId: string, replyData: Omit<SupportReply, 'id' | 'createdAt' | 'readAt'>) {
    const messageRef = doc(db, 'support_messages', messageId);
    const reply: SupportReply = {
        id: new Date().getTime().toString(), // Simple unique ID
        ...replyData,
        createdAt: Timestamp.now(),
    };
    await updateDoc(messageRef, {
        replies: arrayUnion(reply),
        hasUnreadAdminReply: true,
        lastActivityAt: serverTimestamp(),
    });
}

/**
 * Marks admin replies to a support message as read by the user.
 * @param messageId - The ID of the support message document.
 */
export async function markSupportRepliesAsRead(messageId: string) {
    const messageRef = doc(db, 'support_messages', messageId);
    const now = Timestamp.now();
    try {
        const messageDoc = await getDoc(messageRef);
        if (messageDoc.exists()) {
            const messageData = messageDoc.data() as SupportMessage;
            const updatedReplies = (messageData.replies || []).map(reply => 
                !reply.readAt ? { ...reply, readAt: now } : reply
            );
            
            await updateDoc(messageRef, {
                replies: updatedReplies,
                hasUnreadAdminReply: false,
            });
        }
    } catch (error) {
        console.error("Error marking replies as read: ", error);
    }
}


/**
 * Marks a user's support message (and all its history) as read by the admin.
 * @param conversationId - The ID of the conversation (which is the user ID).
 */
export async function markConversationAsReadByAdmin(conversationId: string) {
    const q = query(collection(db, "support_messages"), where("userId", "==", conversationId), where("isReadByAdmin", "==", false));
    const unreadSnapshot = await getDocs(q);
    
    if (unreadSnapshot.empty) return;

    const batch = writeBatch(db);
    const now = serverTimestamp();
    unreadSnapshot.forEach(docSnap => {
        batch.update(docSnap.ref, { 
            isReadByAdmin: true,
            readAt: now 
        });
    });

    await batch.commit();
}


// SYSTEM SETTINGS

interface SystemSettings {
    allowRegistrations: boolean;
    enablePerformanceNotifications: boolean;
    enablePredictionConsultation: boolean;
}

/**
 * Fetches the global system settings from Firestore.
 * Returns default settings if the document doesn't exist.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
    const settingsRef = doc(db, 'system_settings', 'global');
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
        return docSnap.data() as SystemSettings;
    } else {
        // Return default settings if document doesn't exist
        return {
            allowRegistrations: true,
            enablePerformanceNotifications: true,
            enablePredictionConsultation: true,
        };
    }
}

/**
 * Updates the global system settings in Firestore.
 * @param settings - An object containing the settings to update.
 */
export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
    const settingsRef = doc(db, 'system_settings', 'global');
    await addLog({
      action: 'settings_update',
      actor: { id: 'admin', apelido: 'Admin', funcao: 'admin' },
      details: `Alterou as configurações gerais do sistema.`,
    });
    await setDoc(settingsRef, settings, { merge: true });
}
