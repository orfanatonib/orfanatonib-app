import { describe, expect, it } from 'vitest';
import {
  badgeText,
  bellCount,
  isTerminalStatus,
  notificationRoute,
  notificationsRetryDelay,
  relativeTime,
  shouldRetryNotifications,
  summaryPollInterval,
} from './utils';
import { InboxNotificationTargetKind, InboxNotificationType } from './types';

const studio = (audience: string | null, stage: string | null) => ({
  kind: InboxNotificationTargetKind.STUDIO_PACKAGE,
  id: 'p1',
  audience,
  stage,
});

describe('notifications/utils', () => {
  it('só falhas de sessão/permissão/ausência são terminais', () => {
    expect([401, 403, 404].every(isTerminalStatus)).toBe(true);
    expect(isTerminalStatus(500)).toBe(false);
    expect(isTerminalStatus(null)).toBe(false);
  });

  it('tenta de novo no máximo 3 vezes e nunca em falha terminal', () => {
    expect(shouldRetryNotifications(0, 500)).toBe(true);
    expect(shouldRetryNotifications(2, null)).toBe(true);
    expect(shouldRetryNotifications(3, 500)).toBe(false);
    expect(shouldRetryNotifications(0, 403)).toBe(false);
  });

  it('backoff dobra e tem teto', () => {
    expect(notificationsRetryDelay(0)).toBe(2_000);
    expect(notificationsRetryDelay(1)).toBe(4_000);
    expect(notificationsRetryDelay(10)).toBe(30_000);
  });

  it('polling: visível 30 s, escondida 2 min, parado em falha terminal', () => {
    expect(summaryPollInterval({ visible: true, stopped: false })).toBe(30_000);
    expect(summaryPollInterval({ visible: false, stopped: false })).toBe(120_000);
    expect(summaryPollInterval({ visible: true, stopped: true })).toBe(false);
  });

  it('contador soma não lidos e pendências, sem negativos, e limita o texto', () => {
    expect(bellCount(2, 3)).toBe(5);
    expect(bellCount(-1, 2)).toBe(2);
    expect(badgeText(150)).toBe('99+');
    expect(badgeText(7)).toBe('7');
  });

  it('rota: revisão para envio/reenvio, produção para o resto, com categoria e item', () => {
    expect(notificationRoute(InboxNotificationType.SUBMITTED_FOR_REVIEW, studio('CHILD', null))).toBe(
      '/adm/estudio/revisao/p1?audience=CHILD',
    );
    expect(notificationRoute(InboxNotificationType.CHANGES_REQUESTED, studio('CHILD', 'LESSON'))).toBe(
      '/adm/estudio/pacotes/p1?audience=CHILD&stage=LESSON',
    );
    expect(notificationRoute(InboxNotificationType.GENERATION_FAILED, studio(null, null))).toBe(
      '/adm/estudio/pacotes/p1',
    );
  });

  it('aviso do Clubinho não navega (sem tela para abrir)', () => {
    expect(
      notificationRoute(InboxNotificationType.PUBLISHED, {
        kind: InboxNotificationTargetKind.CLUBINHO_LESSON,
        id: 'l1',
        audience: null,
        stage: null,
      }),
    ).toBeNull();
  });

  it('tempo relativo', () => {
    const now = new Date('2026-11-23T12:00:00Z').getTime();
    expect(relativeTime('2026-11-23T11:59:50Z', now)).toBe('agora');
    expect(relativeTime('2026-11-23T11:55:00Z', now)).toBe('há 5 min');
    expect(relativeTime('2026-11-23T09:00:00Z', now)).toBe('há 3 h');
    expect(relativeTime('2026-11-21T12:00:00Z', now)).toBe('há 2 d');
    expect(relativeTime('lixo', now)).toBe('');
  });
});
