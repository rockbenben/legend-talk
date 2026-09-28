import { lazy, Suspense } from 'react';
import { createHashRouter, RouterProvider, Navigate, useRouteError } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import i18n from './i18n';

// Lazy-load route pages so each route only ships its own JS on first visit.
// Pages use named exports, so we adapt them to the default-export shape lazy() expects.
const ChatPage = lazy(() => import('./pages/ChatPage').then((m) => ({ default: m.ChatPage })));
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const SharedView = lazy(() => import('./pages/SharedView').then((m) => ({ default: m.SharedView })));

// Layout already paints the navbar/sidebar, so a null fallback just leaves the
// content area momentarily blank rather than flashing a spinner.
const lazyRoute = (el: React.ReactNode) => <Suspense fallback={null}>{el}</Suspense>;

// Routes shared between default and language-prefixed paths
const appRoutes = [
  { index: true, element: <Navigate to="chat" replace /> },
  { path: 'chat/:id?', element: lazyRoute(<ChatPage />) },
  { path: 'settings', element: lazyRoute(<SettingsPage />) },
  { path: 'shared/:data', element: lazyRoute(<SharedView />) },
];

// Without this, any render error inside the tree lands on react-router's
// built-in error screen — off-theme, and it hides the ErrorBoundary below,
// which only ever sees failures outside RouterProvider.
function RouteErrorElement() {
  const error = useRouteError();
  return (
    <ErrorBoundary
      error={error}
      afterRetry={
        <button
          onClick={() => { window.location.hash = '#/chat'; window.location.reload(); }}
          style={{
            border: '1px solid var(--lt-rule)',
            borderRadius: 2,
            padding: '8px 20px',
            fontSize: 14,
            fontFamily: 'inherit',
            cursor: 'pointer',
            background: 'transparent',
            color: 'var(--lt-ink)',
          }}
        >
          {i18n.t('common.goHome')}
        </button>
      }
    >
      {null}
    </ErrorBoundary>
  );
}

const router = createHashRouter([
  // Default routes (auto-detect language)
  {
    element: <Layout />,
    errorElement: <RouteErrorElement />,
    children: appRoutes,
  },
  // Language-prefixed routes (e.g., /ja/chat, /zh-Hant/settings)
  {
    path: ':lang',
    element: <Layout />,
    errorElement: <RouteErrorElement />,
    children: appRoutes,
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
