import { CHARACTER_LIMIT } from "../constants.js";

export function truncateResponse(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return (
    text.slice(0, CHARACTER_LIMIT) +
    `\n\n... [Response truncated at ${CHARACTER_LIMIT} characters. Use pagination or filters to narrow results.]`
  );
}

export function formatJson(data: unknown): string {
  return truncateResponse(JSON.stringify(data, null, 2));
}

export function successResult(text: string) {
  return {
    content: [{ type: "text" as const, text: truncateResponse(text) }],
  };
}

export function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}
