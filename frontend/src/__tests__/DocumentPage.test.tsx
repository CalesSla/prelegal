import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentPage from "@/components/DocumentPage";
import { Template } from "@/lib/template";

// Mock html2pdf.js
jest.mock("html2pdf.js", () => {
  const mockSave = jest.fn().mockResolvedValue(undefined);
  const mockFrom = jest.fn().mockReturnValue({ save: mockSave });
  const mockSet = jest.fn().mockReturnValue({ from: mockFrom });
  const mockHtml2pdf = jest.fn().mockReturnValue({ set: mockSet });
  return {
    __esModule: true,
    default: mockHtml2pdf,
    _mockSave: mockSave,
    _mockFrom: mockFrom,
    _mockSet: mockSet,
    _mockHtml2pdf: mockHtml2pdf,
  };
});

const ndaTemplate: Template = {
  id: "nda",
  name: "Non-Disclosure Agreement",
  category: "confidentiality",
  description: "A mutual or one-way agreement to protect confidential information.",
  version: "1.0",
  variables: [
    { key: "disclosing_party_name", label: "Disclosing Party Name", type: "text", required: true },
    { key: "disclosing_party_address", label: "Disclosing Party Address", type: "text", required: true },
    { key: "receiving_party_name", label: "Receiving Party Name", type: "text", required: true },
    { key: "receiving_party_address", label: "Receiving Party Address", type: "text", required: true },
    { key: "effective_date", label: "Effective Date", type: "date", required: true },
    { key: "confidentiality_period_years", label: "Confidentiality Period (Years)", type: "number", required: true, default: 2 },
    { key: "governing_law_state", label: "Governing Law (State/Jurisdiction)", type: "text", required: true },
    { key: "nda_type", label: "NDA Type", type: "select", options: ["mutual", "one-way"], required: true, default: "mutual" },
  ],
  sections: [
    {
      title: "Recitals",
      content: "This {{nda_type}} NDA is entered on {{effective_date}} between {{disclosing_party_name}} and {{receiving_party_name}}.",
    },
    {
      title: "Term",
      content: "This Agreement shall remain in effect for {{confidentiality_period_years}} year(s).",
    },
  ],
};

