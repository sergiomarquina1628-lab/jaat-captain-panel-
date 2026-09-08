function makeKey() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);

  let result = "";

  for (const byte of bytes) {
    result += characters[byte % characters.length];
  }

  return result.match(/.{1,5}/g).join("-");
}

export async function onRequestPost({ request, env }) {
  if (
    request.headers.get("x-admin-secret") !==
    env.ADMIN_SECRET
  ) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const days = Math.max(
      1,
      Math.min(365, Number(body.days) || 7)
    );

    const key = makeKey();
    const expiresAt =
      Date.now() + days * 24 * 60 * 60 * 1000;

    await env.DB
      .prepare(
        `INSERT INTO keys
        (key, expires_at, active)
        VALUES (?, ?, 1)`
      )
      .bind(key, expiresAt)
      .run();

    return Response.json({
      key,
      days,
      expires_at: new Date(expiresAt).toISOString()
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
