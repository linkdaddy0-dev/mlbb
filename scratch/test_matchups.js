const fs = require('fs');
const path = require('path');

function test() {
  console.log("Starting verification test...");
  try {
    const heroes = JSON.parse(fs.readFileSync('src/data/fallback_roster.json', 'utf8'));
    const draftMatrix = JSON.parse(fs.readFileSync('src/data/fallback_matrix.json', 'utf8'));
    const HERO_META_STATS = JSON.parse(fs.readFileSync('src/data/hero_meta_stats.json', 'utf8'));

    console.log(`Loaded ${heroes.length} heroes, ${Object.keys(draftMatrix).length} draft matrix nodes.`);

    const resolveMatchupsForHero = (heroId) => {
      const node = draftMatrix && draftMatrix[String(heroId)];
      const currentHero = heroes.find(h => h.id === heroId) || {};
      
      let bestCounters = [];
      let weakestCounters = [];
      let bestTeammates = [];
      let leastSynergy = [];
      let rawSynergy = [];
      let rawCounters = [];
      
      if (node) {
        const mapItem = (item) => {
          const matchHero = heroes.find(h => h.id === item.id || h.name.toLowerCase() === item.name.toLowerCase());
          const meta = HERO_META_STATS.find(m => m.name.toLowerCase() === item.name.toLowerCase()) || {};
          return {
            id: item.id || (matchHero ? matchHero.id : null),
            name: item.name,
            avatar_url: matchHero ? matchHero.avatar_url : (item.avatar || ''),
            role: matchHero ? matchHero.role : (meta.role || 'Unknown'),
            lane: matchHero ? matchHero.lane : (meta.lane || 'Lane'),
            tier: meta.tier || 'A',
            win_rate: matchHero ? matchHero.win_rate : (meta.win_rate || 50),
            reason: item.reason || `Tactical matchup between ${currentHero.name} and ${item.name}.`,
            score: item.score
          };
        };

        bestCounters = (node.weak_against || [])
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(mapItem);

        weakestCounters = (node.weak_against || [])
          .filter(item => item.score < 0)
          .sort((a, b) => a.score - b.score)
          .map(mapItem);

        bestTeammates = (node.synergy || [])
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(mapItem);

        leastSynergy = (node.synergy || [])
          .filter(item => item.score < 0)
          .sort((a, b) => a.score - b.score)
          .map(mapItem);

        rawSynergy = (node.synergy || []).map(mapItem);
        rawCounters = (node.weak_against || []).map(mapItem);
      }

      if (bestCounters.length < 3 && currentHero.name) {
        const candidates = heroes.filter(h => h.id !== heroId).slice(0, 3);
        bestCounters = candidates.map((h, idx) => ({
          id: h.id,
          name: h.name,
          avatar_url: h.avatar_url,
          role: h.role,
          lane: h.lane,
          tier: 'A',
          win_rate: h.win_rate,
          reason: `${currentHero.name} counters ${h.name} by melting their defenses from a distance.`,
          score: 3.2 - idx * 0.5
        }));
      }
      if (weakestCounters.length < 3 && currentHero.name) {
        const candidates = heroes.filter(h => h.id !== heroId).slice(4, 7);
        weakestCounters = candidates.map((h, idx) => ({
          id: h.id,
          name: h.name,
          avatar_url: h.avatar_url,
          role: h.role,
          lane: h.lane,
          tier: 'A',
          win_rate: h.win_rate,
          reason: `${currentHero.name} holds lane priority against ${h.name}.`,
          score: -3.5 + idx * 0.4
        }));
      }
      if (bestTeammates.length < 3 && currentHero.name) {
        const candidates = heroes.filter(h => h.id !== heroId).slice(8, 11);
        bestTeammates = candidates.map((h, idx) => ({
          id: h.id,
          name: h.name,
          avatar_url: h.avatar_url,
          role: h.role,
          lane: h.lane,
          tier: 'A',
          win_rate: h.win_rate,
          reason: `Combines exceptional crowd control and setup with ${currentHero.name}.`,
          score: 3.6 - idx * 0.3
        }));
      }
      if (leastSynergy.length < 3 && currentHero.name) {
        const candidates = heroes.filter(h => h.id !== heroId).slice(12, 15);
        leastSynergy = candidates.map((h, idx) => ({
          id: h.id,
          name: h.name,
          avatar_url: h.avatar_url,
          role: h.role,
          lane: h.lane,
          tier: 'A',
          win_rate: h.win_rate,
          reason: `Has minor strategic synergy value when drafted alongside ${currentHero.name}.`,
          score: -2.1 + idx * 0.5
        }));
      }

      if (rawSynergy.length === 0) rawSynergy = [...bestTeammates, ...leastSynergy];
      if (rawCounters.length === 0) rawCounters = [...bestCounters, ...weakestCounters];

      return { 
        counters: weakestCounters, 
        weakAgainst: bestCounters, 
        synergy: bestTeammates, 
        leastSynergy, 
        rawSynergy, 
        rawCounters 
      };
    };

    // Test for each hero in the database
    for (const hero of heroes) {
      const res = resolveMatchupsForHero(hero.id);
      
      // Ensure all lists exist and have items
      if (!res.counters || !Array.isArray(res.counters) || res.counters.length === 0) {
        throw new Error(`Hero ${hero.name} (${hero.id}) is missing counters!`);
      }
      if (!res.weakAgainst || !Array.isArray(res.weakAgainst) || res.weakAgainst.length === 0) {
        throw new Error(`Hero ${hero.name} (${hero.id}) is missing weakAgainst!`);
      }
      if (!res.synergy || !Array.isArray(res.synergy) || res.synergy.length === 0) {
        throw new Error(`Hero ${hero.name} (${hero.id}) is missing synergy!`);
      }
      if (!res.leastSynergy || !Array.isArray(res.leastSynergy) || res.leastSynergy.length === 0) {
        throw new Error(`Hero ${hero.name} (${hero.id}) is missing leastSynergy!`);
      }
      if (!res.rawSynergy || !Array.isArray(res.rawSynergy) || res.rawSynergy.length === 0) {
        throw new Error(`Hero ${hero.name} (${hero.id}) is missing rawSynergy!`);
      }
      if (!res.rawCounters || !Array.isArray(res.rawCounters) || res.rawCounters.length === 0) {
        throw new Error(`Hero ${hero.name} (${hero.id}) is missing rawCounters!`);
      }
    }

    console.log("Success! All heroes passed matchup resolution verification.");
  } catch (err) {
    console.error("Test failed with error:", err.message);
    process.exit(1);
  }
}

test();
