import "@testing-library/jest-dom";

// scrollIntoView is not implemented in jsdom
Element.prototype.scrollIntoView = jest.fn();

// Global fetch mock for ChatPanel greeting call on mount
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ message: "Hello! I'm your legal document assistant." }),
}) as jest.Mock;
