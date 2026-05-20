import { lazy, Suspense } from 'react';
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

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

const router = createHashRouter([
  // Default routes (auto-detect language)
  {
    element: <Layout />,
    children: appRoutes,
  },
  // Language-prefixed routes (e.g., /ja/chat, /zh-Hant/settings)
  {
    path: ':lang',
    element: <Layout />,
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
