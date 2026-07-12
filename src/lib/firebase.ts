import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  initializeFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";

// Load configuration with robust validation and fallback
const isValidCustom = (value: string | undefined, isApiKey = false): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  if (
    trimmed === "" || 
    trimmed === "undefined" || 
    trimmed === "null" || 
    trimmed === "123456789" ||
    trimmed.includes("placeholder")
  ) {
    return false;
  }
  if (isApiKey && !trimmed.startsWith("AIzaSy")) {
    return false;
  }
  return true;
};

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;

// We only use custom config if BOTH the custom API Key and custom Project ID are valid.
// Otherwise, we force-fall back to the default sandbox project to ensure zero mismatch/corruption.
const hasCustomConfig = isValidCustom(rawApiKey, true) && isValidCustom(rawProjectId);

const firebaseConfig = {
  apiKey: hasCustomConfig 
    ? rawApiKey!.trim() 
    : "AIzaSyDLFtYUVwCUo1zBdI6vu1dUKUFG1OvnLng",
  authDomain: hasCustomConfig && isValidCustom(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
    ? (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string).trim()
    : "curious-shadow-v07pf.firebaseapp.com",
  projectId: hasCustomConfig
    ? rawProjectId!.trim()
    : "curious-shadow-v07pf",
  storageBucket: hasCustomConfig && isValidCustom(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)
    ? (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string).trim()
    : "curious-shadow-v07pf.firebasestorage.app",
  messagingSenderId: hasCustomConfig && isValidCustom(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID)
    ? (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string).trim()
    : "1036483995473",
  appId: hasCustomConfig && isValidCustom(import.meta.env.VITE_FIREBASE_APP_ID)
    ? (import.meta.env.VITE_FIREBASE_APP_ID as string).trim()
    : "1:1036483995473:web:324e1101ee4c1d69ecd570",
  databaseId: hasCustomConfig && isValidCustom(import.meta.env.VITE_FIREBASE_DATABASE_ID)
    ? (import.meta.env.VITE_FIREBASE_DATABASE_ID as string).trim()
    : "ai-studio-extractpro-b33dcd1a-c15c-4013-b760-5cd0936fd65d"
};

console.log("[Firebase] Initialization Active. Custom config detected:", hasCustomConfig);

const app = initializeApp(firebaseConfig);

// Set up Auth with custom language preference
export const auth = getAuth(app);
auth.useDeviceLanguage();

// Set up Firestore with custom database ID
const customDatabaseId = firebaseConfig.databaseId;
export const db = initializeFirestore(app, {}, customDatabaseId);

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

// Auth helper
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    const isPopupClosedOrCancelled = 
      error?.code === "auth/popup-closed-by-user" || 
      error?.code === "auth/cancelled-popup-request" ||
      error?.code === "auth/popup-blocked" ||
      error?.message?.toLowerCase().includes("closed") || 
      error?.message?.toLowerCase().includes("popup") ||
      error?.message?.toLowerCase().includes("pending promise");

    if (isPopupClosedOrCancelled) {
      console.warn("Google Sign-In popup closed or cancelled by user:", error);
    } else {
      console.error("Google Sign-In Error:", error);
    }
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};

// Firestore persistence helpers for User's Saved Extractions
export interface SavedExtraction {
  id?: string;
  userId: string;
  url: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  thumbnailUrl: string;
  createdAt: Timestamp;
}

