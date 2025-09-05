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
} from 'firebase/firestore';
import type { UserType, Team, Championship, Match, Prediction } from '../types';

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
export async function addChampionship(championshipData: Omit<Championship, 'id' | 'status'>): Promise<Championship> {
    const championshipsCollection = collection(db, 'championships');
    const docRef = await addDoc(championshipsCollection, {
        ...championshipData,
        status: 'ativo',
        createdAt: serverTimestamp() 
    });
    return { id: docRef.id, ...championshipData, status: 'ativo' };
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
 * Deletes a championship from Firestore.
 * @param championshipId - The ID of the championship to delete.
 */
export async function deleteChampionship(championshipId: string): Promise<void> {
    const championshipDocRef = doc(db, 'championships', championshipId);
    await deleteDoc(championshipDocRef);
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
export async function addOrUpdatePrediction(predictionData: Omit<Prediction, 'id' | 'createdAt' | 'updatedAt'>) {
    const predictionsRef = collection(db, 'predictions');
    const q = query(
        predictionsRef,
        where('userId', '==', predictionData.userId),
        where('matchId', '==', predictionData.matchId),
        limit(1)
    );

    const snapshot = await getDocs(q);
    const now = serverTimestamp();

    if (snapshot.empty) {
        // Add new prediction
        await addDoc(predictionsRef, {
            ...predictionData,
            createdAt: now,
            updatedAt: now,
        });
    } else {
        // Update existing prediction
        const docId = snapshot.docs[0].id;
        const docRef = doc(db, 'predictions', docId);
        await updateDoc(docRef, {
            ...predictionData,
            updatedAt: now,
        });
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
