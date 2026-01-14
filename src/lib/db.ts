import pkg from "pg";
const { Pool } = pkg;
import { DATABASE_URL } from "$env/static/private";

export const pool = new Pool({
	connectionString: DATABASE_URL,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000
});
