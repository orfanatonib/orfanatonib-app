import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import imageSectionReducer from './image-section/imageSectionSlice';
import authReducer from './auth/authSlice';
import routesReducer from './route/routeSlice';
import meditationReducer from './meditation/meditationSlice';
import visitMaterialReducer from './visit-material/visitMaterialSlice';
import eventsReducer from './events/eventsSlice';
import commentsReducer from './comment/commentsSlice';
import documentReducer from './documents/documentSlice';
import ideasReducer from './ideas/ideasSlice';
import informativeBannerReducer from './informative/informativeBannerSlice';
import feedbackReducer from './feedback/feedbackSlice';
import featureFlagsReducer from './feature-flags/featureFlagsSlice';
import notificationReducer from './notification/notificationSlice';

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['accessToken', 'refreshToken', 'isAuthenticated'],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  imageSection: imageSectionReducer,
  routes: routesReducer,
  meditation: meditationReducer,
  visitMaterial: visitMaterialReducer,
  events: eventsReducer,
  comments: commentsReducer,
  document: documentReducer,
  ideas: ideasReducer,
  informativeBanner: informativeBannerReducer,
  feedback: feedbackReducer,
  featureFlags: featureFlagsReducer,
  notification: notificationReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);

/** Só no dev server: os E2E semeiam o estado em memória que um login Google real deixaria (ver e2e/live/auth). */
if (import.meta.env.DEV) {
  (window as Window & { __APP_STORE__?: typeof store }).__APP_STORE__ = store;
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;