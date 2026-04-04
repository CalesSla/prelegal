import { getTemplate, getDefaultValues, fillTemplate, Template } from "@/lib/template";

describe("getTemplate", () => {
  it("returns a valid template object", () => {
    const template = getTemplate();
    expect(template).toBeDefined();
    expect(template.id).toBe("nda");
    expect(template.name).toBe("Non-Disclosure Agreement");
    expect(template.category).toBe("confidentiality");
  });

  it("has the expected variables", () => {
    const template = getTemplate();
    const keys = template.variables.map((v) => v.key);
    expect(keys).toContain("disclosing_party_name");
    expect(keys).toContain("disclosing_party_address");
    expect(keys).toContain("receiving_party_name");
    expect(keys).toContain("receiving_party_address");
    expect(keys).toContain("effective_date");
    expect(keys).toContain("confidentiality_period_years");
    expect(keys).toContain("governing_law_state");
    expect(keys).toContain("nda_type");
  });

  it("has all required variable metadata", () => {
    const template = getTemplate();
    for (const variable of template.variables) {
      expect(variable.key).toBeTruthy();
      expect(variable.label).toBeTruthy();
      expect(["text", "date", "number", "select"]).toContain(variable.type);
      expect(typeof variable.required).toBe("boolean");
    }
  });

  it("has sections with title and content", () => {
    const template = getTemplate();
    expect(template.sections.length).toBeGreaterThan(0);
    for (const section of template.sections) {
      expect(section.title).toBeTruthy();
      expect(section.content).toBeTruthy();
    }
  });

  it("has the nda_type select variable with correct options", () => {
    const template = getTemplate();
    const ndaType = template.variables.find((v) => v.key === "nda_type");
    expect(ndaType).toBeDefined();
    expect(ndaType!.type).toBe("select");
    expect(ndaType!.options).toEqual(["mutual", "one-way"]);
    expect(ndaType!.default).toBe("mutual");
  });

  it("has the {{nda_type}} placeholder in the Recitals section", () => {
    const template = getTemplate();
    const recitals = template.sections.find((s) => s.title === "Recitals");
    expect(recitals).toBeDefined();
    expect(recitals!.content).toContain("{{nda_type}}");
  });
});

describe("getDefaultValues", () => {
  it("returns defaults for all variables", () => {
    const template = getTemplate();
    const defaults = getDefaultValues(template);
    for (const variable of template.variables) {
      expect(variable.key in defaults).toBe(true);
    }
  });

  it("uses provided default values as strings", () => {
    const template = getTemplate();
    const defaults = getDefaultValues(template);
    expect(defaults.confidentiality_period_years).toBe("2");
    expect(defaults.nda_type).toBe("mutual");
  });

  it("uses empty string for variables without defaults", () => {
    const template = getTemplate();
    const defaults = getDefaultValues(template);
    expect(defaults.disclosing_party_name).toBe("");
    expect(defaults.receiving_party_name).toBe("");
    expect(defaults.effective_date).toBe("");
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

  it("formats nda_type 'mutual' as 'Mutual'", () => {
    const result = fillTemplate("This is a {{nda_type}} NDA.", {
      nda_type: "mutual",
    });
    expect(result).toBe("This is a Mutual NDA.");
  });

  it("formats nda_type 'one-way' as 'One-Way'", () => {
    const result = fillTemplate("This is a {{nda_type}} NDA.", {
      nda_type: "one-way",
    });
    expect(result).toBe("This is a One-Way NDA.");
  });

  it("passes through unknown nda_type values as-is", () => {
    const result = fillTemplate("This is a {{nda_type}} NDA.", {
      nda_type: "trilateral",
    });
    expect(result).toBe("This is a trilateral NDA.");
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
