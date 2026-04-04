import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import NdaPreview from "@/components/NdaPreview";
import { TemplateSection } from "@/lib/template";

const mockSections: TemplateSection[] = [
  {
    title: "Recitals",
    content:
      "This {{nda_type}} NDA is entered on {{effective_date}} between {{disclosing_party_name}} and {{receiving_party_name}}.",
  },
  {
    title: "Term",
    content:
      "This Agreement shall remain in effect for {{confidentiality_period_years}} year(s).",
  },
  {
    title: "Governing Law",
    content:
      "Governed by the laws of {{governing_law_state}}.",
  },
];

const filledValues: Record<string, string> = {
  nda_type: "mutual",
  effective_date: "2026-04-04",
  disclosing_party_name: "Acme Corp",
  receiving_party_name: "Widget Inc",
  confidentiality_period_years: "3",
  governing_law_state: "California",
};

const emptyValues: Record<string, string> = {
  nda_type: "",
  effective_date: "",
  disclosing_party_name: "",
  receiving_party_name: "",
  confidentiality_period_years: "",
  governing_law_state: "",
};

function renderPreview(values: Record<string, string>, sections = mockSections) {
  const ref = createRef<HTMLDivElement>();
  return render(
    <NdaPreview
      title="Non-Disclosure Agreement"
      sections={sections}
      values={values}
      previewRef={ref}
    />
  );
}

describe("NdaPreview", () => {
  it("renders the document title", () => {
    renderPreview(filledValues);
    expect(
      screen.getByText("Non-Disclosure Agreement")
    ).toBeInTheDocument();
  });

  it("renders all section titles with numbering", () => {
    renderPreview(filledValues);
    expect(screen.getByText(/1\. Recitals/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Term/)).toBeInTheDocument();
    expect(screen.getByText(/3\. Governing Law/)).toBeInTheDocument();
  });

  it("fills in template values correctly", () => {
    renderPreview(filledValues);
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/Widget Inc/)).toBeInTheDocument();
    expect(screen.getByText(/3 year/)).toBeInTheDocument();
    expect(screen.getByText(/California/)).toBeInTheDocument();
  });

  it("formats dates as long date strings", () => {
    renderPreview(filledValues);
    expect(screen.getByText(/April 4, 2026/)).toBeInTheDocument();
  });

  it("formats nda_type as capitalized value", () => {
    renderPreview(filledValues);
    expect(screen.getByText(/Mutual NDA/)).toBeInTheDocument();
  });

  it("formats one-way nda_type correctly", () => {
    renderPreview({ ...filledValues, nda_type: "one-way" });
    expect(screen.getByText(/One-Way NDA/)).toBeInTheDocument();
  });

  it("highlights unfilled placeholders with yellow background", () => {
    const { container } = renderPreview(emptyValues);
    const highlights = container.querySelectorAll("span[style]");
    const yellowSpans = Array.from(highlights).filter((el) =>
      (el as HTMLElement).style.backgroundColor === "rgb(254, 240, 138)"
    );
    expect(yellowSpans.length).toBeGreaterThan(0);
  });

  it("shows placeholder text for unfilled variables", () => {
    renderPreview(emptyValues);
    expect(screen.getByText("{{nda_type}}")).toBeInTheDocument();
    expect(screen.getByText("{{effective_date}}")).toBeInTheDocument();
    expect(screen.getByText("{{disclosing_party_name}}")).toBeInTheDocument();
  });

  it("does not show placeholder text when all values are filled", () => {
    renderPreview(filledValues);
    expect(screen.queryByText(/\{\{.*\}\}/)).toBeNull();
  });

  it("renders with an empty sections array", () => {
    renderPreview(filledValues, []);
    expect(
      screen.getByText("Non-Disclosure Agreement")
    ).toBeInTheDocument();
  });

  it("applies serif font family", () => {
    const { container } = renderPreview(filledValues);
    const previewDiv = container.firstChild as HTMLElement;
    expect(previewDiv.style.fontFamily).toContain("Georgia");
  });

  it("attaches the previewRef to the container div", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <NdaPreview
        title="Test"
        sections={mockSections}
        values={filledValues}
        previewRef={ref}
      />
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("handles partial values — fills some, highlights others", () => {
    const partialValues = {
      ...emptyValues,
      disclosing_party_name: "Acme Corp",
      nda_type: "mutual",
    };
    renderPreview(partialValues);
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText("{{effective_date}}")).toBeInTheDocument();
    expect(screen.getByText("{{receiving_party_name}}")).toBeInTheDocument();
  });

  it("renders multi-paragraph section content", () => {
    const sections: TemplateSection[] = [
      {
        title: "Multi Paragraph",
        content: "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.",
      },
    ];
    renderPreview(filledValues, sections);
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Third paragraph.")).toBeInTheDocument();
  });
});
