/**
 * Fachada do tratamento de erros (plano 04): o código mora em `utils/errors/*`
 * (constantes, análise, retry, tratamento e predicados). Os imports existentes
 * de `@/utils/errorHandler` continuam valendo.
 */
import type { AppError, ErrorHandlingOptions } from '@/types/error';

export type { AppError, ErrorHandlingOptions };
export * from './errors/analyze';
export * from './errors/retry';
export * from './errors/handle';
export * from './errors/wrappers';
export { planNotification } from './errors/notification.plan';
export type { NotificationPlan } from './errors/notification.types';
export * from './errors/predicates';
