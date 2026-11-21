import type { CompleteProfileListItem } from '../types';

export type ProfileDetailPreferences = NonNullable<CompleteProfileListItem['preferences']>;

export type ProfileCopyField = 'phone' | 'email' | 'ga';

export type PreferenceGridKey = 'loveLanguages' | 'temperaments' | 'favoriteFood' | 'favoriteColor' | 'favoriteMusic';
