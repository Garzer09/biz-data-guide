/**
 * Centralized logging system for debugging and error tracking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  userId?: string;
  companyId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = import.meta.env.MODE === 'development';

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    return `${timestamp} ${level} ${context} ${entry.message}`;
  }

  private addLog(level: LogLevel, message: string, context?: string, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
    };

    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage(entry);
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, data);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, data);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, data);
          break;
      }
    }
  }

  debug(message: string, context?: string, data?: unknown) {
    this.addLog(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: unknown) {
    this.addLog(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: unknown) {
    this.addLog(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: unknown) {
    this.addLog(LogLevel.ERROR, message, context, data);
  }

  // Get recent logs for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return this.logs.map(entry => this.formatMessage(entry)).join('\n');
  }
}

export const logger = new Logger();

// Helper function for logging errors with stack traces
export const logError = (error: Error | unknown, context?: string) => {
  if (error instanceof Error) {
    logger.error(`${error.message}`, context, {
      name: error.name,
      stack: error.stack,
    });
  } else {
    logger.error(`Unknown error: ${String(error)}`, context, { error });
  }
};

// Helper function for logging API calls
export const logApiCall = (url: string, method: string, status?: number, duration?: number) => {
  const message = `${method} ${url}${status ? ` - ${status}` : ''}${duration ? ` (${duration}ms)` : ''}`;
  if (status && status >= 400) {
    logger.warn(message, 'API');
  } else {
    logger.debug(message, 'API');
  }
};

// Performance monitoring helper
export const logPerformance = (name: string, duration: number) => {
  if (duration > 1000) {
    logger.warn(`Slow operation: ${name} took ${duration}ms`, 'PERFORMANCE');
  } else if (duration > 500) {
    logger.info(`${name} took ${duration}ms`, 'PERFORMANCE');
  } else {
    logger.debug(`${name} took ${duration}ms`, 'PERFORMANCE');
  }
};