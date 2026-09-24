import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Signup from './pages/Signup.jsx';

const pages = {
  '/login': Login,
  '/signup': Signup,
  '/onboarding': Onboarding,
  '/dashboard': Dashboard,
};

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const Page = pages[path] ?? Login;

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(event, nextPath) {
    event.preventDefault();
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  }

  return (
    <>
      <nav aria-label="Main navigation">
        <a href="/login" onClick={(event) => navigate(event, '/login')}>Login</a>{' | '}
        <a href="/signup" onClick={(event) => navigate(event, '/signup')}>Signup</a>{' | '}
        <a href="/onboarding" onClick={(event) => navigate(event, '/onboarding')}>Onboarding</a>{' | '}
        <a href="/dashboard" onClick={(event) => navigate(event, '/dashboard')}>Dashboard</a>
      </nav>
      <main>
        <Page />
      </main>
    </>
  );
}
