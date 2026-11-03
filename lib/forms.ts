/** Field definitions for the add/edit dialog. One config per kind of record. */
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

/** Applications have their own form: components/ApplicationForm.tsx. */
export const FORMS: Record<Exclude<EntityKind, "apps">, FormDef> = {
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
