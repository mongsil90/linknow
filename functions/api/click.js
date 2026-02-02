export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const username = String(body.username || "").trim().toLowerCase();
  const linkId = String(body.link_id || "").trim();
  if (!username) {
    return new Response(JSON.stringify({ ok: false, error: "Username required" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const referrer = request.headers.get("referer") || "";
  const ua = request.headers.get("user-agent") || "";

  await env.DB.prepare(
    "INSERT INTO clicks (username, link_id, referrer, ua, ts) VALUES (?1, ?2, ?3, ?4, datetime('now'))"
  ).bind(username, linkId || null, referrer, ua).run();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
