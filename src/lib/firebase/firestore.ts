import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { UserType } from '../types';

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
