import { json, type RequestHandler } from "@sveltejs/kit";
import { AUTH_TOKEN } from "$env/static/private";
import { pool } from "$lib/db";

export const GET: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get("authorization");
	const token = authHeader?.replace("Bearer ", "");

	if (!token || token !== AUTH_TOKEN) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		let query = "SELECT timestamp, temperature, humidity, FROM sensor_readings ORDER BY timestamp DESC";

		query += ` ORDER BY timestamp ASC`;

		const result = await pool.query(query);

		// Transform data for frontend
		const data = result.rows.map((row) => ({
			time: row.timestamp,
			temperature: row.temperature,
			humidity: row.humidity
		}));

		return json({ data });
	} catch (error) {
		console.error("PostgreSQL error:", error);
		return json({ error: "Failed to fetch data" }, { status: 500 });
	}
};
