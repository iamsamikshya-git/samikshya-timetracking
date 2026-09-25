import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase.js';
import { navigateTo } from '../lib/authHelpers.js';

const inputClassName = 'mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return 'Unavailable';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDuration(startValue, endValue) {
  const start = toDate(startValue);
  const end = toDate(endValue);
  if (!start || !end || end <= start) return 'Unavailable';
  const totalMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [entriesError, setEntriesError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;
    let unsubscribeEntries = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!isActive) return;
      if (!currentUser) {
        navigateTo('/login');
        return;
      }

      setUser(currentUser);
      setIsCheckingAuth(false);
      setProfile(null);
      setProfileError('');
      setEntries([]);
      setEntriesError('');
      setIsLoadingEntries(true);

      try {
        const profileSnapshot = await getDoc(doc(db, 'users', currentUser.uid));
        if (!isActive) return;
        if (profileSnapshot.exists()) setProfile(profileSnapshot.data());
        else setProfileError('Your profile details are not available yet.');
      } catch (error) {
        console.error('Dashboard profile load failed:', error);
        if (isActive) setProfileError('We couldn’t load your profile. Please refresh and try again.');
      }

      const entriesQuery = query(
        collection(db, 'timeEntries'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
      );
      unsubscribeEntries();
      unsubscribeEntries = onSnapshot(entriesQuery, (snapshot) => {
        if (!isActive) return;
        setEntries(snapshot.docs.map((entryDoc) => ({ id: entryDoc.id, ...entryDoc.data() })));
        setEntriesError('');
        setIsLoadingEntries(false);
      }, (error) => {
        console.error('Dashboard time entries listener failed:', error);
        if (!isActive) return;
        setEntriesError('We couldn’t load your time entries. Please refresh and try again.');
        setIsLoadingEntries(false);
      });
    });

    return () => {
      isActive = false;
      unsubscribeAuth();
      unsubscribeEntries();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const currentUser = auth.currentUser ?? user;
    if (!currentUser) {
      navigateTo('/login');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Enter a valid start time and end time.');
      return;
    }
    if (end <= start) {
      setError('End time must be after start time.');
      return;
    }
    if (!taskName.trim()) {
      setError('Enter a task or project name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'timeEntries'), {
        userId: currentUser.uid,
        taskName: taskName.trim(),
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        notes: notes.trim(),
        createdAt: serverTimestamp(),
      });
      setTaskName('');
      setStartTime('');
      setEndTime('');
      setNotes('');
    } catch (error) {
      console.error('Dashboard time entry save failed:', error);
      setError('We couldn’t save this time entry. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingAuth) {
    return <p className="text-sm text-slate-600" role="status">Checking your sign-in…</p>;
  }

  if (!user) return null;

  return (
    <div className="w-full max-w-4xl space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-indigo-600">Your workspace</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Welcome, {profile?.name || 'there'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {profile?.role ? `Your role: ${profile.role}` : 'Role unavailable'}
            </p>
          </div>
          <span className="text-sm text-slate-500">Track your work and time</span>
        </div>
        {profileError && <p className="mt-4 text-sm text-amber-700" role="status">{profileError}</p>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Log time</h2>
          <p className="mt-1 text-sm text-slate-600">Add a task or project you’ve worked on.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="entry-task" className="block text-sm font-medium text-slate-700">Task or project name</label>
            <input
              id="entry-task"
              name="taskName"
              type="text"
              required
              value={taskName}
              onChange={(event) => setTaskName(event.target.value)}
              className={inputClassName}
              placeholder="e.g. Website redesign"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="entry-start" className="block text-sm font-medium text-slate-700">Start time</label>
              <input
                id="entry-start"
                name="startTime"
                type="datetime-local"
                required
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="entry-end" className="block text-sm font-medium text-slate-700">End time</label>
              <input
                id="entry-end"
                name="endTime"
                type="datetime-local"
                required
                min={startTime || undefined}
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
          <div>
            <label htmlFor="entry-notes" className="block text-sm font-medium text-slate-700">Notes <span className="font-normal text-slate-500">(optional)</span></label>
            <textarea
              id="entry-notes"
              name="notes"
              rows="3"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={inputClassName}
              placeholder="Add any useful details…"
            />
          </div>
          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? 'Saving…' : 'Save time entry'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Your time entries</h2>
            <p className="mt-1 text-sm text-slate-600">Your recent work, newest first.</p>
          </div>
          {!isLoadingEntries && !entriesError && (
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        {isLoadingEntries ? (
          <p className="py-8 text-center text-sm text-slate-600" role="status">Loading your time entries…</p>
        ) : entriesError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{entriesError}</p>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center">
            <p className="font-medium text-slate-800">No time entries yet</p>
            <p className="mt-1 text-sm text-slate-500">Your saved work sessions will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {entries.map((entry) => (
              <li key={entry.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-slate-900">{entry.taskName}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDateTime(entry.startTime)} <span className="px-1 text-slate-400">→</span> {formatDateTime(entry.endTime)}
                    </p>
                    {entry.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{entry.notes}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                    {formatDuration(entry.startTime, entry.endTime)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
