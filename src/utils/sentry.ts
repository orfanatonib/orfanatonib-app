import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

  if (!dsn || import.meta.env.DEV) {
    console.warn('Sentry DSN not provided or in development mode - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,

    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error && typeof error === 'object') {
        const message = (error as any).message || '';
        const stack = (error as any).stack || '';

        if (message.includes('Loading chunk') && message.includes('failed')) {
          return null;
        }
        if (message.includes('Network Error') && stack.includes('axios')) {
          event.level = 'warning';
        }
      }

      return event;
    },

    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    dist: import.meta.env.VITE_BUILD_NUMBER,
  });

  console.log('Sentry initialized for environment:', environment);
};
