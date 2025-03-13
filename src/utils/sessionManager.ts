import { logger } from "./logging.js";

export interface SessionMetadata {
    created: Date;
    lastAccessed: Date;
    size: number;
    version: number;
}

export interface SessionData<T> {
    data: T;
    metadata: SessionMetadata;
}

export interface SessionStorageProvider<T> {
    get(sessionId: string): Promise<SessionData<T> | null>;
    set(sessionId: string, data: SessionData<T>): Promise<void>;
    delete(sessionId: string): Promise<void>;
    cleanup(maxAge: number): Promise<void>;
}

export class InMemorySessionStorage<T> implements SessionStorageProvider<T> {
    private sessions = new Map<string, SessionData<T>>();

    async get(sessionId: string): Promise<SessionData<T> | null> {
        const session = this.sessions.get(sessionId);
        if (session) {
            // Deep clone to prevent direct mutation
            return structuredClone(session);
        }
        return null;
    }

    async set(sessionId: string, data: SessionData<T>): Promise<void> {
        this.sessions.set(sessionId, structuredClone(data));
    }

    async delete(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId);
    }

    async cleanup(maxAge: number): Promise<void> {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.metadata.lastAccessed.getTime() > maxAge) {
                this.sessions.delete(sessionId);
                logger.info(`Cleaned up expired session: ${sessionId}`);
            }
        }
    }
}

export class SessionManager<T> {
    private storage: SessionStorageProvider<T>;
    private readonly maxSessionAge: number;
    private readonly maxSessionSize: number;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(
        storage: SessionStorageProvider<T>,
        options: {
            maxSessionAge?: number;
            maxSessionSize?: number;
            cleanupIntervalMs?: number;
        } = {}
    ) {
        this.storage = storage;
        this.maxSessionAge = options.maxSessionAge || 24 * 60 * 60 * 1000; // 24 hours
        this.maxSessionSize = options.maxSessionSize || 5 * 1024 * 1024; // 5MB

        if (options.cleanupIntervalMs) {
            this.startCleanupInterval(options.cleanupIntervalMs);
        }
    }

    private startCleanupInterval(intervalMs: number): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cleanupInterval = setInterval(() => {
            this.cleanup().catch(err => {
                logger.error('Session cleanup failed:', err);
            });
        }, intervalMs);
    }

    async getSession(sessionId: string): Promise<SessionData<T>> {
        const session = await this.storage.get(sessionId);
        if (!session) {
            return this.createSession(sessionId);
        }

        // Update last accessed time
        session.metadata.lastAccessed = new Date();
        await this.storage.set(sessionId, session);
        return session;
    }

    private async createSession(sessionId: string): Promise<SessionData<T>> {
        const session: SessionData<T> = {
            data: {} as T, // Initialize with empty data
            metadata: {
                created: new Date(),
                lastAccessed: new Date(),
                size: 0,
                version: 1
            }
        };
        await this.storage.set(sessionId, session);
        logger.info(`Created new session: ${sessionId}`);
        return session;
    }

    async updateSession(sessionId: string, data: T): Promise<void> {
        const session = await this.getSession(sessionId);
        const newSize = this.calculateSize(data);

        if (newSize > this.maxSessionSize) {
            throw new Error(`Session size limit exceeded. Max: ${this.maxSessionSize}, Attempted: ${newSize}`);
        }

        session.data = data;
        session.metadata.lastAccessed = new Date();
        session.metadata.size = newSize;
        await this.storage.set(sessionId, session);
    }

    async deleteSession(sessionId: string): Promise<void> {
        await this.storage.delete(sessionId);
        logger.info(`Deleted session: ${sessionId}`);
    }

    async cleanup(): Promise<void> {
        await this.storage.cleanup(this.maxSessionAge);
    }

    private calculateSize(data: T): number {
        // Rough estimation of size in bytes
        return new TextEncoder().encode(JSON.stringify(data)).length;
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
} 