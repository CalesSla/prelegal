import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TemplateSelector from "@/components/TemplateSelector";

const mockFetch = global.fetch as jest.Mock;

const mockUser = { id: 1, email: "test@example.com" };

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

const mockSavedDocs = [
  {
    id: 1,
    template_id: "nda",
    title: "My NDA Draft",
    values: { name: "Acme" },
    created_at: "2026-04-01T00:00:00",
    updated_at: "2026-04-04T12:00:00",
  },
];

function setupFetches(opts?: { docs?: unknown[]; failDocs?: boolean }) {
  mockFetch.mockImplementation((url: string) => {
    if (url === "/api/templates") {
      return Promise.resolve({ ok: true, json: async () => mockTemplatesResponse });
    }
    if (url === "/api/documents") {
      if (opts?.failDocs) {
        return Promise.resolve({ ok: false, json: async () => ({ detail: "Unauthorized" }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => (opts?.docs ?? []),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

function renderSelector(overrides?: Partial<Parameters<typeof TemplateSelector>[0]>) {
  return render(
    <TemplateSelector
      onSelect={jest.fn()}
      user={mockUser}
      onSignout={jest.fn()}
      {...overrides}
    />,
  );
}

describe("TemplateSelector", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("shows loading state initially", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    renderSelector();
    expect(screen.getByText("Loading templates...")).toBeInTheDocument();
  });

  it("renders template list grouped by category", async () => {
    setupFetches();
    renderSelector();

    await waitFor(() => {
      expect(screen.getByText("Confidentiality")).toBeInTheDocument();
    });

    expect(screen.getByText("Employment")).toBeInTheDocument();
    expect(screen.getByText("Non-Disclosure Agreement")).toBeInTheDocument();
    expect(screen.getByText("Employment Agreement")).toBeInTheDocument();
    expect(screen.getByText("Independent Contractor Agreement")).toBeInTheDocument();
  });

  it("renders the page title and user email", async () => {
    setupFetches();
    renderSelector();

    await waitFor(() => {
      expect(screen.getByText("Prelegal")).toBeInTheDocument();
    });

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("fetches and loads full template on card click", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    setupFetches();
    // Add template detail response for click
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/templates") {
        return Promise.resolve({ ok: true, json: async () => mockTemplatesResponse });
      }
      if (url === "/api/documents") {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url === "/api/templates/nda") {
        return Promise.resolve({ ok: true, json: async () => mockNdaTemplate });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderSelector({ onSelect });

    await waitFor(() => {
      expect(screen.getByText("Non-Disclosure Agreement")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Non-Disclosure Agreement"));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(mockNdaTemplate, undefined);
    });
  });

  it("shows error when template list fails to load", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    renderSelector();

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load templates. Please refresh the page.")
      ).toBeInTheDocument();
    });
  });

  it("shows error when individual template fails to load", async () => {
    const user = userEvent.setup();

    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/templates") {
        return Promise.resolve({ ok: true, json: async () => mockTemplatesResponse });
      }
      if (url === "/api/documents") {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url === "/api/templates/nda") {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderSelector();

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

    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/templates") {
        return Promise.resolve({ ok: true, json: async () => mockTemplatesResponse });
      }
      if (url === "/api/documents") {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url === "/api/templates/nda") {
        return new Promise(() => {}); // never resolves
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderSelector();

    await waitFor(() => {
      expect(screen.getByText("Non-Disclosure Agreement")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Non-Disclosure Agreement"));

    const buttons = screen.getAllByRole("button").filter(b => b.textContent !== "Sign out");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("renders My Documents section when saved docs exist", async () => {
    setupFetches({ docs: mockSavedDocs });
    renderSelector();

    await waitFor(() => {
      expect(screen.getByText("My Documents")).toBeInTheDocument();
    });

    expect(screen.getByText("My NDA Draft")).toBeInTheDocument();
  });

  it("opens saved document with its values", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/templates") {
        return Promise.resolve({ ok: true, json: async () => mockTemplatesResponse });
      }
      if (url === "/api/documents") {
        return Promise.resolve({ ok: true, json: async () => mockSavedDocs });
      }
      if (url === "/api/templates/nda") {
        return Promise.resolve({ ok: true, json: async () => mockNdaTemplate });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderSelector({ onSelect });

    await waitFor(() => {
      expect(screen.getByText("My NDA Draft")).toBeInTheDocument();
    });

    await user.click(screen.getByText("My NDA Draft"));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(mockNdaTemplate, { id: 1, values: { name: "Acme" } });
    });
  });

  it("calls onSignout when Sign out is clicked", async () => {
    const user = userEvent.setup();
    const onSignout = jest.fn();

    setupFetches();
    renderSelector({ onSignout });

    await waitFor(() => {
      expect(screen.getByText("Sign out")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Sign out"));
    expect(onSignout).toHaveBeenCalled();
  });

  it("shows disclaimer footer", async () => {
    setupFetches();
    renderSelector();

    await waitFor(() => {
      expect(screen.getByText(/drafts for informational purposes/)).toBeInTheDocument();
    });
  });

  it("does not show My Documents when list is empty", async () => {
    setupFetches({ docs: [] });
    renderSelector();

    await waitFor(() => {
      expect(screen.getByText("Confidentiality")).toBeInTheDocument();
    });

    expect(screen.queryByText("My Documents")).not.toBeInTheDocument();
  });

  it("still renders templates when document fetch fails", async () => {
    setupFetches({ failDocs: true });
    renderSelector();

    await waitFor(() => {
      expect(screen.getByText("Non-Disclosure Agreement")).toBeInTheDocument();
    });

    expect(screen.queryByText("My Documents")).not.toBeInTheDocument();
  });
});
