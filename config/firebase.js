import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

let firebaseApp;

if (getApps().length === 0) {
    firebaseApp = initializeApp({
        credential: cert(firebaseConfig),
    });
} else {
    firebaseApp = getApps()[0];
}

export const firebaseMessaging = getMessaging(firebaseApp);
