import type { ListResult, RecordModel } from "pocketbase";
import type { AppUser } from "./user";

export const NOTIFICATION_KINDS = [
  "review_requested",
  "approved",
  "final_approved",
  "returned",
  "reference_requested",
  "reference_approved",
  "reference_revoked",
  "reference_withdrawn",
  "reference_stopped",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const EMAIL_STATUSES = [
  "pending",
  "sending",
  "sent",
  "failed",
  "skipped",
] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

/**
 * One message to one user about one transition, written in the
 * transition's batch. Superuser-only: the browser sees it only through
 * /api/notification. Also the email outbox drained by
 * pb_hooks/notifications.pb.js.
 */
export interface Notification extends RecordModel {
  /** ID of the recipient. */
  user: string;
  /** ID of the syllabus. */
  syllabus: string;
  kind: NotificationKind;
  /** 1 to 5: the stage the message is about. 0 for the reference kinds. */
  stage: number;
  /** ID of the user whose action caused it. */
  actor: string;
  title: string;
  body: string;
  /** App path, for example "/syllabus/<id>/review". */
  link: string;
  /** PocketBase datetime, or "" while unread. */
  read_at: string;
  email_status: EmailStatus;
  email_attempts: number;
  email_error: string;
  /** PocketBase datetime, or "" until sent. */
  emailed_at: string;
  created: string;
  updated: string;
  expand?: {
    actor?: AppUser;
  };
}

/** One recipient, from notificationRecipients(). */
export interface NotificationTarget {
  user: string;
  kind: NotificationKind;
  stage: number;
}

/** Body of PATCH /api/notification/:id. */
export interface NotificationUpdateInput {
  read: boolean;
}

/** Safe shape sent to the browser. Never carries email_* fields. */
export interface NotificationResponse {
  id: string;
  syllabus: string;
  kind: NotificationKind;
  stage: number;
  title: string;
  body: string;
  link: string;
  read: boolean;
  actor_name: string;
  created: string;
}

/** GET /api/notification: the page plus the caller's unread total. */
export interface NotificationListResponse
  extends ListResult<NotificationResponse> {
  unread_count: number;
}
