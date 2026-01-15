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
		const { temperature, humidity, light } = body;

		if (temperature === undefined && humidity === undefined && light === undefined) {
			return json({ error: "Temperature, humidity or light required" }, { status: 400 });
		}

		await pool.query(
			`INSERT INTO sensor_readings (temperature, humidity, light, timestamp)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, timestamp, temperature, humidity, light`,
			[temperature ?? null, humidity ?? null, light ?? null]
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
