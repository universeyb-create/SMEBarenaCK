import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  getDocFromServer,
  deleteDoc
} from 'firebase/firestore';

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "future-hybrid-m09p9",
  appId: "1:233684848657:web:8a3c7ac784314288f161b0",
  apiKey: "AIzaSyDwk2wgMrl6mbPBQbMP88gTTEBtt9n_J2g",
  authDomain: "future-hybrid-m09p9.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-ebfcb151-4889-4ae5-b91e-01ca1a488f98",
  storageBucket: "future-hybrid-m09p9.firebasestorage.app",
  messagingSenderId: "233684848657"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Firestore Connection as required by firebase-integration skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is currently offline. Retrying connection in background...");
    } else {
      console.warn("Firebase connection test status:", error);
    }
  }
}
setTimeout(testConnection, 3000);

// Authentication helpers
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginAnonymously(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

// Database query helpers
export async function saveDrawHistory(
  id: string,
  userId: string,
  method: 'auto' | 'step',
  teams: { id: number; name: string; tier1: string; tier2: string; tier3: string }[],
  title?: string
) {
  try {
    const drawDoc = doc(db, 'draw_histories', id);
    const data = {
      id,
      userId,
      createdAt: new Date().toISOString(),
      method,
      teams,
      title: title || `${new Date().toLocaleDateString('ko-KR')} 아레나 CK 추첨`
    };
    await setDoc(drawDoc, data);
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `draw_histories/${id}`);
    throw error;
  }
}

export async function getDrawHistory(id: string) {
  try {
    const drawDoc = doc(db, 'draw_histories', id);
    const snap = await getDoc(drawDoc);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `draw_histories/${id}`);
    throw error;
  }
}

export async function listDrawHistories(maxCount = 20) {
  try {
    const historiesCol = collection(db, 'draw_histories');
    const q = query(historiesCol, orderBy('createdAt', 'desc'), limit(maxCount));
    const querySnapshot = await getDocs(q);
    const results: any[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data());
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'draw_histories');
    throw error;
  }
}

export async function saveCustomParticipants(
  userId: string,
  tier1: string[],
  tier2: string[],
  tier3: string[]
) {
  try {
    const customDoc = doc(db, 'custom_participants', userId);
    await setDoc(customDoc, {
      userId,
      updatedAt: new Date().toISOString(),
      tier1,
      tier2,
      tier3
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `custom_participants/${userId}`);
    throw error;
  }
}

export async function getCustomParticipants(userId: string) {
  try {
    const customDoc = doc(db, 'custom_participants', userId);
    const snap = await getDoc(customDoc);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `custom_participants/${userId}`);
    throw error;
  }
}

export async function deleteCustomParticipants(userId: string) {
  try {
    const customDoc = doc(db, 'custom_participants', userId);
    await deleteDoc(customDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `custom_participants/${userId}`);
    throw error;
  }
}

// Access Requests Helpers for Permission-locked App
export interface AccessRequestData {
  userId: string;
  email: string;
  displayName: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  requestedAt: string;
}

export async function submitAccessRequest(
  userId: string,
  email: string,
  displayName: string,
  note: string
): Promise<AccessRequestData> {
  try {
    const reqDoc = doc(db, 'access_requests', userId);
    const data: AccessRequestData = {
      userId,
      email: email || '',
      displayName: displayName || '사용자',
      status: 'pending',
      note: note || '',
      requestedAt: new Date().toISOString()
    };
    await setDoc(reqDoc, data);
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `access_requests/${userId}`);
    throw error;
  }
}

export async function getAccessRequest(userId: string): Promise<AccessRequestData | null> {
  try {
    const reqDoc = doc(db, 'access_requests', userId);
    const snap = await getDoc(reqDoc);
    if (snap.exists()) {
      return snap.data() as AccessRequestData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `access_requests/${userId}`);
    throw error;
  }
}

export async function listAllAccessRequests(): Promise<AccessRequestData[]> {
  try {
    const colRef = collection(db, 'access_requests');
    const q = query(colRef, orderBy('requestedAt', 'desc'));
    const snap = await getDocs(q);
    const results: AccessRequestData[] = [];
    snap.forEach((doc) => {
      results.push(doc.data() as AccessRequestData);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'access_requests');
    throw error;
  }
}

export async function updateAccessRequestStatus(userId: string, status: 'approved' | 'rejected') {
  try {
    const reqDoc = doc(db, 'access_requests', userId);
    await setDoc(reqDoc, { status }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `access_requests/${userId}`);
    throw error;
  }
}

