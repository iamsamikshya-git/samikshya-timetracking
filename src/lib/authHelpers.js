import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase.js';

export async function getPostAuthPath(uid) {
  const userSnapshot = await getDoc(doc(db, 'users', uid));
  return userSnapshot.exists() ? '/dashboard' : '/onboarding';
}

export function navigateTo(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function getAuthErrorMessage(error) {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
    'auth/wrong-password': 'That password is incorrect. Please try again.',
    'auth/user-not-found': 'No account was found with that email. Check the address or sign up.',
    'auth/invalid-credential': 'The email or password is incorrect. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/operation-not-allowed': 'Email and password sign-in is not enabled. Please contact support.',
    'auth/missing-password': 'Enter your password.',
  };

  return messages[error?.code] ?? 'Something went wrong. Please try again.';
}
