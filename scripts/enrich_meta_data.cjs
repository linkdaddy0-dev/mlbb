const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const STATS_HTML = path.join(ROOT, 'scratch', 'mlbbhub_statistics.html');
const PATCH_META = path.join(ROOT, 'public', 'data', 'meta', 'current_patch.json');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
};

const normalizeName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const slugify = (name) =>
  normalizeName(name).replace(/\s+/g, '-');

const stripHtmlNoise = (text) =>
  String(text || '')
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');

function parseStatsSnapshot() {
  if (!fs.existsSync(STATS_HTML)) {
    throw new Error(`Missing stats snapshot: ${STATS_HTML}`);
  }

  const html = fs.readFileSync(STATS_HTML, 'utf8');
  const rows = [...html.matchAll(/<tr class="border-b[\s\S]*?<\/tr>/g)]
    .map((match) => match[0])
    .filter((row) => row.includes('href="/heroes/'));

  const stats = [];
  for (const row of rows) {
    const slug = row.match(/href="\/heroes\/([^"]+)"/)?.[1];
    const name = stripHtmlNoise(row.match(/<span class="text-\[11px\][^>]*>([^<]+)<\/span><\/a>/)?.[1]);
    if (!slug || !name) continue;

    const icon = stripHtmlNoise(row.match(/<img alt="[^"]+ hero icon"[\s\S]*?src="([^"]+)"/)?.[1] || '');
    const lane = stripHtmlNoise(row.match(/title="([^"]*(?:Lane|Roamer|Jungler)[^"]*)"/)?.[1] || '');
    const tier = row.match(/clip-angular-sm[^>]*>\s*([SABCD])\s*<\/div>/)?.[1] || 'C';
    const roles = [...row.matchAll(/title="(Fighter|Mage|Marksman|Assassin|Tank|Support)"/g)]
      .map((match) => match[1])
      .filter((role, idx, arr) => arr.indexOf(role) === idx);
    const values = [...row.matchAll(/>([0-9]+(?:\.[0-9]+)?)<!-- -->%<\/span>/g)].map((match) => Number(match[1]));
    if (values.length < 3) continue;

    stats.push({
      slug,
      name,
      role: roles[0] || 'Fighter',
      roles,
      lane: lane || inferLane(roles[0]),
      tier,
      avatar_url: icon,
      cover_thumb: icon,
      win_rate: values[0],
      pick_rate: values[values.length - 2],
      ban_rate: values[values.length - 1],
      stats_source: 'MLBBHub May 2026 ranked snapshot referencing mobilelegends.com aggregated ranked data',
      guide_video: {
        title: `${name} guide videos`,
        query: `Mobile Legends ${name} guide gameplay build counter`,
        embed_url: `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(`Mobile Legends ${name} guide gameplay build counter`)}`,
        search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`Mobile Legends ${name} guide gameplay build counter`)}`
      }
    });
  }

  return stats;
}

function inferLane(role) {
  const map = {
    Marksman: 'Gold Lane',
    Assassin: 'Jungle Lane',
    Mage: 'Mid Lane',
    Tank: 'Roam Lane',
    Support: 'Roam Lane',
    Fighter: 'EXP Lane'
  };
  return map[role] || 'Flex Lane';
}

function buildMetaPools(index) {
  const byRole = new Map();
  for (const hero of index) {
    const roles = hero.roles?.length ? hero.roles : [hero.role];
    for (const role of roles) {
      if (!byRole.has(role)) byRole.set(role, []);
      byRole.get(role).push(hero);
    }
  }
  for (const heroes of byRole.values()) {
    heroes.sort((a, b) => (b.win_rate + b.ban_rate * 0.2 + b.pick_rate * 0.35) - (a.win_rate + a.ban_rate * 0.2 + a.pick_rate * 0.35));
  }
  return byRole;
}

function makeCompatibility(hero, index, matrix) {
  const key = String(hero.id);
  const node = matrix[key] || { strong_against: [], weak_against: [], synergy: [] };
  const byId = new Map(index.map((item) => [Number(item.id), item]));
  const byRole = buildMetaPools(index);
  const preferred = {
    Marksman: ['Tank', 'Support'],
    Assassin: ['Tank', 'Mage'],
    Fighter: ['Support', 'Mage'],
    Mage: ['Tank', 'Fighter'],
    Tank: ['Marksman', 'Mage'],
    Support: ['Marksman', 'Fighter']
  };
  const avoided = {
    Marksman: ['Assassin'],
    Assassin: ['Tank'],
    Fighter: ['Marksman'],
    Mage: ['Assassin'],
    Tank: ['Mage'],
    Support: ['Assassin']
  };

  const hydrate = (items = []) => items
    .map((item) => {
      const match = byId.get(Number(item.id)) || index.find((h) => normalizeName(h.name) === normalizeName(item.name));
      return {
        id: match?.id || item.id || 0,
        name: match?.name || item.name || '',
        icon: match?.avatar_url || item.icon || '',
        win_rate: match?.win_rate,
        pick_rate: match?.pick_rate,
        ban_rate: match?.ban_rate,
        reason: item.reason || item.tips || ''
      };
    })
    .filter((item) => item.name);

  const poolPick = (roles, limit, reason) => {
    const seen = new Set([Number(hero.id)]);
    return roles
      .flatMap((role) => byRole.get(role) || [])
      .filter((item) => {
        if (seen.has(Number(item.id))) return false;
        seen.add(Number(item.id));
        return true;
      })
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        name: item.name,
        icon: item.avatar_url,
        win_rate: item.win_rate,
        pick_rate: item.pick_rate,
        ban_rate: item.ban_rate,
        reason
      }));
  };

  return {
    best_counters: hydrate(node.strong_against).slice(0, 5),
    most_countered_by: hydrate(node.weak_against).slice(0, 5),
    compatibility: hydrate(node.synergy).slice(0, 5),
    not_compatible: [],
    generated_synergy: poolPick(preferred[hero.role] || ['Tank', 'Support'], 3, `Pairs well with ${hero.name}'s ${hero.role} game plan.`),
    generated_risk: poolPick(avoided[hero.role] || ['Assassin'], 3, `Can pressure ${hero.name}'s usual lane and timing windows.`)
  };
}

function enrichLanguage(version, lang, stats) {
  const langDir = path.join(ROOT, 'public', 'data', 'patches', version, lang);
  const indexFile = path.join(langDir, 'heroes', 'index.json');
  const matrixFile = path.join(langDir, 'draft_matrix.json');
  if (!fs.existsSync(indexFile) || !fs.existsSync(matrixFile)) return 0;

  const index = readJson(indexFile);
  const matrix = readJson(matrixFile);
  const byName = new Map(index.map((hero) => [normalizeName(hero.name), hero]));
  const maxId = index.reduce((max, hero) => Math.max(max, Number(hero.id) || 0), 0);
  let nextId = maxId + 1;

  for (const stat of stats) {
    let hero = byName.get(normalizeName(stat.name));
    if (!hero && lang === 'en') {
      hero = {
        id: nextId++,
        name: stat.name,
        role: stat.role,
        avatar_url: stat.avatar_url,
        cover_thumb: stat.cover_thumb,
        durability: 50,
        offense: stat.role === 'Marksman' || stat.role === 'Assassin' ? 70 : 45,
        magic: stat.role === 'Mage' ? 75 : 35,
        difficulty: 55
      };
      index.push(hero);
      matrix[String(hero.id)] = { strong_against: [], weak_against: [], synergy: [] };
      byName.set(normalizeName(hero.name), hero);
    }
    if (!hero) continue;

    Object.assign(hero, {
      win_rate: stat.win_rate,
      pick_rate: stat.pick_rate,
      ban_rate: stat.ban_rate,
      tier: stat.tier,
      lane: stat.lane,
      roles: stat.roles,
      stats_source: stat.stats_source,
      guide_video: stat.guide_video
    });

    if (!hero.avatar_url && stat.avatar_url) hero.avatar_url = stat.avatar_url;
    if (!hero.cover_thumb && stat.cover_thumb) hero.cover_thumb = stat.cover_thumb;
  }

  const byId = new Map(index.map((hero) => [Number(hero.id), hero]));
  for (const hero of index) {
    const statExtras = makeCompatibility(hero, index, matrix);
    hero.meta_relationships = statExtras;

    const detailFile = path.join(langDir, 'heroes', `${hero.id}.json`);
    const detail = fs.existsSync(detailFile)
      ? readJson(detailFile)
      : {
          id: hero.id,
          name: hero.name,
          role: hero.role,
          durability: hero.durability || 50,
          offense: hero.offense || 50,
          magic: hero.magic || 30,
          difficulty: hero.difficulty || 55,
          avatar_url: hero.avatar_url,
          cover_url: hero.cover_thumb,
          skills: [],
          builds: { spells: [], items: [], tips: 'Build data will be refined as official profile data becomes available.' },
          matchups: {
            synergy: { name: '', tips: '' },
            counters: { name: '', tips: '' },
            countered_by: { name: '', tips: '' }
          }
        };

    Object.assign(detail, {
      win_rate: hero.win_rate,
      pick_rate: hero.pick_rate,
      ban_rate: hero.ban_rate,
      tier: hero.tier,
      lane: hero.lane,
      roles: hero.roles,
      avatar_url: detail.avatar_url || hero.avatar_url,
      cover_url: detail.cover_url || hero.cover_thumb,
      guide_video: hero.guide_video,
      meta_relationships: statExtras
    });

    for (const groupName of ['best_counters', 'most_countered_by', 'compatibility', 'generated_synergy', 'generated_risk']) {
      detail.meta_relationships[groupName] = detail.meta_relationships[groupName].map((item) => {
        const match = byId.get(Number(item.id));
        return match ? { ...item, icon: item.icon || match.avatar_url } : item;
      });
    }

    writeJson(detailFile, detail);
  }

  index.sort((a, b) => Number(a.id) - Number(b.id));
  writeJson(indexFile, index);
  writeJson(matrixFile, matrix);

  const searchIndex = index.map((hero) => ({
    id: hero.id,
    name: hero.name,
    role: hero.role,
    normalized_name: normalizeName(hero.name),
    aliases: [slugify(hero.name)],
    keywords: `${normalizeName(hero.name)} ${normalizeName(hero.role)} ${normalizeName(hero.lane)} ${normalizeName(hero.tier)}`
  }));
  writeJson(path.join(langDir, 'search_index.json'), searchIndex);

  return index.length;
}

function copyIfExists(from, to) {
  if (fs.existsSync(from) && !fs.existsSync(to)) {
    fs.copyFileSync(from, to);
  }
}

function main() {
  const meta = readJson(PATCH_META);
  const version = meta.current_patch || '1.8.84';
  const stats = parseStatsSnapshot();
  writeJson(path.join(ROOT, 'src', 'data', 'hero_meta_stats.json'), stats);
  writeJson(path.join(ROOT, 'scratch', 'mlbbhub_stats.json'), stats);

  const patchesDir = path.join(ROOT, 'public', 'data', 'patches', version);
  const languages = fs.readdirSync(patchesDir).filter((entry) => fs.statSync(path.join(patchesDir, entry)).isDirectory());
  let totalHeroes = 0;
  for (const lang of languages) {
    const count = enrichLanguage(version, lang, stats);
    if (lang === 'en') totalHeroes = count;
  }

  copyIfExists(path.join(ROOT, 'public', 'assets', 'misc', 'Blade_of_Heptaseas.webp'), path.join(ROOT, 'public', 'assets', 'items', 'Blade_of_Heptaseas.webp'));
  copyIfExists(path.join(ROOT, 'public', 'assets', 'misc', 'Talent_Swift.webp'), path.join(ROOT, 'public', 'assets', 'talents', 'Talent_Swift.webp'));
  copyIfExists(path.join(ROOT, 'public', 'assets', 'misc', 'Talent_Master_Assassin.webp'), path.join(ROOT, 'public', 'assets', 'talents', 'Talent_Master_Assassin.webp'));
  copyIfExists(path.join(ROOT, 'public', 'assets', 'misc', 'Talent_Impure_Rage.webp'), path.join(ROOT, 'public', 'assets', 'talents', 'Talent_Impure_Rage.webp'));
  copyIfExists(path.join(ROOT, 'public', 'assets', 'misc', 'Talent_Festival_of_Blood.webp'), path.join(ROOT, 'public', 'assets', 'talents', 'Talent_Festival_of_Blood.webp'));
  copyIfExists(path.join(ROOT, 'public', 'assets', 'misc', 'Talent_Focusing_Mark.webp'), path.join(ROOT, 'public', 'assets', 'talents', 'Talent_Focusing_Mark.webp'));

  meta.total_heroes = totalHeroes || meta.total_heroes;
  meta.current_patch = version;
  meta.stats_patch = '2.1.70';
  meta.last_updated_time = new Date().toISOString();
  meta.stats_source = 'MLBBHub statistics page, May 2026 snapshot referencing mobilelegends.com aggregated ranked data';
  writeJson(PATCH_META, meta);

  console.log(`Enriched ${totalHeroes} heroes with ${stats.length} stat rows for patch ${version}.`);
}

main();