export const saveExtraction = async (userId: string, data: {
  url: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  thumbnailUrl: string;
}) => {
  try {
    const colRef = collection(db, "extractions");
    const docRef = await addDoc(colRef, {
      userId,
      url: data.url,
      title: data.title,
      channel: data.channel,
      duration: data.duration,
      views: data.views,
      thumbnailUrl: data.thumbnailUrl,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Firestore Save Error:", error);
    handleFirestoreError(error, OperationType.CREATE, "extractions");
  }
};

export const getUserExtractions = async (userId: string) => {
  try {
    const colRef = collection(db, "extractions");
    const q = query(
      colRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    const extractions: SavedExtraction[] = [];
    querySnapshot.forEach((doc) => {
      extractions.push({ id: doc.id, ...doc.data() } as SavedExtraction);
    });
    return extractions;
  } catch (error) {
    console.error("Firestore Get Error:", error);
    handleFirestoreError(error, OperationType.LIST, "extractions");
    return [];
  }
};

export const deleteExtraction = async (extractionId: string) => {
  try {
    await deleteDoc(doc(db, "extractions", extractionId));
  } catch (error) {
    console.error("Firestore Delete Error:", error);
    handleFirestoreError(error, OperationType.DELETE, `extractions/${extractionId}`);
  }
};

// Firestore persistence helpers for user AI creations (music, images, videos, conversations)
export interface SavedAiCreation {
  id?: string;
  userId: string;
  type: "image" | "video" | "music" | "chat" | "audio_transcription";
  prompt: string;
  outputUrl?: string;
  textResult?: string;
  createdAt: Timestamp;
}

export const saveAiCreation = async (userId: string, data: {
  type: SavedAiCreation["type"];
  prompt: string;
  outputUrl?: string;
  textResult?: string;
}) => {
  try {
    const colRef = collection(db, "ai_creations");
    const docRef = await addDoc(colRef, {
      userId,
      type: data.type,
      prompt: data.prompt,
      outputUrl: data.outputUrl || null,
      textResult: data.textResult || null,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Firestore Save AI Creation Error:", error);
    handleFirestoreError(error, OperationType.CREATE, "ai_creations");
  }
};

export const getUserAiCreations = async (userId: string, type?: SavedAiCreation["type"]) => {
  try {
    const colRef = collection(db, "ai_creations");
    let q = query(colRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    if (type) {
      q = query(colRef, where("userId", "==", userId), where("type", "==", type), orderBy("createdAt", "desc"));
    }
    const querySnapshot = await getDocs(q);
    const creations: SavedAiCreation[] = [];
    querySnapshot.forEach((doc) => {
      creations.push({ id: doc.id, ...doc.data() } as SavedAiCreation);
    });
    return creations;
  } catch (error) {
    console.error("Firestore Get AI Creations Error:", error);
    handleFirestoreError(error, OperationType.LIST, "ai_creations");
    return [];
  }
};

export interface UserPreferences {
  userId: string;
  autoSaveHistory: boolean;
  historyLimit: number;
  defaultDownloadType: "mp3" | "mp4" | "srt" | "txt";
  notifyOnComplete: boolean;
  themePreference: "light" | "dark";
}

export const defaultPreferences = (userId: string): UserPreferences => ({
  userId,
  autoSaveHistory: true,
  historyLimit: 20,
  defaultDownloadType: "mp4",
  notifyOnComplete: true,
  themePreference: "light"
});

export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  try {
    const docRef = doc(db, "user_preferences", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultPreferences(userId), ...docSnap.data() } as UserPreferences;
    } else {
      const defPrefs = defaultPreferences(userId);
      try {
        await setDoc(docRef, { ...defPrefs, updatedAt: Timestamp.now() });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `user_preferences/${userId}`);
      }
      return defPrefs;
    }
  } catch (error) {
    console.error("Firestore Get Preferences Error:", error);
    handleFirestoreError(error, OperationType.GET, `user_preferences/${userId}`);
    return defaultPreferences(userId);
  }
};

export const saveUserPreferences = async (userId: string, preferences: Partial<UserPreferences>) => {
  try {
    const docRef = doc(db, "user_preferences", userId);
    await setDoc(docRef, {
      ...preferences,
      userId,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error("Firestore Set Preferences Error:", error);
    handleFirestoreError(error, OperationType.UPDATE, `user_preferences/${userId}`);
  }
};

export interface ContactInquiry {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: any;
}

export const saveContactInquiry = async (data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) => {
  try {
    const colRef = collection(db, "contact_inquiries");
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Firestore Save Contact Inquiry Error:", error);
    handleFirestoreError(error, OperationType.CREATE, "contact_inquiries");
  }
};
