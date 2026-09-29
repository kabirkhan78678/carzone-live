import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
    fs.readFileSync(new URL('./serviceAccountKey.json', import.meta.url), 'utf8')
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export default admin;