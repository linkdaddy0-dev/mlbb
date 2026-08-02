const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/linkdaddy0-dev/mlbb/main/public";
const GMS_BASE = "https://api.gms.moontontech.com/api/gms/source";
const ALLOWED_GMS_SOURCES = new Set([
  "2713644/2766683",
  "2713644/2777391",
  "2713644/2777386",
  "2713644/2777392",
  "2713644/2777394",
]);
const MOONTON_BASE = "https://mapi.mobilelegends.com";

// Moonton runs two hero APIs and they do NOT agree.
//
//   legacy  mapi.mobilelegends.com/hero/detail   -> heroes 1-124 only. For 125+
//                                                  it answers 200 with a payload
//                                                  of nulls, which is why those
//                                                  heroes had no skills.
//   current api.gms.moontontech.com  source 2766683 -> all 133 heroes, including
//                                                  heroskilllist with real names,
//                                                  descriptions and icon URLs.
//
// Anything hero-shaped therefore has to consult the current API, and fall back
// to the legacy one rather than the other way round.
const GMS_HERO_SOURCE = "2713644/2766683";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
};

function withCors(response, cacheControl) {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));
  if (cacheControl) headers.set("Cache-Control", cacheControl);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(body, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": cacheControl,
    },
  });
}

async function proxyGms(request, sourcePath) {
  if (!ALLOWED_GMS_SOURCES.has(sourcePath)) {
    return new Response("Unknown official source", { status: 404 });
  }
  if (request.method !== "POST") {
    return new Response("POST required", { status: 405 });
  }

  try {
    const upstream = await fetch(`${GMS_BASE}/${sourcePath}`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        Origin: "https://www.mobilelegends.com",
        Referer: "https://www.mobilelegends.com/",
        "User-Agent": request.headers.get("User-Agent") || "MLBB-OTA-Sync/1.0",
      },
      body: await request.text(),
      cf: {
        cacheEverything: false,
      },
    });
    return withCors(upstream, "no-store");
  } catch (err) {
    return new Response(JSON.stringify({ error: "GMS upstream unavailable", detail: err.message }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}

/**
 * Whole hero roster from the current GMS API, one record per hero.
 *
 * It arrives as a single ~1MB document, so it is cached at the edge for an hour
 * and sliced per request rather than re-fetched for every hero.
 */
async function fetchGmsHeroRecords() {
  const upstream = await fetch(`${GMS_BASE}/${GMS_HERO_SOURCE}`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Origin: "https://www.mobilelegends.com",
      Referer: "https://www.mobilelegends.com/",
      "User-Agent": "MLBB-OTA-Sync/1.0",
    },
    body: JSON.stringify({ pageSize: 500, pageIndex: 1 }),
    cf: { cacheEverything: true, cacheTtl: 3600 },
  });
  if (!upstream.ok) throw new Error(`GMS hero source ${upstream.status}`);
  const payload = await upstream.json();
  return payload?.data?.records || [];
}

/** Flattens one GMS record into the fields the scraper and app care about. */
function normaliseGmsHero(record) {
  const d = record?.data || {};
  const hero = d.hero?.data || {};
  const skills = [];
  for (const group of hero.heroskilllist || []) {
    for (const s of group.skilllist || []) {
      skills.push({
        name: s.skillname || "",
        description: s.skilldesc || "",
        icon: s.skillicon || "",
        tag: s.skilltag || "",
        cost: s["skillcd&cost"] || "",
        video: s.skillvideo || "",
      });
    }
  }
  return {
    hero_id: d.hero_id,
    // Upstream quirk: `name` is the hero name for most entries ("Miya") but the
    // epithet for some of the newest ones (133 returns "Esper Assassin"). Do not
    // treat this as authoritative — the compiled dataset keeps its own names.
    name: hero.name || "",
    head: d.head || "",
    head_big: d.head_big || "",
    painting: d.painting || "",
    speciality: hero.speciality || "",
    difficulty: hero.difficulty,
    skills,
    relation: d.relation || null,
  };
}

/** True when the legacy payload came back with nothing usable in it. */
function legacyPayloadIsEmpty(payload) {
  const data = payload?.data;
  if (!data) return true;
  const skills = data?.skill?.skill;
  if (!Array.isArray(skills)) return true;
  // 125+ answer 200 with [{tips:null},{tips:null},…] and no cover picture
  const hasSkillContent = skills.some(
    (s) => s && Object.values(s).some((v) => v !== null && v !== "" && v !== undefined),
  );
  return !hasSkillContent && !data.cover_picture;
}

/**
 * Unified hero detail. Consults BOTH APIs and returns whichever actually has
 * data, with the current GMS API taking precedence for the skill list.
 */
async function heroDetailFromBothApis(url) {
  const heroId = url.searchParams.get("id") || url.searchParams.get("heroid");
  const language = url.searchParams.get("language") || "en";
  if (!heroId || !/^\d+$/.test(heroId)) {
    return jsonResponse({ error: "Valid id is required" }, 400);
  }

  const [gmsResult, legacyResult] = await Promise.allSettled([
    fetchGmsHeroRecords(),
    fetch(
      `${MOONTON_BASE}/hero/detail?id=${heroId}&language=${encodeURIComponent(language)}`,
      {
        headers: { Accept: "application/json", "User-Agent": "MLBB-OTA-Sync/1.0" },
        cf: { cacheEverything: true, cacheTtl: 3600 },
      },
    ).then((r) => (r.ok ? r.json() : null)),
  ]);

  let gms = null;
  if (gmsResult.status === "fulfilled") {
    const record = gmsResult.value.find(
      (r) => String(r?.data?.hero_id) === String(heroId),
    );
    if (record) gms = normaliseGmsHero(record);
  }

  const legacy = legacyResult.status === "fulfilled" ? legacyResult.value : null;
  const legacyUsable = legacy && !legacyPayloadIsEmpty(legacy);

  if (!gms && !legacyUsable) {
    return jsonResponse(
      { error: "Hero not found in either API", hero_id: heroId },
      404,
    );
  }

  return jsonResponse(
    {
      hero_id: Number(heroId),
      // Which upstream actually supplied usable data, so callers can log the
      // legacy API silently going empty instead of guessing.
      sources: {
        gms: Boolean(gms),
        legacy: Boolean(legacyUsable),
      },
      gms,
      legacy: legacyUsable ? legacy.data : null,
    },
    200,
    "public, max-age=3600",
  );
}

