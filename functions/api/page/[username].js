export async function onRequestGet({ params, env }) {
  const username = (params.username || "").toString().trim().toLowerCase();
  if (!username) {
    return new Response(JSON.stringify({ ok: false, error: "Username required" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const profile = await env.DB.prepare(
    "SELECT username, display_name, bio, avatar_text, theme, updated_at FROM profiles WHERE username = ?1 LIMIT 1"
  ).bind(username).first();

  if (!profile) {
    return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json" }
    });
  }

  const links = await env.DB.prepare(
    "SELECT id, title, url, active, sort_order, updated_at FROM links WHERE username = ?1 ORDER BY sort_order ASC, updated_at ASC"
  ).bind(username).all();

  const data = {
    profile: {
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_text: profile.avatar_text,
      theme: profile.theme,
      updated_at: profile.updated_at
    },
    links: (links.results || []).map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      active: !!link.active,
      sort_order: link.sort_order,
      updated_at: link.updated_at
    }))
  };

  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
