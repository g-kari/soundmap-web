/**
 * Structured logging utility for Cloudflare Workers
 * Provides structured error logging that can be easily monitored in production
 */

export type LogLevel = "error" | "warn" | "info" | "debug";

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext
): string {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  return JSON.stringify(logEntry);
}

/**
 * Create a logger instance
 * 
 * In Cloudflare Workers, console.log/error/warn are captured and visible
 * in the Workers dashboard. This logger provides structured output that
 * makes it easier to monitor and analyze logs in production.
 * 
 * Future enhancement: Can be extended to send logs to external services
 * like Sentry, Datadog, or LogDNA for better monitoring.
 */
export function createLogger(): Logger {
  return {
    error(message: string, context?: LogContext): void {
      console.error(createLogEntry("error", message, context));
    },

    warn(message: string, context?: LogContext): void {
      console.warn(createLogEntry("warn", message, context));
    },

    info(message: string, context?: LogContext): void {
      console.log(createLogEntry("info", message, context));
    },

    debug(message: string, context?: LogContext): void {
      console.log(createLogEntry("debug", message, context));
    },
  };
}

// Default logger instance
export const logger = createLogger();