async function proxyOfficialPage(url) {
  let upstreamUrl;
  if (url.pathname === "/official/page/rank") {
    upstreamUrl = "https://www.mobilelegends.com/rank";
  } else {
    const heroId = url.searchParams.get("heroid");
    if (!heroId || !/^\d+$/.test(heroId)) {
      return new Response("Valid heroid is required", { status: 400 });
    }
    upstreamUrl =
      `https://www.mobilelegends.com/academy/guide/detailrank?heroid=${heroId}`;
  }

  try {
    const response = await fetch(upstreamUrl, {
      headers: { "User-Agent": "Mozilla/5.0 MLBB-OTA-Proxy" },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    return withCors(response, "public, max-age=300");
  } catch (err) {
    return new Response(JSON.stringify({ error: "Official page upstream unavailable", detail: err.message }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}

async function proxyStaticData(request, url) {
  try {
    const upstream = await fetch(`${GITHUB_RAW_BASE}${url.pathname}${url.search}`, {
      method: request.method,
      headers: { Accept: request.headers.get("Accept") || "*/*" },
      cf: {
        cacheEverything: true,
        cacheTtl: url.pathname.endsWith("current_patch.json") ? 60 : 3600,
      },
    });
    return withCors(
      upstream,
      url.pathname.endsWith("current_patch.json")
        ? "public, max-age=60"
        : "public, max-age=3600",
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Static data upstream unavailable", detail: err.message }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}

async function proxyLegacyMoonton(request, url) {
  // /moonton/hero/detail keeps its old shape for existing callers, but now
  // falls through to the current GMS API when the legacy payload is empty —
  // previously it just returned the nulls and the caller had no idea.
  if (url.pathname === "/moonton/hero/detail") {
    const heroId = url.searchParams.get("id");
    const language = url.searchParams.get("language") || "en";
    if (!heroId || !/^\d+$/.test(heroId)) {
      return new Response("Valid id is required", { status: 400 });
    }

    let legacy = null;
    try {
      const res = await fetch(
        `${MOONTON_BASE}/hero/detail?id=${heroId}&language=${encodeURIComponent(language)}`,
        {
          headers: { Accept: "application/json", "User-Agent": request.headers.get("User-Agent") || "MLBB-OTA-Sync/1.0" },
          cf: { cacheEverything: true, cacheTtl: 3600 },
        },
      );
      if (res.ok) legacy = await res.json();
    } catch (err) {
      legacy = null;
    }

    if (legacy && !legacyPayloadIsEmpty(legacy)) {
      return jsonResponse(legacy, 200, "public, max-age=3600");
    }

    try {
      const records = await fetchGmsHeroRecords();
      const record = records.find((r) => String(r?.data?.hero_id) === String(heroId));
      if (record) {
        return jsonResponse(
          {
            code: 2000,
            message: "SUCCESS",
            source: "gms-fallback",
            data: normaliseGmsHero(record),
          },
          200,
          "public, max-age=3600",
        );
      }
    } catch (err) {
      // fall through to whatever the legacy call produced
    }

    if (legacy) return jsonResponse(legacy, 200, "public, max-age=3600");
    return jsonResponse({ error: "Hero unavailable from both APIs" }, 502);
  }

  try {
    const response = await fetch(`${MOONTON_BASE}/hero/list`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": request.headers.get("User-Agent") || "MLBB-OTA-Sync/1.0",
      },
      cf: { cacheEverything: true, cacheTtl: 3600 },
    });
    return withCors(response, "public, max-age=3600");
  } catch (err) {
    return new Response(JSON.stringify({ error: "Moonton API upstream unavailable", detail: err.message }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const gmsMatch = url.pathname.match(
      /^\/official\/gms\/source\/(\d+\/\d+)$/,
    );
    if (gmsMatch) return proxyGms(request, gmsMatch[1]);

    // Both-API hero detail
    if (url.pathname === "/official/hero/detail") {
      return heroDetailFromBothApis(url);
    }

    if (
      url.pathname === "/moonton/hero/list" ||
      url.pathname === "/moonton/hero/detail"
    ) {
      return proxyLegacyMoonton(request, url);
    }

    if (
      url.pathname === "/official/page/rank" ||
      url.pathname === "/official/page/detailrank"
    ) {
      return proxyOfficialPage(url);
    }

    if (url.pathname.startsWith("/data/") || url.pathname.startsWith("/assets/")) {
      return proxyStaticData(request, url);
    }

    return new Response(
      JSON.stringify({
        service: "mlbb-ota-proxy",
        routes: [
          "POST /official/gms/source/2713644/2766683",
          "POST /official/gms/source/2713644/2777391",
          "GET /official/hero/detail?id=123  (both APIs, GMS preferred)",
          "GET /official/page/rank",
          "GET /official/page/detailrank?heroid=123",
          "GET /moonton/hero/list",
          "GET /moonton/hero/detail?id=123&language=en  (falls back to GMS)",
          "GET /data/*",
          "GET /assets/*",
        ],
      }),
      {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      },
    );
  },
};
