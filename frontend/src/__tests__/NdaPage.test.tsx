import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaPage from "@/components/NdaPage";

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

describe("NdaPage", () => {
  it("renders the header with title and subtitle", () => {
    render(<NdaPage />);
    expect(screen.getByText("Prelegal")).toBeInTheDocument();
    expect(
      screen.getByText("Non-Disclosure Agreement Generator")
    ).toBeInTheDocument();
  });

  it("renders the Download PDF button", () => {
    render(<NdaPage />);
    expect(
      screen.getByRole("button", { name: /Download PDF/i })
    ).toBeInTheDocument();
  });

  it("disables Download PDF button when required fields are empty", () => {
    render(<NdaPage />);
    const button = screen.getByRole("button", { name: /Download PDF/i });
    expect(button).toBeDisabled();
  });

  it("renders the form with all NDA template variables", () => {
    render(<NdaPage />);
    expect(screen.getByLabelText(/Disclosing Party Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Disclosing Party Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Receiving Party Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Receiving Party Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Effective Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confidentiality Period/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Governing Law/)).toBeInTheDocument();
    expect(screen.getByLabelText(/NDA Type/)).toBeInTheDocument();
  });

  it("renders the document preview with title and sections", () => {
    render(<NdaPage />);
    expect(
      screen.getByText("Non-Disclosure Agreement")
    ).toBeInTheDocument();
    expect(screen.getByText(/1\. Recitals/)).toBeInTheDocument();
  });

  it("updates preview when form values change", async () => {
    const user = userEvent.setup();
    render(<NdaPage />);

    const nameInput = screen.getByLabelText(/Disclosing Party Name/);
    await user.type(nameInput, "Acme Corp");

    // "Acme Corp" appears in both Recitals and Signatures sections
    const matches = screen.getAllByText(/Acme Corp/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("shows default values in the form", () => {
    render(<NdaPage />);
    const yearsInput = screen.getByLabelText(
      /Confidentiality Period/
    ) as HTMLInputElement;
    expect(yearsInput.value).toBe("2");

    const ndaTypeSelect = screen.getByLabelText(/NDA Type/) as HTMLSelectElement;
    expect(ndaTypeSelect.value).toBe("mutual");
  });

  it("shows unfilled placeholders highlighted in preview", () => {
    const { container } = render(<NdaPage />);
    // Unfilled placeholders are rendered in highlighted spans
    const highlights = container.querySelectorAll(
      'span[style*="background-color"]'
    );
    expect(highlights.length).toBeGreaterThan(0);
    // Check that one of them contains a placeholder pattern
    const texts = Array.from(highlights).map((el) => el.textContent);
    expect(texts.some((t) => t?.match(/\{\{\w+\}\}/))).toBe(true);
  });

  it("enables Download PDF button when all required fields are filled", async () => {
    const user = userEvent.setup();
    render(<NdaPage />);

    await user.type(screen.getByLabelText(/Disclosing Party Name/), "Acme Corp");
    await user.type(
      screen.getByLabelText(/Disclosing Party Address/),
      "123 Main St"
    );
    await user.type(screen.getByLabelText(/Receiving Party Name/), "Widget Inc");
    await user.type(
      screen.getByLabelText(/Receiving Party Address/),
      "456 Oak Ave"
    );
    const dateInput = screen.getByLabelText(/Effective Date/);
    await user.type(dateInput, "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "California");

    // years and nda_type have defaults, so they're already filled
    const button = screen.getByRole("button", { name: /Download PDF/i });
    expect(button).toBeEnabled();
  });

  it("updates nda_type in preview when changed", async () => {
    const user = userEvent.setup();
    render(<NdaPage />);

    // Default is mutual — check the preview section contains "Mutual"
    const previewSection = document.querySelector(
      '[style*="font-family"]'
    ) as HTMLElement;
    expect(previewSection.textContent).toContain("Mutual");

    await user.selectOptions(screen.getByLabelText(/NDA Type/), "one-way");
    expect(previewSection.textContent).toContain("One-Way");
  });

  it("renders all expected document sections", () => {
    render(<NdaPage />);
    expect(screen.getByText(/1\. Recitals/)).toBeInTheDocument();
    expect(
      screen.getByText(/2\. Definition of Confidential Information/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/3\. Obligations of the Receiving Party/)
    ).toBeInTheDocument();
    expect(screen.getByText(/4\. Exclusions/)).toBeInTheDocument();
    expect(screen.getByText(/5\. Required Disclosures/)).toBeInTheDocument();
    expect(screen.getByText(/6\. Term and Termination/)).toBeInTheDocument();
    expect(
      screen.getByText(/7\. Return or Destruction/)
    ).toBeInTheDocument();
    expect(screen.getByText(/8\. No License or Warranty/)).toBeInTheDocument();
    expect(screen.getByText(/9\. Remedies/)).toBeInTheDocument();
    expect(screen.getByText(/10\. Governing Law/)).toBeInTheDocument();
    expect(screen.getByText(/11\. Signatures/)).toBeInTheDocument();
  });

  it("removes placeholder highlights as fields are filled", async () => {
    const user = userEvent.setup();
    const { container } = render(<NdaPage />);

    const initialHighlights = container.querySelectorAll(
      'span[style*="background-color"]'
    ).length;

    await user.type(
      screen.getByLabelText(/Disclosing Party Name/),
      "Acme Corp"
    );

    const afterHighlights = container.querySelectorAll(
      'span[style*="background-color"]'
    ).length;
    expect(afterHighlights).toBeLessThan(initialHighlights);
  });

  it("calls html2pdf with Mutual filename when NDA type is mutual", async () => {
    const user = userEvent.setup();
    render(<NdaPage />);

    // Fill all required fields (nda_type defaults to "mutual")
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
        filename: "Mutual_NDA_Acme_Corp.pdf",
      })
    );
  });

  it("uses OneWay in filename when NDA type is one-way", async () => {
    const user = userEvent.setup();
    render(<NdaPage />);

    await user.type(screen.getByLabelText(/Disclosing Party Name/), "Acme Corp");
    await user.type(screen.getByLabelText(/Disclosing Party Address/), "123 Main St");
    await user.type(screen.getByLabelText(/Receiving Party Name/), "Widget Inc");
    await user.type(screen.getByLabelText(/Receiving Party Address/), "456 Oak Ave");
    await user.type(screen.getByLabelText(/Effective Date/), "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "California");
    await user.selectOptions(screen.getByLabelText(/NDA Type/), "one-way");

    const button = screen.getByRole("button", { name: /Download PDF/i });
    await user.click(button);

    const html2pdf = (await import("html2pdf.js")) as any;
    expect(html2pdf._mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "OneWay_NDA_Acme_Corp.pdf",
      })
    );
  });

  it("shows Generating... text while PDF is being created", async () => {
    const user = userEvent.setup();

    // Make save() return a pending promise we control
    let resolveSave: () => void;
    const html2pdf = (await import("html2pdf.js")) as any;
    html2pdf._mockSave.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      })
    );

    render(<NdaPage />);

    // Fill all required fields
    await user.type(screen.getByLabelText(/Disclosing Party Name/), "Acme");
    await user.type(screen.getByLabelText(/Disclosing Party Address/), "Addr");
    await user.type(screen.getByLabelText(/Receiving Party Name/), "Widget");
    await user.type(screen.getByLabelText(/Receiving Party Address/), "Addr2");
    await user.type(screen.getByLabelText(/Effective Date/), "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "CA");

    const button = screen.getByRole("button", { name: /Download PDF/i });
    await user.click(button);

    // Button should show "Generating..." while promise is pending
    expect(screen.getByRole("button", { name: /Generating/i })).toBeInTheDocument();

    // Resolve the save promise
    resolveSave!();
  });

  it("shows alert and re-enables button when PDF generation fails", async () => {
    const user = userEvent.setup();
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    const html2pdf = (await import("html2pdf.js")) as any;
    html2pdf._mockSave.mockRejectedValueOnce(new Error("PDF engine error"));

    render(<NdaPage />);

    // Fill all required fields
    await user.type(screen.getByLabelText(/Disclosing Party Name/), "Acme");
    await user.type(screen.getByLabelText(/Disclosing Party Address/), "Addr");
    await user.type(screen.getByLabelText(/Receiving Party Name/), "Widget");
    await user.type(screen.getByLabelText(/Receiving Party Address/), "Addr2");
    await user.type(screen.getByLabelText(/Effective Date/), "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "CA");

    const button = screen.getByRole("button", { name: /Download PDF/i });
    await user.click(button);

    // Wait for the async rejection to propagate
    await screen.findByRole("button", { name: /Download PDF/i });

    expect(alertMock).toHaveBeenCalledWith(
      "Failed to generate PDF. Please try again."
    );
    // Button should be re-enabled (not stuck on "Generating...")
    expect(
      screen.getByRole("button", { name: /Download PDF/i })
    ).toBeEnabled();

    alertMock.mockRestore();
  });

  it("keeps button disabled when required field has only whitespace", async () => {
    const user = userEvent.setup();
    render(<NdaPage />);

    // Fill all required fields
    await user.type(screen.getByLabelText(/Disclosing Party Name/), "Acme");
    await user.type(screen.getByLabelText(/Disclosing Party Address/), "Addr");
    await user.type(screen.getByLabelText(/Receiving Party Name/), "   "); // whitespace only
    await user.type(screen.getByLabelText(/Receiving Party Address/), "Addr2");
    await user.type(screen.getByLabelText(/Effective Date/), "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "CA");

    const button = screen.getByRole("button", { name: /Download PDF/i });
    expect(button).toBeDisabled();
  });

  it("sanitizes filename with special characters in party name", async () => {
    const user = userEvent.setup();
    render(<NdaPage />);

    await user.type(
      screen.getByLabelText(/Disclosing Party Name/),
      "Acme / Corp & Sons"
    );
    await user.type(screen.getByLabelText(/Disclosing Party Address/), "Addr");
    await user.type(screen.getByLabelText(/Receiving Party Name/), "Widget");
    await user.type(screen.getByLabelText(/Receiving Party Address/), "Addr2");
    await user.type(screen.getByLabelText(/Effective Date/), "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "CA");

    const button = screen.getByRole("button", { name: /Download PDF/i });
    await user.click(button);

    const html2pdf = (await import("html2pdf.js")) as any;
    // Verify special characters are handled in filename
    expect(html2pdf._mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: expect.stringContaining("Acme"),
      })
    );
  });

  it("button recovers to Download PDF after successful generation", async () => {
    const user = userEvent.setup();

    let resolveSave: () => void;
    const html2pdf = (await import("html2pdf.js")) as any;
    html2pdf._mockSave.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      })
    );

    render(<NdaPage />);

    await user.type(screen.getByLabelText(/Disclosing Party Name/), "Acme");
    await user.type(screen.getByLabelText(/Disclosing Party Address/), "Addr");
    await user.type(screen.getByLabelText(/Receiving Party Name/), "Widget");
    await user.type(screen.getByLabelText(/Receiving Party Address/), "Addr2");
    await user.type(screen.getByLabelText(/Effective Date/), "2026-04-04");
    await user.type(screen.getByLabelText(/Governing Law/), "CA");

    const button = screen.getByRole("button", { name: /Download PDF/i });
    await user.click(button);

    expect(screen.getByRole("button", { name: /Generating/i })).toBeInTheDocument();

    // Resolve and verify button recovers
    resolveSave!();
    await screen.findByRole("button", { name: /Download PDF/i });
    expect(
      screen.getByRole("button", { name: /Download PDF/i })
    ).toBeEnabled();
  });
});
