import './index.css';
import './utils/chartSetup';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, localStoragePersister } from './lib/queryClient';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: localStoragePersister,
        maxAge: 24 * 60 * 60 * 1000,
        buster: 'v11',
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </React.StrictMode>
);
