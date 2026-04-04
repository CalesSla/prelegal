import ndaTemplate from "@/data/nda.json";

export interface TemplateVariable {
  key: string;
  label: string;
  type: "text" | "date" | "number" | "select";
  required: boolean;
  default?: string | number;
  options?: string[];
}

export interface TemplateSection {
  title: string;
  content: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  variables: TemplateVariable[];
  sections: TemplateSection[];
}

export function getTemplate(): Template {
  return ndaTemplate as Template;
}

export function getDefaultValues(template: Template): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const v of template.variables) {
    defaults[v.key] = v.default != null ? String(v.default) : "";
  }
  return defaults;
}

function formatValue(key: string, value: string): string {
  if (key.includes("date") && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  }
  if (key === "nda_type") {
    const labels: Record<string, string> = { mutual: "Mutual", "one-way": "One-Way" };
    return labels[value] ?? value;
  }
  return value;
}

export function fillTemplate(
  content: string,
  values: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = values[key];
    if (value != null && value !== "") {
      return formatValue(key, value);
    }
    return match;
  });
}
