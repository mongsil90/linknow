function normalizeUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) return { ok: false, message: "URL is required" };
  let value = raw;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    value = `https://${value}`;
  }
  try {
    const url = new URL(value);
    const protocol = url.protocol.toLowerCase();
    if (protocol === "javascript:" || protocol === "data:") {
      return { ok: false, message: "Blocked URL scheme" };
    }
    if (protocol !== "http:" && protocol !== "https:") {
      return { ok: false, message: "Only http/https URLs are allowed" };
    }
    return { ok: true, url: url.toString() };
  } catch (err) {
    return { ok: false, message: "Invalid URL" };
  }
}

function cleanString(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

export async function onRequestPost({ request, env }) {
  const adminKey = request.headers.get("x-admin-key") || "";
  if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const username = cleanString(body.username).toLowerCase();
  if (!username) {
    return new Response(JSON.stringify({ ok: false, error: "Username required" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const profile = {
    username,
    display_name: cleanString(body.displayName),
    bio: cleanString(body.bio),
    avatar_text: cleanString(body.avatarText),
    theme: cleanString(body.theme, "night")
  };

  const incomingLinks = Array.isArray(body.links) ? body.links : [];
  const limitedLinks = incomingLinks.slice(0, 10);

  const normalizedLinks = [];
  for (let i = 0; i < limitedLinks.length; i += 1) {
    const link = limitedLinks[i] || {};
    const title = cleanString(link.title, `Link ${i + 1}`);
    const normalized = normalizeUrl(link.url);
    if (!normalized.ok) {
      return new Response(JSON.stringify({ ok: false, error: `Invalid link URL: ${title}` }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }
    normalizedLinks.push({
      id: link.id || crypto.randomUUID(),
      title,
      url: normalized.url,
      active: link.active !== false,
      sort_order: i
    });
  }

  const statements = [];
  statements.push(env.DB.prepare(
    "INSERT INTO profiles (username, display_name, bio, avatar_text, theme, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, datetime('now')) ON CONFLICT(username) DO UPDATE SET display_name = excluded.display_name, bio = excluded.bio, avatar_text = excluded.avatar_text, theme = excluded.theme, updated_at = datetime('now')"
  ).bind(profile.username, profile.display_name, profile.bio, profile.avatar_text, profile.theme));

  statements.push(env.DB.prepare("DELETE FROM links WHERE username = ?1").bind(profile.username));

  for (const link of normalizedLinks) {
    statements.push(env.DB.prepare(
      "INSERT INTO links (id, username, title, url, active, sort_order, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))"
    ).bind(link.id, profile.username, link.title, link.url, link.active ? 1 : 0, link.sort_order));
  }

  await env.DB.batch(statements);

  return new Response(JSON.stringify({ ok: true, data: { username, links: normalizedLinks.length } }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
