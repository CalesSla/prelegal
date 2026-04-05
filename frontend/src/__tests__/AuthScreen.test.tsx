import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthScreen from "@/components/AuthScreen";

const mockFetch = global.fetch as jest.Mock;

describe("AuthScreen", () => {
  const onAuth = jest.fn();

  beforeEach(() => {
    onAuth.mockReset();
    mockFetch.mockReset();
  });

  it("renders sign in form by default", () => {
    render(<AuthScreen onAuth={onAuth} />);
    expect(screen.getByText("Prelegal")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("switches to sign up mode", async () => {
    const user = userEvent.setup();
    render(<AuthScreen onAuth={onAuth} />);

    await user.click(screen.getByText("Sign up"));

    expect(screen.getByText("Create a new account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("switches back to sign in mode", async () => {
    const user = userEvent.setup();
    render(<AuthScreen onAuth={onAuth} />);

    await user.click(screen.getByText("Sign up"));
    await user.click(screen.getByText("Sign in"));

    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
  });

  it("calls onAuth after successful sign in", async () => {
    const user = userEvent.setup();
    const mockUser = { id: 1, email: "test@example.com" };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    render(<AuthScreen onAuth={onAuth} />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.type(screen.getByPlaceholderText("At least 6 characters"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(onAuth).toHaveBeenCalledWith(mockUser);
    });
  });

  it("calls onAuth after successful sign up", async () => {
    const user = userEvent.setup();
    const mockUser = { id: 2, email: "new@example.com" };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    render(<AuthScreen onAuth={onAuth} />);
    await user.click(screen.getByText("Sign up"));

    await user.type(screen.getByPlaceholderText("you@example.com"), "new@example.com");
    await user.type(screen.getByPlaceholderText("At least 6 characters"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(onAuth).toHaveBeenCalledWith(mockUser);
    });
  });

  it("shows error on sign in failure", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Invalid email or password" }),
    });

    render(<AuthScreen onAuth={onAuth} />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.type(screen.getByPlaceholderText("At least 6 characters"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });

    expect(onAuth).not.toHaveBeenCalled();
  });

  it("shows error on sign up with existing email", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Email already registered" }),
    });

    render(<AuthScreen onAuth={onAuth} />);
    await user.click(screen.getByText("Sign up"));

    await user.type(screen.getByPlaceholderText("you@example.com"), "existing@example.com");
    await user.type(screen.getByPlaceholderText("At least 6 characters"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByText("Email already registered")).toBeInTheDocument();
    });
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();

    mockFetch.mockReturnValueOnce(new Promise(() => {})); // never resolves

    render(<AuthScreen onAuth={onAuth} />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.type(screen.getByPlaceholderText("At least 6 characters"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();
  });

  it("clears error when switching modes", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Invalid email or password" }),
    });

    render(<AuthScreen onAuth={onAuth} />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.type(screen.getByPlaceholderText("At least 6 characters"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Sign up"));
    expect(screen.queryByText("Invalid email or password")).not.toBeInTheDocument();
  });

  it("shows disclaimer text", () => {
    render(<AuthScreen onAuth={onAuth} />);
    expect(screen.getByText(/drafts for informational purposes/)).toBeInTheDocument();
  });

  it("handles network error gracefully", async () => {
    const user = userEvent.setup();

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<AuthScreen onAuth={onAuth} />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.type(screen.getByPlaceholderText("At least 6 characters"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
  });
});
