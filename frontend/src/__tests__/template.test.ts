import { getDefaultValues, fillTemplate, Template, TemplateVariable } from "@/lib/template";

const ndaSelectVariable: TemplateVariable = {
  key: "nda_type",
  label: "NDA Type",
  type: "select",
  required: true,
  options: ["mutual", "one-way"],
  default: "mutual",
};

const payFrequencyVariable: TemplateVariable = {
  key: "pay_frequency",
  label: "Pay Frequency",
  type: "select",
  required: true,
  options: ["weekly", "bi-weekly", "semi-monthly", "monthly"],
  default: "bi-weekly",
};

describe("getDefaultValues", () => {
  it("returns defaults for all variables", () => {
    const template: Template = {
      id: "test",
      name: "Test",
      category: "test",
      description: "test",
      version: "1.0",
      variables: [
        { key: "a", label: "A", type: "text", required: true },
        { key: "b", label: "B", type: "number", required: true, default: 5 },
      ],
      sections: [],
    };
    const defaults = getDefaultValues(template);
    expect(defaults.a).toBe("");
    expect(defaults.b).toBe("5");
  });

  it("uses provided default values as strings", () => {
    const template: Template = {
      id: "test",
      name: "Test",
      category: "test",
      description: "test",
      version: "1.0",
      variables: [
        { key: "years", label: "Years", type: "number", required: true, default: 2 },
        ndaSelectVariable,
      ],
      sections: [],
    };
    const defaults = getDefaultValues(template);
    expect(defaults.years).toBe("2");
    expect(defaults.nda_type).toBe("mutual");
  });

  it("uses empty string for variables without defaults", () => {
    const template: Template = {
      id: "test",
      name: "Test",
      category: "test",
      description: "test",
      version: "1.0",
      variables: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "date", label: "Date", type: "date", required: true },
      ],
      sections: [],
    };
    const defaults = getDefaultValues(template);
    expect(defaults.name).toBe("");
    expect(defaults.date).toBe("");
  });

  it("handles a custom template with mixed defaults", () => {
    const customTemplate: Template = {
      id: "test",
      name: "Test",
      category: "test",
      description: "test",
      version: "1.0",
      variables: [
        { key: "a", label: "A", type: "text", required: true },
        { key: "b", label: "B", type: "number", required: true, default: 0 },
        { key: "c", label: "C", type: "text", required: false, default: "hello" },
      ],
      sections: [],
    };
    const defaults = getDefaultValues(customTemplate);
    expect(defaults.a).toBe("");
    expect(defaults.b).toBe("0");
    expect(defaults.c).toBe("hello");
  });
});

describe("fillTemplate", () => {
  it("replaces placeholders with values", () => {
    const result = fillTemplate("Hello {{name}}, welcome to {{place}}.", {
      name: "Alice",
      place: "Wonderland",
    });
    expect(result).toBe("Hello Alice, welcome to Wonderland.");
  });

  it("leaves unfilled placeholders intact", () => {
    const result = fillTemplate("Hello {{name}}, your ID is {{id}}.", {
      name: "Bob",
    });
    expect(result).toBe("Hello Bob, your ID is {{id}}.");
  });

  it("handles empty values by leaving placeholder", () => {
    const result = fillTemplate("Hello {{name}}.", { name: "" });
    expect(result).toBe("Hello {{name}}.");
  });

  it("does not treat '0' as empty", () => {
    const result = fillTemplate("Period: {{years}} years.", { years: "0" });
    expect(result).toBe("Period: 0 years.");
  });

  it("handles content with no placeholders", () => {
    const result = fillTemplate("No placeholders here.", { name: "Alice" });
    expect(result).toBe("No placeholders here.");
  });

  it("handles multiple occurrences of the same placeholder", () => {
    const result = fillTemplate("{{name}} met {{name}} in the mirror.", {
      name: "Alice",
    });
    expect(result).toBe("Alice met Alice in the mirror.");
  });

  it("formats date values as long date strings", () => {
    const result = fillTemplate("Date: {{effective_date}}.", {
      effective_date: "2026-04-04",
    });
    expect(result).toBe("Date: April 4, 2026.");
  });

  it("does not format date-like values for non-date keys", () => {
    const result = fillTemplate("Code: {{code}}.", { code: "2026-04-04" });
    expect(result).toBe("Code: 2026-04-04.");
  });

  it("passes through non-date value for a date key", () => {
    const result = fillTemplate("Date: {{effective_date}}.", {
      effective_date: "TBD",
    });
    expect(result).toBe("Date: TBD.");
  });

  it("formats select values with capitalization when variables provided", () => {
    const result = fillTemplate(
      "This is a {{nda_type}} NDA.",
      { nda_type: "mutual" },
      [ndaSelectVariable]
    );
    expect(result).toBe("This is a Mutual NDA.");
  });

  it("formats hyphenated select values correctly", () => {
    const result = fillTemplate(
      "This is a {{nda_type}} NDA.",
      { nda_type: "one-way" },
      [ndaSelectVariable]
    );
    expect(result).toBe("This is a One-Way NDA.");
  });

  it("formats bi-weekly select value correctly", () => {
    const result = fillTemplate(
      "Paid {{pay_frequency}}.",
      { pay_frequency: "bi-weekly" },
      [payFrequencyVariable]
    );
    expect(result).toBe("Paid Bi-Weekly.");
  });

  it("does not capitalize non-select values", () => {
    const textVar: TemplateVariable = {
      key: "name",
      label: "Name",
      type: "text",
      required: true,
    };
    const result = fillTemplate(
      "Name: {{name}}.",
      { name: "alice" },
      [textVar]
    );
    expect(result).toBe("Name: alice.");
  });

  it("handles a real template section with multiple variables", () => {
    const content =
      "Agreement entered on {{effective_date}} between {{disclosing_party_name}} and {{receiving_party_name}}.";
    const result = fillTemplate(content, {
      effective_date: "2026-01-15",
      disclosing_party_name: "Acme Corp",
      receiving_party_name: "Widget Inc",
    });
    expect(result).toBe(
      "Agreement entered on January 15, 2026 between Acme Corp and Widget Inc."
    );
  });

  it("does not match malformed placeholders", () => {
    const result = fillTemplate("{{ name }} and {name} and {{na me}}", {
      name: "Alice",
    });
    expect(result).toBe("{{ name }} and {name} and {{na me}}");
  });

  it("handles content with only placeholders", () => {
    const result = fillTemplate("{{a}}{{b}}", { a: "X", b: "Y" });
    expect(result).toBe("XY");
  });

  it("handles empty content", () => {
    const result = fillTemplate("", { name: "Alice" });
    expect(result).toBe("");
  });
});
