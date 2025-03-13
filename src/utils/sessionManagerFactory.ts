import { SessionManager, InMemorySessionStorage } from './sessionManager.js';
import {
    APIBlueprintSession,
    ADRSession,
    CodeReviewSession,
    ImplementationStrategySession
} from './toolSessions.js';
import { logger } from './logging.js';

export class SessionManagerFactory {
    private static instance: SessionManagerFactory;
    private sessionManagers: {
        apiBlueprint: SessionManager<APIBlueprintSession>;
        adr: SessionManager<ADRSession>;
        codeReview: SessionManager<CodeReviewSession>;
        implementationStrategy: SessionManager<ImplementationStrategySession>;
    };

    private constructor() {
        // Initialize session managers with default options
        const defaultOptions = {
            maxSessionAge: 24 * 60 * 60 * 1000, // 24 hours
            maxSessionSize: 5 * 1024 * 1024, // 5MB
            cleanupIntervalMs: 60 * 60 * 1000 // 1 hour
        };

        this.sessionManagers = {
            apiBlueprint: new SessionManager<APIBlueprintSession>(
                new InMemorySessionStorage<APIBlueprintSession>(),
                defaultOptions
            ),
            adr: new SessionManager<ADRSession>(
                new InMemorySessionStorage<ADRSession>(),
                defaultOptions
            ),
            codeReview: new SessionManager<CodeReviewSession>(
                new InMemorySessionStorage<CodeReviewSession>(),
                defaultOptions
            ),
            implementationStrategy: new SessionManager<ImplementationStrategySession>(
                new InMemorySessionStorage<ImplementationStrategySession>(),
                defaultOptions
            )
        };

        logger.info('SessionManagerFactory initialized');
    }

    public static getInstance(): SessionManagerFactory {
        if (!SessionManagerFactory.instance) {
            SessionManagerFactory.instance = new SessionManagerFactory();
        }
        return SessionManagerFactory.instance;
    }

    public getAPIBlueprintManager(): SessionManager<APIBlueprintSession> {
        return this.sessionManagers.apiBlueprint;
    }

    public getADRManager(): SessionManager<ADRSession> {
        return this.sessionManagers.adr;
    }

    public getCodeReviewManager(): SessionManager<CodeReviewSession> {
        return this.sessionManagers.codeReview;
    }

    public getImplementationStrategyManager(): SessionManager<ImplementationStrategySession> {
        return this.sessionManagers.implementationStrategy;
    }

    public cleanup(): void {
        Object.values(this.sessionManagers).forEach(manager => {
            manager.destroy();
        });
        logger.info('All session managers cleaned up');
    }
} 