import { store } from '@/store/slices';
import type { FeatureFlag } from '@/store/slices/feature-flags/featureFlagsSlice';

/**
 * Utility class for working with feature flags
 */
export class FeatureFlagUtils {
    /**
     * Check if a feature is enabled
     * @param key - Feature flag key
     * @returns true if enabled, false otherwise
     */
    static isEnabled(key: string): boolean {
        const state = store.getState();
        const flag = state.featureFlags.flags.find(f => f.key === key);
        return flag?.enabled ?? false;
    }

    /**
     * Get a feature flag by key
     * @param key - Feature flag key
     * @returns FeatureFlag or undefined
     */
    static getFlag(key: string): FeatureFlag | undefined {
        const state = store.getState();
        return state.featureFlags.flags.find(f => f.key === key);
    }

    /**
     * Get all enabled feature flags
     * @returns Array of enabled feature flags
     */
    static getEnabledFlags(): FeatureFlag[] {
        const state = store.getState();
        return state.featureFlags.flags.filter(f => f.enabled);
    }

    /**
     * Get all feature flags
     * @returns Array of all feature flags
     */
    static getAllFlags(): FeatureFlag[] {
        const state = store.getState();
        return state.featureFlags.flags;
    }

    /**
     * Get feature flags by environment
     * @param environment - Environment name
     * @returns Array of feature flags for the specified environment
     */
    static getFlagsByEnvironment(environment: string): FeatureFlag[] {
        const state = store.getState();
        return state.featureFlags.flags.filter(f => f.environment === environment);
    }

    /**
     * Get metadata from a feature flag
     * @param key - Feature flag key
     * @returns Metadata object or null
     */
    static getMetadata(key: string): Record<string, any> | null {
        const flag = this.getFlag(key);
        return flag?.metadata ?? null;
    }

    /**
     * Check if feature flags are currently loading
     * @returns true if loading, false otherwise
     */
    static isLoading(): boolean {
        const state = store.getState();
        return state.featureFlags.loading;
    }

    /**
     * Get the last error if any
     * @returns Error message or null
     */
    static getError(): string | null {
        const state = store.getState();
        return state.featureFlags.error;
    }

    /**
     * Check if feature flags have been fetched
     * @returns true if fetched at least once, false otherwise
     */
    static hasFetched(): boolean {
        const state = store.getState();
        return state.featureFlags.lastFetched !== null;
    }

    /**
     * Get the timestamp of the last fetch
     * @returns Timestamp or null
     */
    static getLastFetchedTime(): number | null {
        const state = store.getState();
        return state.featureFlags.lastFetched;
    }

    /**
     * Check if feature flags need to be refreshed based on a TTL
     * @param ttlMs - Time to live in milliseconds
     * @returns true if refresh is needed, false otherwise
     */
    static needsRefresh(ttlMs: number = 5 * 60 * 1000): boolean {
        const lastFetched = this.getLastFetchedTime();
        if (!lastFetched) return true;
        return Date.now() - lastFetched > ttlMs;
    }
}

/**
 * Simple helper function to check if a feature is enabled
 * @param key - Feature flag key
 * @returns true if enabled, false otherwise
 */
export const isFeatureEnabled = (key: string): boolean => {
    return FeatureFlagUtils.isEnabled(key);
};

/**
 * Simple helper function to get a feature flag
 * @param key - Feature flag key
 * @returns FeatureFlag or undefined
 */
export const getFeatureFlag = (key: string): FeatureFlag | undefined => {
    return FeatureFlagUtils.getFlag(key);
};
