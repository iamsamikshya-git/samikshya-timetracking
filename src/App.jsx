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
  const navItems = [
    ['/login', 'Login'],
    ['/signup', 'Signup'],
    ['/onboarding', 'Onboarding'],
    ['/dashboard', 'Dashboard'],
  ];

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 px-4 py-4 sm:px-6"
        >
          {navItems.map(([href, label]) => {
            const isActive = path === href;
            return (
              <a
                key={href}
                href={href}
                onClick={(event) => navigate(event, href)}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-5xl justify-center px-4 py-12 sm:px-6 sm:py-16">
        <Page />
      </main>
    </div>
  );
}
