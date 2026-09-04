/**
 * Cloudflare Worker for Aethera Email Dispatcher
 * Secure gateway between Aethera backend/frontend and Google Apps Script Gmail Hub
 */

export default {
	async fetch(request, env, ctx) {
		// Handle CORS Preflight
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
					"Access-Control-Max-Age": "86400",
				},
			});
		}

		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Content-Type": "application/json",
		};

		// Health check / GET ping
		if (request.method === "GET") {
			return new Response(
				JSON.stringify({ status: "healthy", service: "Aethera Email Worker" }),
				{ status: 200, headers: corsHeaders }
			);
		}

		if (request.method !== "POST") {
			return new Response(
				JSON.stringify({ status: "error", message: "Method not allowed" }),
				{ status: 405, headers: corsHeaders }
			);
		}

		// Verify Auth Token if configured
		const authHeader = request.headers.get("Authorization") || request.headers.get("x-api-key");
		const expectedToken = env.WORKER_AUTH_TOKEN || "aethera_worker_secret_2026";
		
		if (authHeader) {
			const cleanToken = authHeader.replace(/^Bearer\s+/i, "").trim();
			if (cleanToken !== expectedToken) {
				return new Response(
					JSON.stringify({ status: "error", message: "Unauthorized: Invalid worker token" }),
					{ status: 401, headers: corsHeaders }
				);
			}
		}

		try {
			const body = await request.json();
			const { to, subject, message, senderName } = body;

			if (!to || !subject || !message) {
				return new Response(
					JSON.stringify({
						status: "error",
						message: "Missing required fields: to, subject, or message",
					}),
					{ status: 400, headers: corsHeaders }
				);
			}

			// Payload sent to Google Apps Script
			const googleAppsScriptPayload = {
				apiKey: env.APP_API_KEY || "QUESTRA_SECRET_123",
				to,
				subject,
				message,
				senderName: senderName || "Aethera Support",
			};

			const scriptUrl =
				env.GOOGLE_APPS_SCRIPT_URL ||
				"https://script.google.com/macros/s/AKfycbzmbb-WtSI0gIwo-x3hnCcxu-EOSAqWi3vFN5ldKCcc6W2BYnUR3VzjpD3zayyiXpobWQ/exec";

			// Forward to Google Apps Script (redirect follow is crucial for GAS)
			const gasResponse = await fetch(scriptUrl, {
				method: "POST",
				headers: {
					"Content-Type": "text/plain;charset=utf-8",
				},
				body: JSON.stringify(googleAppsScriptPayload),
				redirect: "follow",
			});

			const responseText = await gasResponse.text();
			let responseData;
			try {
				responseData = JSON.parse(responseText);
			} catch (e) {
				responseData = { status: "success", raw: responseText };
			}

			return new Response(JSON.stringify(responseData), {
				status: gasResponse.ok ? 200 : 502,
				headers: corsHeaders,
			});
		} catch (error) {
			return new Response(
				JSON.stringify({
					status: "error",
					message: error.message || "Internal Worker Error",
				}),
				{ status: 500, headers: corsHeaders }
			);
		}
	},
};
