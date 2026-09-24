import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.js';
import { navigateTo } from '../lib/authHelpers.js';

const inputClassName = 'mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
const roles = ['Developer', 'Designer', 'Product Manager', 'Project Manager', 'Marketing', 'Sales', 'Operations', 'Other'];

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isActive) return;
      if (!currentUser) {
        navigateTo('/login');
        return;
      }

      setUser(currentUser);
      setIsCheckingProfile(true);
      setError('');

      try {
        const userSnapshot = await getDoc(doc(db, 'users', currentUser.uid));
        if (!isActive) return;
        if (userSnapshot.exists()) {
          navigateTo('/dashboard');
          return;
        }
        setIsCheckingProfile(false);
      } catch {
        if (!isActive) return;
        setError('We couldn’t check your profile. Please try again.');
        setIsCheckingProfile(false);
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const currentUser = auth.currentUser ?? user;
    if (!currentUser) {
      setError('You need to be logged in to save your profile. Please log in and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        name: name.trim(),
        gender,
        role,
        email: currentUser.email,
        createdAt: serverTimestamp(),
      });
      navigateTo('/dashboard');
    } catch {
      setError('We couldn’t save your profile. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Set up your profile</h1>
        <p className="mt-2 text-sm text-slate-600">Tell us a little about yourself to get started.</p>
      </div>

      {isCheckingProfile ? (
        <p className="text-sm text-slate-600" role="status">Checking your profile…</p>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="onboarding-name" className="block text-sm font-medium text-slate-700">Name</label>
            <input
              id="onboarding-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClassName}
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="onboarding-gender" className="block text-sm font-medium text-slate-700">Gender</label>
            <select
              id="onboarding-gender"
              name="gender"
              required
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              className={inputClassName}
            >
              <option value="" disabled>Select your gender</option>
              {genders.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="onboarding-role" className="block text-sm font-medium text-slate-700">Role</label>
            <select
              id="onboarding-role"
              name="role"
              required
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className={inputClassName}
            >
              <option value="" disabled>Select your role</option>
              {roles.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Continue to dashboard'}
          </button>
        </form>
      )}
    </section>
  );
}
