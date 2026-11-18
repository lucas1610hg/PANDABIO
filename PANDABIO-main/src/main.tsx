import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './utils/monitoring';
import App from './App.tsx';
import './index.css';
import './theme/buttonEffects.css';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <main
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
        >
          <h1 className="text-2xl font-semibold">Algo deu errado</h1>
          <p>O PandaBio encontrou um erro inesperado. Tente novamente.</p>
          <button
            type="button"
            onClick={resetError}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white"
          >
            Tentar novamente
          </button>
        </main>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
        success: {
          style: {
            background: '#10B981',
          },
        },
        error: {
          style: {
            background: '#ef4444',
          },
        },
      }}
    />
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}service-worker.js`)
      .catch((error: unknown) => {
        console.error('Não foi possível registrar o service worker do PandaBio.', error);
      });
  });
}
