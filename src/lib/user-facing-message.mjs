const technicalMessagePattern = /(?:Cannot read properties|TypeError|ReferenceError|SyntaxError|RangeError|ENOENT|ECONN|DATABASE_URL|PostgreSQL|\bOCR\b|\bPiper\b|SheetNames|stack trace|at [\w$]+\s*\()/i;

export function getUserFacingMessage(error, fallback) {
  const message = typeof error === 'string'
    ? error.trim()
    : error instanceof Error
      ? error.message.trim()
      : '';

  if (!message || technicalMessagePattern.test(message)) return fallback;
  return message;
}
