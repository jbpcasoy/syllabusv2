import type { UserRole } from "@/types/user";

export const APP_NAME = "Syllabus"; // change to your app's name

/** Role given to people who register themselves. Keep this the lowest-privilege role. */
export const DEFAULT_REGISTRATION_ROLE: UserRole = "faculty";
