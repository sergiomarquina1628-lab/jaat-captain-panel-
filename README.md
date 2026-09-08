# Jaat Captain Panel — LIVE WinGo 1M

This build attempts a live server-side fetch of:
WinGo 1M history source

The Cloudflare Pages Function returns the previous settled result (second item), which is the requested one-period delay for a 1-minute game, and sends the next 30 delayed history records.

IMPORTANT:
- The endpoint was found referenced as a WinGo history JSON endpoint, but it is not verified here as an official JaiClub15 API.
- The API response format can change. The parser handles common field names but may need adjustment.
- Cloudflare Pages Functions run server-side, avoiding browser CORS issues.
- Deploy through Git integration or Wrangler. Cloudflare's current docs state Direct Upload does not support Functions.

Deploy:
1. Put these files in a GitHub repository.
2. Cloudflare Workers & Pages → Create → Pages → connect the repository.
3. Build command: exit 0
4. Build output directory: .
5. Deploy.

Because this project contains a /functions directory, use Git integration or Wrangler rather than dashboard Direct Upload.
