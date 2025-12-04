/**
 * Centralized logging utility for PLUME
 * 
 * Usage:
 * - Development: logs to console
 * - Production: sends to monitoring service (Sentry, etc.)
 * 
 * Example:
 * ```typescript
 * import { logger } from './utils/logger';
 * 
 * logger.info('User logged in', { userId: user.id });
 * logger.error('Failed to save chapter', error);
 * ```
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    level: LogLevel;
    message: string;
    data?: any;
    timestamp: string;
    userId?: string;
}

class Logger {
    private isDevelopment = import.meta.env.DEV as boolean;
    private userId: string | null = null;

    /**
     * Set the current user ID for logging context
     */
    setUserId(userId: string | null) {
        this.userId = userId;
    }

    /**
     * Create a structured log entry
     */
    private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
        return {
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            userId: this.userId || undefined
        };
    }

    /**
     * Send log to monitoring service in production
     */
    private sendToMonitoring(entry: LogEntry) {
        // TODO: Integrate Sentry or other monitoring service
        // Example with Sentry:
        // if (window.Sentry && entry.level === 'error') {
        //     window.Sentry.captureException(entry.data, {
        //         level: entry.level,
        //         extra: {
        //             message: entry.message,
        //             userId: entry.userId
        //         }
        //     });
        // }

        // For now, we could send to a backend endpoint
        if (!this.isDevelopment && entry.level === 'error') {
            // Optionally send critical errors to backend
            fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            }).catch(() => {
                // Silently fail if logging endpoint is not available
            });
        }
    }

    /**
     * Log general information (development only)
     */
    log(message: string, data?: any) {
        const entry = this.createLogEntry('log', message, data);
        if (this.isDevelopment) {
            console.log(`[LOG] ${message}`, data || '');
        }
    }

    /**
     * Log informational messages
     */
    info(message: string, data?: any) {
        const entry = this.createLogEntry('info', message, data);
        if (this.isDevelopment) {
            console.info(`ℹ️ [INFO] ${message}`, data || '');
        }
    }

    /**
     * Log warnings (sent to monitoring in production)
     */
    warn(message: string, data?: any) {
        const entry = this.createLogEntry('warn', message, data);
        if (this.isDevelopment) {
            console.warn(`⚠️ [WARN] ${message}`, data || '');
        } else {
            this.sendToMonitoring(entry);
        }
    }

    /**
     * Log errors (always sent to monitoring)
     */
    error(message: string, error?: any) {
        const entry = this.createLogEntry('error', message, error);

        if (this.isDevelopment) {
            console.error(`❌ [ERROR] ${message}`, error || '');
        } else {
            this.sendToMonitoring(entry);
        }
    }

    /**
     * Log debug information (development only)
     */
    debug(message: string, data?: any) {
        if (this.isDevelopment) {
            console.debug(`🔍 [DEBUG] ${message}`, data || '');
        }
    }

    /**
     * Log performance metrics
     */
    performance(label: string, duration: number) {
        const entry = this.createLogEntry('info', `Performance: ${label}`, { duration });

        if (this.isDevelopment) {
            console.log(`⚡ [PERF] ${label}: ${duration}ms`);
        }

        // In production, you might want to send this to analytics
        if (!this.isDevelopment && duration > 1000) {
            // Log slow operations
            this.sendToMonitoring(entry);
        }
    }

    /**
     * Create a performance timer
     * 
     * Usage:
     * ```typescript
     * const timer = logger.startTimer('API Call');
     * await fetchData();
     * timer.end();
     * ```
     */
    startTimer(label: string) {
        const start = performance.now();
        return {
            end: () => {
                const duration = Math.round(performance.now() - start);
                this.performance(label, duration);
            }
        };
    }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogLevel, LogEntry };
