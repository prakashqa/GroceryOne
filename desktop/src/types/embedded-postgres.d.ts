/**
 * Minimal ambient types for `embedded-postgres`.
 *
 * The package ships its real types under dist/index.d.ts behind a package.json
 * `exports` map that our classic `node` moduleResolution can't follow. Rather
 * than churn the whole tsconfig, we declare the small surface we use.
 */
declare module 'embedded-postgres' {
  import type { Client } from 'pg';

  export interface PostgresOptions {
    databaseDir: string;
    port: number;
    user: string;
    password: string;
    authMethod: 'scram-sha-256' | 'password' | 'md5';
    persistent: boolean;
    initdbFlags: string[];
    onLog: (message: string) => void;
    onError: (messageOrError: string | Error | unknown) => void;
  }

  export default class EmbeddedPostgres {
    constructor(options?: Partial<PostgresOptions>);
    initialise(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getPgClient(database?: string, host?: string): Client;
    createDatabase(name: string): Promise<void>;
    dropDatabase(name: string): Promise<void>;
  }
}
