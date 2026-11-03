/** Field definitions for the add/edit dialog. One config per kind of record. */
import { SETTABLE } from "@/lib/services/applications";
import type { EntityKind } from "@/lib/types";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "url" | "date" | "textarea" | "select";
  options?: string[];
  full?: boolean;
}

export interface FormDef {
  label: string;
  required: string;
  fields: FieldDef[];
}

export const FORMS: Record<EntityKind, FormDef> = {
  apps: {
    label: "application",
    required: "company",
    fields: [
      { key: "link", label: "Job posting link", type: "url", full: true },
      { key: "company", label: "Company", type: "text" },
      { key: "role", label: "Role", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "status", label: "Status", type: "select", options: SETTABLE.map((s) => s.key) },
      { key: "dateApplied", label: "Date applied", type: "date" },
      { key: "lastActivity", label: "Last activity", type: "date" },
      { key: "notes", label: "Notes", type: "textarea", full: true },
    ],
  },
  people: {
    label: "person",
    required: "name",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "org", label: "Organization", type: "text" },
      { key: "relationship", label: "Relationship", type: "text" },
      { key: "nextStep", label: "Next step", type: "text" },
    ],
  },
  companies: {
    label: "company",
    required: "name",
    fields: [
      { key: "name", label: "Company", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "priority", label: "Priority", type: "select", options: ["", "High", "Medium", "Low"] },
      { key: "state", label: "Status", type: "select", options: ["Researching", "Ready to apply", "Applied", "Not a fit"] },
    ],
  },
};
