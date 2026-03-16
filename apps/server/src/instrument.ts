import * as Sentry from '@sentry/nestjs';

// before any other imports in main.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.2,
  sendDefaultPii: false,
});
