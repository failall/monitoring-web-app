import { json, type RequestHandler } from "@sveltejs/kit";
import { AUTH_TOKEN } from "$env/static/private";
import { pool } from "$lib/db";

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get("authorization");
	const token = authHeader?.replace("Bearer ", "");

	if (!token || token !== AUTH_TOKEN) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { temperature, humidity } = body;

		if (temperature === undefined && humidity === undefined) {
			return json({ error: "Temperature or humidity required" }, { status: 400 });
		}

		const result = await pool.query(
			`INSERT INTO sensor_readings (temperature, humidity, timestamp)
       VALUES ($1, $2, NOW())
       RETURNING id, timestamp, temperature, humidity`,
			[temperature ?? null, humidity ?? null]
		);

		return json({
			success: true,
			message: "Data upserted"
		});
	} catch (error) {
		console.error("PostgreSQL error:", error);
		return json({ error: "Upsert failed" }, { status: 500 });
	}
};
