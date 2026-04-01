import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { SharedView } from './pages/SharedView';
import { ErrorBoundary } from './components/ErrorBoundary';

// Routes shared between default and language-prefixed paths
const appRoutes = [
  { index: true, element: <Navigate to="chat" replace /> },
  { path: 'chat/:id?', element: <ChatPage /> },
  { path: 'settings', element: <SettingsPage /> },
  { path: 'shared/:data', element: <SharedView /> },
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
