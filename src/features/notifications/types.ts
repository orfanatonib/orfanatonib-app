export enum InboxNotificationType {
  PRODUCTION_COMPLETED = 'PRODUCTION_COMPLETED',
  SUBMITTED_FOR_REVIEW = 'SUBMITTED_FOR_REVIEW',
  RESUBMITTED_FOR_REVIEW = 'RESUBMITTED_FOR_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  STAGE_APPROVED = 'STAGE_APPROVED',
  PUBLISHED = 'PUBLISHED',
  GENERATION_COMPLETED = 'GENERATION_COMPLETED',
  GENERATION_FAILED = 'GENERATION_FAILED',
}

export enum InboxNotificationSource {
  ORFANATO_STUDIO = 'ORFANATO_STUDIO',
  CLUBINHO_LESSONS = 'CLUBINHO_LESSONS',
}

export enum InboxNotificationTargetKind {
  STUDIO_PACKAGE = 'STUDIO_PACKAGE',
  CLUBINHO_LESSON = 'CLUBINHO_LESSON',
}

export enum InboxStatusFilter {
  ALL = 'all',
  UNREAD = 'unread',
}

export interface InboxNotificationTargetDto {
  kind: InboxNotificationTargetKind;
  id: string;
  audience: string | null;
  stage: string | null;
}

export interface InboxNotificationDto {
  id: string;
  source: InboxNotificationSource;
  type: InboxNotificationType;
  title: string;
  preview: string;
  createdAt: string;
  readAt: string | null;
  target: InboxNotificationTargetDto;
}

export interface InboxNotificationsPageDto {
  items: InboxNotificationDto[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export interface InboxRecentDto {
  id: string;
  type: InboxNotificationType;
  createdAt: string;
}

export interface InboxSummaryDto {
  unreadCount: number;
  total: number;
  /** Chave opaca: muda em criação, leitura e exclusão. A lista só recarrega quando ela muda. */
  revision: string;
  recentUnread: InboxRecentDto[];
}

export interface InboxReadAllDto {
  updatedCount: number;
  summary: InboxSummaryDto;
}

export interface InboxListQuery {
  page: number;
  limit: number;
  status?: InboxStatusFilter;
}
