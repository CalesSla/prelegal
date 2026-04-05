import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel from "@/components/ChatPanel";

const mockFetch = global.fetch as jest.Mock;

const defaultFieldValues = {
  disclosing_party_name: "",
  disclosing_party_address: "",
  receiving_party_name: "",
  receiving_party_address: "",
  effective_date: "",
  confidentiality_period_years: "2",
  governing_law_state: "",
  nda_type: "mutual",
};

describe("ChatPanel", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Hello! How can I help?" }),
    });
  });

  it("loads and displays the greeting on mount", async () => {
    render(
      <ChatPanel
        fieldValues={defaultFieldValues}
        onFieldsExtracted={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Hello! How can I help?")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/chat/greeting");
  });

  it("renders the AI Assistant header", () => {
    render(
      <ChatPanel
        fieldValues={defaultFieldValues}
        onFieldsExtracted={jest.fn()}
      />,
    );
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });

  it("sends a message and displays the AI reply", async () => {
    const user = userEvent.setup();
    const onFieldsExtracted = jest.fn();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Hello!" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: "Got it, Acme Corp!",
          extracted_fields: { disclosing_party_name: "Acme Corp" },
        }),
      });

    render(
      <ChatPanel
        fieldValues={defaultFieldValues}
        onFieldsExtracted={onFieldsExtracted}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Hello!")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Type your message...");
    await user.type(textarea, "The disclosing party is Acme Corp");
    await user.click(screen.getByRole("button", { name: /Send/i }));

    await waitFor(() => {
      expect(screen.getByText("Got it, Acme Corp!")).toBeInTheDocument();
    });

    expect(onFieldsExtracted).toHaveBeenCalledWith({
      disclosing_party_name: "Acme Corp",
    });
  });

  it("does not call onFieldsExtracted when no fields are extracted", async () => {
    const user = userEvent.setup();
    const onFieldsExtracted = jest.fn();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Hello!" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: "Tell me more.",
          extracted_fields: {
            disclosing_party_name: null,
            receiving_party_name: null,
          },
        }),
      });

    render(
      <ChatPanel
        fieldValues={defaultFieldValues}
        onFieldsExtracted={onFieldsExtracted}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Hello!")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Type your message...");
    await user.type(textarea, "I need an NDA");
    await user.click(screen.getByRole("button", { name: /Send/i }));

    await waitFor(() => {
      expect(screen.getByText("Tell me more.")).toBeInTheDocument();
    });

    expect(onFieldsExtracted).not.toHaveBeenCalled();
  });

  it("shows error message when API call fails", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Hello!" }),
      })
      .mockResolvedValueOnce({ ok: false });

    render(
      <ChatPanel
        fieldValues={defaultFieldValues}
        onFieldsExtracted={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Hello!")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Type your message...");
    await user.type(textarea, "test");
    await user.click(screen.getByRole("button", { name: /Send/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Sorry, I'm having trouble connecting. Please try again.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("disables send button when input is empty", () => {
    render(
      <ChatPanel
        fieldValues={defaultFieldValues}
        onFieldsExtracted={jest.fn()}
      />,
    );

    const sendButton = screen.getByRole("button", { name: /Send/i });
    expect(sendButton).toBeDisabled();
  });

  it("shows Thinking indicator while waiting for response", async () => {
    const user = userEvent.setup();

    let resolveChat: (value: unknown) => void;
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Hello!" }),
      })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveChat = resolve;
        }),
      );

    render(
      <ChatPanel
        fieldValues={defaultFieldValues}
        onFieldsExtracted={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Hello!")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Type your message...");
    await user.type(textarea, "test");
    await user.click(screen.getByRole("button", { name: /Send/i }));

    expect(screen.getByText("Thinking...")).toBeInTheDocument();

    // Clean up
    resolveChat!({
      ok: true,
      json: async () => ({
        reply: "Done",
        extracted_fields: {},
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("Done")).toBeInTheDocument();
    });
  });

  it("clears input after sending", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Hello!" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: "OK", extracted_fields: {} }),
      });

    render(
      <ChatPanel
        fieldValues={defaultFieldValues}
        onFieldsExtracted={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Hello!")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(
      "Type your message...",
    ) as HTMLTextAreaElement;
    await user.type(textarea, "hello");
    await user.click(screen.getByRole("button", { name: /Send/i }));

    expect(textarea.value).toBe("");
  });

  it("filters out empty string extracted fields", async () => {
    const user = userEvent.setup();
    const onFieldsExtracted = jest.fn();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Hello!" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: "OK",
          extracted_fields: {
            disclosing_party_name: "Acme",
            receiving_party_name: "",
          },
        }),
      });

    render(
      <ChatPanel
        fieldValues={defaultFieldValues}
        onFieldsExtracted={onFieldsExtracted}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Hello!")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Type your message...");
    await user.type(textarea, "Acme is disclosing");
    await user.click(screen.getByRole("button", { name: /Send/i }));

    await waitFor(() => {
      expect(onFieldsExtracted).toHaveBeenCalledWith({
        disclosing_party_name: "Acme",
      });
    });
  });
});
