const SOURCE =
  "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";

function pick(obj, keys) {
  for (const key of keys) {
    if (
      obj &&
      obj[key] !== undefined &&
      obj[key] !== null &&
      String(obj[key]).trim() !== ""
    ) {
      return obj[key];
    }
  }

  return null;
}

function parseResult(item) {
  const period = pick(item, [
    "issueNumber",
    "issue",
    "period",
    "periodNumber",
    "code",
    "numberIssue"
  ]);

  let result = pick(item, [
    "number",
    "result",
    "openNumber",
    "winningNumber",
    "winNumber"
  ]);

  if (result !== null) {
    const match = String(result).match(/[0-9]/);
    result = match ? Number(match[0]) : null;
  }

  if (period === null || result === null) {
    return null;
  }

  return {
    period: String(period),
    result: result
  };
}

export async function onRequestGet() {
  try {
    const response = await fetch(SOURCE, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      throw new Error("Source HTTP " + response.status);
    }

    const json = await response.json();

    const list =
      Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.data?.list)
        ? json.data.list
        : Array.isArray(json?.result?.data)
        ? json.result.data
        : Array.isArray(json)
        ? json
        : [];

    const results = list
      .map(parseResult)
      .filter(Boolean);

    if (results.length < 2) {
      throw new Error(
        "Source returned fewer than two usable results"
      );
    }

    // First item = newest
    // Second item = previous result
    // Use the previous result for the one-period delay.
    const delayedResult = results[1];

    return Response.json(
      {
        live: true,
        latest: delayedResult,
        history: results.slice(2, 32),
        source: "WinGo_1M"
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (error) {
    return Response.json(
      {
        live: false,
        latest: null,
        history: [],
        error: error instanceof Error
          ? error.message
          : String(error)
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
}
