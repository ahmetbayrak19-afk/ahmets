import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

let app: admin.app.App;

function getServiceAccount() {
  // First try loading from file in server folder
  const filePath = path.join(process.cwd(), 'server', 'service-account.json');
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to read service account file:", e);
    }
  }
  
  // Fallback to environment variable
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson);
    } catch {
      try {
        return JSON.parse(
          Buffer.from(serviceAccountJson, 'base64').toString('utf8')
        );
      } catch {
        console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT");
      }
    }
  }
  
  return null;
}

try {
  const serviceAccount = getServiceAccount();
  
  if (serviceAccount) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: "ogrencitakip-2a775"
    });
    console.log("Firebase Admin initialized with service account");
  } else {
    console.warn("No valid service account found, using default credentials");
    app = admin.initializeApp({
      projectId: "ogrencitakip-2a775"
    });
  }
} catch (error) {
  if ((error as any).code === 'app/duplicate-app') {
    app = admin.app();
  } else {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

export const db = admin.firestore();
export { app };
