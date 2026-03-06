// Test Firebase configuration
import { storage } from './firebase';

export const testFirebaseConnection = () => {
  try {
    console.log('Firebase Storage instance:', storage);
    console.log('Firebase app config:', storage.app.options);
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

// Test if Firebase environment variables are properly loaded
export const testFirebaseEnvVars = () => {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('Missing Firebase environment variables:', missing);
    return false;
  }
  
  console.log('All Firebase environment variables are set');
  return true;
};