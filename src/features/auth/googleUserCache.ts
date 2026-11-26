import { logger } from "@/utils/logger";
import { REGISTER_VALIDATION } from "@/constants/errors";

interface GoogleUserCache {
  name: string;
  email: string;
  timestamp: number;
}

const GOOGLE_USER_CACHE_KEY = "google_user_register_cache";
const CACHE_DURATION = REGISTER_VALIDATION.CACHE_DURATION_MS;

export const cacheGoogleUser = (name: string, email: string): void => {
  try {
    const cache: GoogleUserCache = {
      name,
      email,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(GOOGLE_USER_CACHE_KEY, JSON.stringify(cache));
  } catch (error: unknown) {
    // sessionStorage pode estar bloqueado (navegação privada): o cache é só conveniência.
    logger.debug(
      "Cache do usuário Google indisponível",
      { feature: "register" },
      error,
    );
  }
};

export const getGoogleUserCache = (): GoogleUserCache | null => {
  try {
    const cached = sessionStorage.getItem(GOOGLE_USER_CACHE_KEY);
    if (!cached) return null;

    const cache: GoogleUserCache = JSON.parse(cached);

    const isExpired = Date.now() - cache.timestamp > CACHE_DURATION;
    if (isExpired) {
      sessionStorage.removeItem(GOOGLE_USER_CACHE_KEY);
      return null;
    }

    return cache;
  } catch (error: unknown) {
    logger.debug(
      "Cache do usuário Google ilegível",
      { feature: "register" },
      error,
    );
    return null;
  }
};

export const clearGoogleUserCache = (): void => {
  try {
    sessionStorage.removeItem(GOOGLE_USER_CACHE_KEY);
  } catch (error: unknown) {
    logger.debug(
      "Não foi possível limpar o cache do usuário Google",
      { feature: "register" },
      error,
    );
  }
};
