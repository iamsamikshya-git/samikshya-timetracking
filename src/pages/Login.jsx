import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { getAuthErrorMessage, getPostAuthPath, navigateTo } from '../lib/authHelpers.js';

const inputClassName = 'mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('signup') === 'success') {
      setSuccess('Account created! Please log in.');
      url.searchParams.delete('signup');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    let authenticated = false;

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      authenticated = true;
      navigateTo(await getPostAuthPath(credential.user.uid));
    } catch (authError) {
      setError(authenticated
        ? 'You are signed in, but we could not check your profile. Please try again.'
        : getAuthErrorMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">Log in to continue to your time tracking workspace.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">Email</label>
          <input
            id="login-email"
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
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
            placeholder="Enter your password"
          />
        </div>

        {success && <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}
        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don’t have an account? <a href="/signup" onClick={(event) => { event.preventDefault(); navigateTo('/signup'); }} className="font-medium text-indigo-600 hover:text-indigo-700">Sign up</a>
      </p>
    </section>
  );
}
