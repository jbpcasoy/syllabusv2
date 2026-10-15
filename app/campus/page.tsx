import { CampusManager } from "@/components/campus/campus-manager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campuses",
};

export default function CampusPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <CampusManager />
    </main>
  );
}
