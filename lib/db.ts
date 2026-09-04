import { neon } from '@neondatabase/serverless';

type SqlClient = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, any>[]>;

const sql: SqlClient = (strings, ...values) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }
  return neon(connectionString)(strings, ...values) as Promise<Record<string, any>[]>;
};

export default sql;
