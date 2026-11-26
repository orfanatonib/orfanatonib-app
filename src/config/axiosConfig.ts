import axios from "axios";
import type {
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from "axios";
import { store } from "@/store/slices";
import { logout, login } from "@/store/slices/auth/authSlice";
import {
  handleError,
  retryOperation,
  isNetworkError,
} from "@/utils/errorHandler";
import { createApiCircuitBreaker } from "@/utils/CircuitBreakerManager";
import {
  AUTO_RETRY_MAX,
  AUTO_RETRY_METHODS,
  NON_RETRYABLE_SERVER_STATUSES,
} from "./axiosConfig.constants";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiAxios = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

/**
 * `skipGlobalError` faz parte do contrato público do cliente: o interceptor não mostra a falha,
 * quem chamou dá o retorno na própria tela (ex.: painel de provedores de IA).
 */
declare module "axios" {
  export interface AxiosRequestConfig {
    skipGlobalError?: boolean;
  }
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _manualRetry?: boolean;
  _skipGlobalErrorHandling?: boolean;
  skipGlobalError?: boolean;
  _skipCircuitBreaker?: boolean;
}

const isAuthEndpoint = (url?: string) => {
  const u = (url || "").toLowerCase();
  return /\/auth\/(login|google|register|complete-register|refresh)$/.test(u);
};

const isOnAuthRoute = () => {
  const p = (window.location?.pathname || "").toLowerCase();
  return /^\/(login|cadastrar|cadastrar-google)/.test(p);
};

apiAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.accessToken;
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

let refreshPromise: Promise<{
  accessToken: string;
  refreshToken: string;
}> | null = null;

const doRefresh = async () => {
  if (!refreshPromise) {
    const currentRefresh = store.getState().auth.refreshToken;
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, { refreshToken: currentRefresh })
      .then((res) => {
        const { accessToken, refreshToken } = res.data || {};
        if (!accessToken || !refreshToken) {
          throw new Error("Refresh sem tokens válidos");
        }
        store.dispatch(login({ accessToken, refreshToken }));
        return { accessToken, refreshToken };
      })
      .catch((err) => {
        store.dispatch(logout());
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

apiAxios.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Request cancellation is expected during React effect cleanup/navigation.
    // It must not enter refresh, retry, circuit-breaker, or global notification flows.
    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    const originalRequest = error.config as CustomAxiosRequestConfig;
    const status = error.response?.status;
    const url = originalRequest?.url || "";
    const method = originalRequest?.method?.toUpperCase() || "GET";

    const endpoint = url.split("?")[0]; // Remove query params

    if (status === 401 && isAuthEndpoint(url)) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const { accessToken } = await doRefresh();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return apiAxios(originalRequest);
      } catch (refreshErr) {
        if (!isOnAuthRoute()) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      }
    }

    // Reenvio feito pelo próprio cliente: quem o disparou decide o que fazer com a falha. Sem isto, cada
    // tentativa abria um novo ciclo de tentativas, sem fim.
    if (originalRequest?._manualRetry) {
      return Promise.reject(error);
    }

    const skipGlobalErrorHandling =
      originalRequest?._skipGlobalErrorHandling || originalRequest?.skipGlobalError;
    const skipCircuitBreaker = originalRequest?._skipCircuitBreaker;
    const isServerError = Boolean(status && status >= 500);

    // POST/PUT/PATCH/DELETE nunca são reenviados: o servidor pode já ter gravado antes de a resposta se perder.
    const shouldRetry =
      !originalRequest?._retry &&
      AUTO_RETRY_METHODS.has(method) &&
      !isAuthEndpoint(url) &&
      (isNetworkError(error) ||
        (isServerError && !NON_RETRYABLE_SERVER_STATUSES.has(status as number)));

    if (shouldRetry) {
      // Guarda a falha mais recente: é ela que chega a quem chamou, mesmo com o circuito aberto.
      let lastError: unknown = error;
      const resend = () =>
        retryOperation(
          async () => {
            try {
              return await apiAxios({
                ...originalRequest,
                _manualRetry: true,
              } as CustomAxiosRequestConfig);
            } catch (attemptError) {
              lastError = attemptError;
              throw attemptError;
            }
          },
          // `retryOperation` conta o primeiro reenvio como execução, não como repetição.
          { maxRetries: AUTO_RETRY_MAX - 1, context: `${method} ${url} - Auto retry` },
        );

      try {
        // O circuito aberto (falhas seguidas no endpoint) faz o cliente parar de insistir.
        return isServerError && !skipCircuitBreaker
          ? await createApiCircuitBreaker(endpoint).execute(resend)
          : await resend();
      } catch {
        if (!skipGlobalErrorHandling) {
          handleError(lastError, `${url} - After retries`);
        }
        return Promise.reject(lastError);
      }
    }

    if (!skipGlobalErrorHandling && status !== 401) {
      handleError(error, url);
    }

    return Promise.reject(error);
  },
);

export default apiAxios;
