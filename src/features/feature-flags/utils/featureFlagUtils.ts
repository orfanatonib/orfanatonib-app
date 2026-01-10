import { store } from '@/store/slices';
import type { FeatureFlag } from '@/store/slices/feature-flags/featureFlagsSlice';


export class FeatureFlagUtils {

    static isEnabled(key: string): boolean {
        const state = store.getState();
        const flag = state.featureFlags.flags.find(f => f.key === key);
        return flag?.enabled ?? false;
    }


    static getFlag(key: string): FeatureFlag | undefined {
        const state = store.getState();
        return state.featureFlags.flags.find(f => f.key === key);
    }


    static getEnabledFlags(): FeatureFlag[] {
        const state = store.getState();
        return state.featureFlags.flags.filter(f => f.enabled);
    }


    static getAllFlags(): FeatureFlag[] {
        const state = store.getState();
        return state.featureFlags.flags;
    }


    static getFlagsByEnvironment(environment: string): FeatureFlag[] {
        const state = store.getState();
        return state.featureFlags.flags.filter(f => f.environment === environment);
    }


    static getMetadata(key: string): Record<string, any> | null {
        const flag = this.getFlag(key);
        return flag?.metadata ?? null;
    }


    static isLoading(): boolean {
        const state = store.getState();
        return state.featureFlags.loading;
    }


    static getError(): string | null {
        const state = store.getState();
        return state.featureFlags.error;
    }


    static hasFetched(): boolean {
        const state = store.getState();
        return state.featureFlags.lastFetched !== null;
    }


    static getLastFetchedTime(): number | null {
        const state = store.getState();
        return state.featureFlags.lastFetched;
    }


    static needsRefresh(ttlMs: number = 5 * 60 * 1000): boolean {
        const lastFetched = this.getLastFetchedTime();
        if (!lastFetched) return true;
        return Date.now() - lastFetched > ttlMs;
    }
}


export const isFeatureEnabled = (key: string): boolean => {
    return FeatureFlagUtils.isEnabled(key);
};


export const getFeatureFlag = (key: string): FeatureFlag | undefined => {
    return FeatureFlagUtils.getFlag(key);
};
