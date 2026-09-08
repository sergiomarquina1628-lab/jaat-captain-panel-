async function sign(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const key = String(body.key || "").trim();

    if (!key) {
      return Response.json(
        { valid: false, error: "Enter your access key." },
        { status: 400 }
      );
    }

    const row = await env.DB
      .prepare(
        "SELECT id, expires_at, active FROM keys WHERE key = ? LIMIT 1"
      )
      .bind(key)
      .first();

    if (!row || !row.active) {
      return Response.json(
        { valid: false, error: "Invalid access key." },
        { status: 401 }
      );
    }

    const expiresAt = Number(row.expires_at);

    if (Date.now() >= expiresAt) {
      await env.DB
        .prepare("UPDATE keys SET active = 0 WHERE id = ?")
        .bind(row.id)
        .run();

      return Response.json(
        { valid: false, error: "Access key expired." },
        { status: 401 }
      );
    }

    const payload = `${row.id}.${expiresAt}`;
    const signature = await sign(payload, env.SESSION_SECRET);
    const token = `${payload}.${signature}`;

    return new Response(
      JSON.stringify({ valid: true }),
      {
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie":
            `STP_SESSION=${token}; ` +
            `Path=/; HttpOnly; Secure; SameSite=Lax; ` +
            `Max-Age=${Math.floor((expiresAt - Date.now()) / 1000)}`
        }
      }
    );

  } catch (error) {
    return Response.json(
      {
        valid: false,
        error: "Verification service unavailable."
      },
      { status: 500 }
    );
  }
        }
