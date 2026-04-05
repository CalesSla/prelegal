export interface TemplateVariable {
  key: string;
  label: string;
  type: "text" | "date" | "number" | "select" | "textarea";
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

export interface TemplateSummary {
  id: string;
  name: string;
  category: string;
}

export interface CategoryInfo {
  id: string;
  label: string;
}

export function getDefaultValues(template: Template): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const v of template.variables) {
    defaults[v.key] = v.default != null ? String(v.default) : "";
  }
  return defaults;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatValue(key: string, value: string, variables: TemplateVariable[]): string {
  const variable = variables.find((v) => v.key === key);
  if (variable?.type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  }
  if (!variable && key.includes("date") && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  }
  if (variable?.type === "select") {
    return value.split("-").map(capitalize).join("-");
  }
  return value;
}

export function fillTemplate(
  content: string,
  values: Record<string, string>,
  variables: TemplateVariable[] = []
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = values[key];
    if (value != null && value !== "") {
      return formatValue(key, value, variables);
    }
    return match;
  });
}
