import { Pool } from "pg";

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    pool.on("error", (err) => {
      console.error("Database pool error:", err);
      pool = null;
    });
  }

  return pool;
};

export const query = async (text: string, params?: any[]) => {
  const pool = getPool();
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  }
};
