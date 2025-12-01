import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://95ce2832a113f213a8e1f749a24314fe@o4510441268641792.ingest.us.sentry.io/4510456944132096',
  sendDefaultPii: true,
});

Sentry.init({
  dsn: "https://ab027437d47140b9c5d265f29f14ef80@o4510441268641792.ingest.us.sentry.io/4510456962940928",
  sendDefaultPii: true,
});

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);
