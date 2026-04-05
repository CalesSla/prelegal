import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TemplateSelector from "@/components/TemplateSelector";

const mockFetch = global.fetch as jest.Mock;

const mockTemplatesResponse = {
  categories: [
    { id: "confidentiality", label: "Confidentiality" },
    { id: "employment", label: "Employment" },
  ],
  templates: [
    { id: "nda", name: "Non-Disclosure Agreement", category: "confidentiality" },
    { id: "employment_agreement", name: "Employment Agreement", category: "employment" },
    { id: "independent_contractor", name: "Independent Contractor Agreement", category: "employment" },
  ],
};

const mockNdaTemplate = {
  id: "nda",
  name: "Non-Disclosure Agreement",
  category: "confidentiality",
  description: "An NDA template",
  version: "1.0",
  variables: [{ key: "name", label: "Name", type: "text", required: true }],
  sections: [{ title: "Recitals", content: "Hello {{name}}" }],
};

describe("TemplateSelector", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("shows loading state initially", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<TemplateSelector onSelect={jest.fn()} />);
    expect(screen.getByText("Loading templates...")).toBeInTheDocument();
  });

  it("renders template list grouped by category", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTemplatesResponse,
    });

    render(<TemplateSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Confidentiality")).toBeInTheDocument();
    });

    expect(screen.getByText("Employment")).toBeInTheDocument();
    expect(screen.getByText("Non-Disclosure Agreement")).toBeInTheDocument();
    expect(screen.getByText("Employment Agreement")).toBeInTheDocument();
    expect(screen.getByText("Independent Contractor Agreement")).toBeInTheDocument();
  });

  it("renders the page title and subtitle", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTemplatesResponse,
    });

    render(<TemplateSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Prelegal")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Choose a legal document template to get started")
    ).toBeInTheDocument();
  });

  it("fetches and loads full template on card click", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplatesResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockNdaTemplate,
      });

    render(<TemplateSelector onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText("Non-Disclosure Agreement")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Non-Disclosure Agreement"));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(mockNdaTemplate);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/templates/nda");
  });

  it("shows error when template list fails to load", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<TemplateSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load templates. Please refresh the page.")
      ).toBeInTheDocument();
    });
  });

  it("shows error when individual template fails to load", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplatesResponse,
      })
      .mockResolvedValueOnce({ ok: false });

    render(<TemplateSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Non-Disclosure Agreement")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Non-Disclosure Agreement"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load template. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("disables all cards while loading a template", async () => {
    const user = userEvent.setup();

    let resolveTemplate: (value: unknown) => void;
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplatesResponse,
      })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveTemplate = resolve;
        })
      );

    render(<TemplateSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Non-Disclosure Agreement")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Non-Disclosure Agreement"));

    // All buttons should be disabled while loading
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });

    // Clean up
    resolveTemplate!({
      ok: true,
      json: async () => mockNdaTemplate,
    });
  });
});
