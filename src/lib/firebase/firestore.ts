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
} from 'firebase/firestore';
import type { UserType, Team, Championship } from '../types';

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
  const teamSnapshot = await getDocs(teamsCollection);
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
 * Fetches all championships from the Firestore 'championships' collection.
 */
export async function getChampionships(): Promise<Championship[]> {
    const championshipsCollection = collection(db, 'championships');
    const championshipSnapshot = await getDocs(championshipsCollection);
    const championshipList = championshipSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Championship));
    return championshipList;
}

/**
 * Adds a new championship to the Firestore 'championships' collection.
 * @param championshipData - The data for the new championship.
 */
export async function addChampionship(championshipData: Omit<Championship, 'id'>): Promise<Championship> {
    const championshipsCollection = collection(db, 'championships');
    const docRef = await addDoc(championshipsCollection, {
        ...championshipData,
        createdAt: serverTimestamp() 
    });
    return { id: docRef.id, ...championshipData };
}

/**
 * Updates an existing championship in Firestore.
 * @param championshipId - The ID of the championship to update.
 * @param championshipData - An object containing the fields to update.
 */
export async function updateChampionship(championshipId: string, championshipData: Partial<Championship>): Promise<void> {
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
