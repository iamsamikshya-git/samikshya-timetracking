import { useState } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { getAuthErrorMessage, navigateTo } from '../lib/authHelpers.js';

const inputClassName = 'mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check both fields.');
      return;
    }

    setIsSubmitting(true);
    let authenticated = false;

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      authenticated = true;
      await signOut(auth);
      navigateTo('/login?signup=success');
    } catch (authError) {
      setError(authenticated
        ? 'Your account was created, but we could not sign you out. Please log in.'
        : getAuthErrorMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">Sign up to get started with time tracking.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700">Email</label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700">Password</label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-slate-700">Confirm password</label>
          <input
            id="signup-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClassName}
            placeholder="Re-enter your password"
          />
        </div>

        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account? <a href="/login" onClick={(event) => { event.preventDefault(); navigateTo('/login'); }} className="font-medium text-indigo-600 hover:text-indigo-700">Log in</a>
      </p>
    </section>
  );
}