describe("DocumentPage", () => {
  const onBack = jest.fn();

  beforeEach(() => {
    onBack.mockReset();
  });

  it("renders the header with template name", () => {
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);
    expect(screen.getByText("Prelegal")).toBeInTheDocument();
    // Template name appears in both header and preview - check at least 2 instances
    expect(screen.getAllByText("Non-Disclosure Agreement").length).toBeGreaterThanOrEqual(2);
  });

  it("renders the Back button", () => {
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);
    const backButton = screen.getByRole("button", { name: /Back/i });
    expect(backButton).toBeInTheDocument();
  });

  it("calls onBack when Back button is clicked", async () => {
    const user = userEvent.setup();
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: /Back/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it("renders the Download PDF button", () => {
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);
    expect(
      screen.getByRole("button", { name: /Download PDF/i })
    ).toBeInTheDocument();
  });

  it("disables Download PDF button when required fields are empty", () => {
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);
    const button = screen.getByRole("button", { name: /Download PDF/i });
    expect(button).toBeDisabled();
  });

  it("renders the form with all template variables", () => {
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);
    expect(screen.getByLabelText(/Disclosing Party Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Disclosing Party Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Receiving Party Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Receiving Party Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Effective Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confidentiality Period/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Governing Law/)).toBeInTheDocument();
    expect(screen.getByLabelText(/NDA Type/)).toBeInTheDocument();
  });

  it("renders the document preview with sections", () => {
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);
    expect(screen.getByText(/1\. Recitals/)).toBeInTheDocument();
  });

  it("updates preview when form values change", async () => {
    const user = userEvent.setup();
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);

    const nameInput = screen.getByLabelText(/Disclosing Party Name/);
    await user.type(nameInput, "Acme Corp");

    const matches = screen.getAllByText(/Acme Corp/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("shows default values in the form", () => {
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);
    const yearsInput = screen.getByLabelText(
      /Confidentiality Period/
    ) as HTMLInputElement;
    expect(yearsInput.value).toBe("2");

    const ndaTypeSelect = screen.getByLabelText(/NDA Type/) as HTMLSelectElement;
    expect(ndaTypeSelect.value).toBe("mutual");
  });

  it("shows unfilled placeholders highlighted in preview", () => {
    const { container } = render(<DocumentPage template={ndaTemplate} onBack={onBack} />);
    const highlights = container.querySelectorAll(
      'span[style*="background-color"]'
    );
    expect(highlights.length).toBeGreaterThan(0);
    const texts = Array.from(highlights).map((el) => el.textContent);
    expect(texts.some((t) => t?.match(/\{\{\w+\}\}/))).toBe(true);
  });

  it("enables Download PDF button when all required fields are filled", async () => {
    const user = userEvent.setup();
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);

    await user.type(screen.getByLabelText(/Disclosing Party Name/), "Acme Corp");
    await user.type(screen.getByLabelText(/Disclosing Party Address/), "123 Main St");
    await user.type(screen.getByLabelText(/Receiving Party Name/), "Widget Inc");
    await user.type(screen.getByLabelText(/Receiving Party Address/), "456 Oak Ave");
    await user.type(screen.getByLabelText(/Effective Date/), "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "California");

    const button = screen.getByRole("button", { name: /Download PDF/i });
    expect(button).toBeEnabled();
  });

  it("generates PDF with generic filename", async () => {
    const user = userEvent.setup();
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);

    await user.type(screen.getByLabelText(/Disclosing Party Name/), "Acme Corp");
    await user.type(screen.getByLabelText(/Disclosing Party Address/), "123 Main St");
    await user.type(screen.getByLabelText(/Receiving Party Name/), "Widget Inc");
    await user.type(screen.getByLabelText(/Receiving Party Address/), "456 Oak Ave");
    await user.type(screen.getByLabelText(/Effective Date/), "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "California");

    const button = screen.getByRole("button", { name: /Download PDF/i });
    await user.click(button);

    const html2pdf = (await import("html2pdf.js")) as any;
    expect(html2pdf._mockHtml2pdf).toHaveBeenCalled();
    expect(html2pdf._mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "Non-Disclosure_Agreement_Acme_Corp.pdf",
      })
    );
  });

  it("shows Generating... text while PDF is being created", async () => {
    const user = userEvent.setup();

    let resolveSave: () => void;
    const html2pdf = (await import("html2pdf.js")) as any;
    html2pdf._mockSave.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      })
    );

    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);

    await user.type(screen.getByLabelText(/Disclosing Party Name/), "Acme");
    await user.type(screen.getByLabelText(/Disclosing Party Address/), "Addr");
    await user.type(screen.getByLabelText(/Receiving Party Name/), "Widget");
    await user.type(screen.getByLabelText(/Receiving Party Address/), "Addr2");
    await user.type(screen.getByLabelText(/Effective Date/), "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "CA");

    const button = screen.getByRole("button", { name: /Download PDF/i });
    await user.click(button);

    expect(screen.getByRole("button", { name: /Generating/i })).toBeInTheDocument();

    resolveSave!();
  });

  it("shows alert and re-enables button when PDF generation fails", async () => {
    const user = userEvent.setup();
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    const html2pdf = (await import("html2pdf.js")) as any;
    html2pdf._mockSave.mockRejectedValueOnce(new Error("PDF engine error"));

    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);

    await user.type(screen.getByLabelText(/Disclosing Party Name/), "Acme");
    await user.type(screen.getByLabelText(/Disclosing Party Address/), "Addr");
    await user.type(screen.getByLabelText(/Receiving Party Name/), "Widget");
    await user.type(screen.getByLabelText(/Receiving Party Address/), "Addr2");
    await user.type(screen.getByLabelText(/Effective Date/), "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "CA");

    const button = screen.getByRole("button", { name: /Download PDF/i });
    await user.click(button);

    await screen.findByRole("button", { name: /Download PDF/i });

    expect(alertMock).toHaveBeenCalledWith(
      "Failed to generate PDF. Please try again."
    );
    expect(
      screen.getByRole("button", { name: /Download PDF/i })
    ).toBeEnabled();

    alertMock.mockRestore();
  });

  it("keeps button disabled when required field has only whitespace", async () => {
    const user = userEvent.setup();
    render(<DocumentPage template={ndaTemplate} onBack={onBack} />);

    await user.type(screen.getByLabelText(/Disclosing Party Name/), "Acme");
    await user.type(screen.getByLabelText(/Disclosing Party Address/), "Addr");
    await user.type(screen.getByLabelText(/Receiving Party Name/), "   ");
    await user.type(screen.getByLabelText(/Receiving Party Address/), "Addr2");
    await user.type(screen.getByLabelText(/Effective Date/), "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "CA");

    const button = screen.getByRole("button", { name: /Download PDF/i });
    expect(button).toBeDisabled();
  });
});
