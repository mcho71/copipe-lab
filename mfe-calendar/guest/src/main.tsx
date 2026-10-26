// Registers the ui-embedding bootstrap listener before anything calls getViewSDK().
import '@salesforce/platform-sdk/ui-embedding';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
