async function verifySignature(
  payload,
  signature,
  secret
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["verify"]
  );

  const base64 = signature
    .replace(/-/g, "+")
    .replace(/_/g, "/") + "==";

  const bytes = Uint8Array.from(
    atob(base64),
    c => c.charCodeAt(0)
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    bytes,
    new TextEncoder().encode(payload)
  );
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  const protectedPath =
    path === "/panel/" ||
    path.startsWith("/panel/") ||
    path === "/api/state";

  if (!protectedPath) {
    return context.next();
  }

  const cookie =
    context.request.headers.get("Cookie") || "";

  const match = cookie.match(
    /(?:^|;\s*)STP_SESSION=([^;]+)/
  );

  if (!match) {
    return Response.redirect(
      new URL("/", context.request.url),
      302
    );
  }

  try {
    const parts = match[1].split(".");

    if (parts.length !== 3) {
      throw new Error("Invalid session");
    }

    const id = Number(parts[0]);
    const expiresAt = Number(parts[1]);
    const signature = parts[2];

    if (!id || Date.now() >= expiresAt) {
      throw new Error("Expired session");
    }

    const valid = await verifySignature(
      `${id}.${expiresAt}`,
      signature,
      context.env.SESSION_SECRET
    );

    if (!valid) {
      throw new Error("Invalid signature");
    }

    const row = await context.env.DB
      .prepare(
        "SELECT active, expires_at FROM keys WHERE id = ?"
      )
      .bind(id)
      .first();

    if (
      !row ||
      !row.active ||
      Date.now() >= Number(row.expires_at)
    ) {
      throw new Error("Access expired");
    }

    return context.next();

  } catch (error) {
    return Response.redirect(
      new URL("/", context.request.url),
      302
    );
  }
                      }
