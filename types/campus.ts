import type { RecordModel } from "pocketbase";

export interface Campus extends RecordModel {
  name: string;
}

export interface CampusInput {
  name: string;
}
