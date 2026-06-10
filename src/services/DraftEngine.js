/**
 * MLBB Draft Assistant V3.1 - Standalone Intelligent Recommendation Engine
 * Driven purely by high-fidelity Moonton GMS data (The Primary Source of Truth)
 */

export default class DraftEngine {
  constructor(heroes, draftMatrix, config = {}) {
    this.heroes = heroes || [];
    this.draftMatrix = draftMatrix || {};
    
    // Index heroes by ID and Name for ultra-fast lookup
    this.heroMap = new Map();
    this.heroNameMap = new Map();
    this.heroes.forEach(h => {
      this.heroMap.set(Number(h.id), h);
      this.heroMap.set(String(h.id), h);
      this.heroNameMap.set(h.name.toLowerCase(), h);
    });

    // Configurable default weights (V3.1 Specifications)
    this.config = {
      counterWeight: 0.40,
      synergyWeight: 0.30,
      compWeight: 0.20,
      roleWeight: 0.10,
      CounterMultiplier: 25,
      PenaltyMultiplier: 20,
      ...config
    };
    
    // Precompute attribute cache to ensure sub-100ms instant updates
    this.attributeCache = new Map();
    this.precomputeAttributes();
  }

  /**
   * Precompute hero specialties, stats, and classes into 11 discrete composition attributes.
   * Driven directly from the official GMS data dynamically.
   */
  precomputeAttributes() {
    this.heroes.forEach(hero => {
      const spec = (hero.speciality || []).map(s => s.toLowerCase());
      const role = (hero.role || "").toLowerCase();
      const lane = (hero.lane || "").toLowerCase();
      
      const mag = Number(hero.magic || hero.mag || 0);
      const phy = Number(hero.offense || hero.phy || 0);
      const alive = Number(hero.durability || hero.alive || 0);
      const diff = Number(hero.difficulty || hero.diff || 0);

      const attrs = {
        frontline: role.includes("tank") || (role.includes("fighter") && alive >= 60) || alive >= 75,
        crowdControl: spec.some(s => s.includes("control") || s.includes("stun") || s.includes("slow")) || (role.includes("mage") && mag >= 75) || (role.includes("tank") && mag >= 60),
        initiation: spec.some(s => s.includes("initiator") || s.includes("charge") || s.includes("engage")) || role.includes("tank") || lane.includes("roam"),
        physicalDamage: role.includes("marksman") || role.includes("assassin") || (role.includes("fighter") && phy >= 65),
        magicDamage: role.includes("mage") || mag >= 75,
        sustain: spec.some(s => s.includes("sustain") || s.includes("regen") || s.includes("guard")) || role.includes("support") || role.includes("tank"),
        burst: spec.some(s => s.includes("burst") || s.includes("reap")) || phy >= 80 || mag >= 80,
        waveClear: spec.some(s => s.includes("push") || s.includes("clear") || s.includes("burst")) || role.includes("mage") || role.includes("marksman"),
        objectiveControl: (alive >= 50 && phy >= 50) || role.includes("assassin") || role.includes("fighter") || lane.includes("jungle"),
        lateGameScaling: role.includes("marksman") || role.includes("mage") || diff >= 70,
        mobility: spec.some(s => s.includes("mobility") || s.includes("charge") || s.includes("speed")) || role.includes("assassin") || lane.includes("jungle")
      };
      
      this.attributeCache.set(hero.id, attrs);
    });
  }

  /**
   * Dynamic Team Composition Analyzer.
   * Tracks lack/abundance of 11 attributes to determine missing roles.
   */
  analyzeComposition(draftedHeroes) {
    const teamStats = {
      frontline: 0, crowdControl: 0, initiation: 0, physicalDamage: 0,
      magicDamage: 0, sustain: 0, burst: 0, waveClear: 0,
      objectiveControl: 0, lateGameScaling: 0, mobility: 0
    };

    draftedHeroes.forEach(hero => {
      const attrs = this.attributeCache.get(hero.id);
      if (attrs) {
        Object.keys(teamStats).forEach(attr => {
          if (attrs[attr]) teamStats[attr]++;
        });
      }
    });

    // Determine Lack: if the allied team total for an attribute is less than 1.5, it's considered lacking
    const lacking = {};
    Object.keys(teamStats).forEach(attr => {
      lacking[attr] = teamStats[attr] < 1.5;
    });

    return { teamStats, lacking };
  }

  /**
   * Primary recommendation generator and scorer.
   * Returns a complete list of scored heroes sorted descending by Draft Score.
   */
  getRecommendations(allyDraft, enemyDraft, roleFilter = "Any") {
    const draftedAllies = allyDraft.filter(h => h !== null);
    const draftedEnemies = enemyDraft.filter(h => h !== null);
    const allDraftedIds = new Set([
      ...draftedAllies.map(h => h.id),
      ...draftedEnemies.map(h => h.id)
    ]);

    // 1. Analyze allied composition
    const allyComp = this.analyzeComposition(draftedAllies);

    // 2. Lanes already filled by allies
    const allyLanes = new Set(
      draftedAllies
        .map(h => h.lane ? h.lane.toLowerCase() : "")
        .filter(l => l !== "")
    );

    const candidates = [];

    this.heroes.forEach(candidate => {
      // Exclude already picked heroes
      if (allDraftedIds.has(candidate.id)) return;

      const candidateId = candidate.id;
      const role = (candidate.role || "").toLowerCase();
      const lane = (candidate.lane || "").toLowerCase();

      // Lane-specific tab filtering
      if (roleFilter !== "Any" && roleFilter !== "Any Role" && roleFilter !== "overall") {
        const filterLower = roleFilter.toLowerCase();
        if (filterLower === "roam" || filterLower === "roamlane") {
          if (!lane.includes("roam") && !role.includes("support") && !role.includes("tank")) return;
        } else if (filterLower === "jungle" || filterLower === "junglelane") {
          if (!lane.includes("jungle") && !role.includes("assassin")) return;
        } else if (filterLower === "mid" || filterLower === "midlane") {
          if (!lane.includes("mid") && !role.includes("mage")) return;
        } else if (filterLower === "gold" || filterLower === "goldlane") {
          if (!lane.includes("gold") && !role.includes("marksman")) return;
        } else if (filterLower === "exp" || filterLower === "explane") {
          if (!lane.includes("exp") && (!lane.includes("xp") || role.includes("fighter")) && !role.includes("fighter") && !role.includes("tank")) return;
        }
      }

      // Candidate attributes
      const attrs = this.attributeCache.get(candidateId) || {};

      // SCORING ENGINE (V3.1):
      let counterBonusSum = 0;
      let counterPenaltySum = 0;
      let riskSum = 0;
      let counterMatches = 0;
      let hasHardCounter = false;
      let hardCounterEnemyName = "";
      let hardCounterValue = 0;

      const affectedEnemies = [];
      const riskEnemies = [];

      // A. AGGREGATED COUNTER EVALUATION (Across the entire enemy team)
      draftedEnemies.forEach(enemy => {
        let matchupValue = 0;

        // Lookup in draftMatrix
        const enemyNode = this.draftMatrix[String(enemy.id)];
        if (enemyNode) {
          const strongItem = enemyNode.strong_against?.find(x => Number(x.id) === Number(candidateId));
          if (strongItem) matchupValue = -strongItem.score; // Counter (score was abs-valued in strong_against, so we invert it back)

          const weakItem = enemyNode.weak_against?.find(x => Number(x.id) === Number(candidateId));
          if (weakItem && weakItem.score > 0) matchupValue = weakItem.score; // Vulnerable (score is positive)
        }

        // Fallback to ranking position only if values are unavailable/0
        if (matchupValue === 0 && enemy.meta_relationships?.best_counters) {
          const idx = enemy.meta_relationships.best_counters.findIndex(x => Number(x.id) === Number(candidateId));
          if (idx !== -1 && idx < 6) {
            matchupValue = -(3.5 - idx * 0.4);
          }
        }
        if (matchupValue === 0 && enemy.meta_relationships?.most_countered_by) {
          const idx = enemy.meta_relationships.most_countered_by.findIndex(x => Number(x.id) === Number(candidateId));
          if (idx !== -1 && idx < 6) {
            matchupValue = 3.0 - idx * 0.4;
          }
        }

        // Process score contribution (V3.1 Rules: negative = reward, positive = penalty)
        if (matchupValue < 0) {
          const absVal = Math.abs(matchupValue);
          counterBonusSum += absVal * this.config.CounterMultiplier;
          counterMatches++;
          affectedEnemies.push({ name: enemy.name, value: matchupValue });

          // Hard Counter detection (matchup value <= -3.0)
          if (matchupValue <= -3.0) {
            hasHardCounter = true;
            hardCounterEnemyName = enemy.name;
            hardCounterValue = matchupValue;
          }
        } else if (matchupValue > 0) {
          counterPenaltySum += matchupValue * this.config.PenaltyMultiplier;
          riskSum += matchupValue * 25; // risk factor for denominator
          riskEnemies.push({ name: enemy.name, value: matchupValue });
        }
      });

      // Aggregate Net Counter Score
      let counterScore = counterBonusSum - counterPenaltySum;
      let enemyCounterRisk = riskSum;

      // B. AGGREGATED ALLY SYNERGY SCORE (Teammates & Anti-synergies)
      let synergyBonus = 0;
      let synergyPenalty = 0;
      let synergyMatches = 0;
      const synergyAllies = [];

      draftedAllies.forEach(ally => {
        let synergyValue = 0;

        const allyNode = this.draftMatrix[String(ally.id)];
        if (allyNode && allyNode.synergy) {
          const synItem = allyNode.synergy.find(x => Number(x.id) === Number(candidateId));
          if (synItem) synergyValue = synItem.score;
        }

        const candidateNode = this.draftMatrix[String(candidateId)];
        if (candidateNode && candidateNode.synergy) {
          const synItem = candidateNode.synergy.find(x => Number(x.id) === Number(ally.id));
          if (synItem) synergyValue = Math.max(synergyValue, synItem.score);
        }

        if (synergyValue === 0 && ally.meta_relationships?.compatibility) {
          const idx = ally.meta_relationships.compatibility.findIndex(x => Number(x.id) === Number(candidateId));
          if (idx !== -1 && idx < 6) {
            synergyValue = 3.5 - idx * 0.4;
          }
        }

        if (synergyValue > 0) {
          synergyBonus += synergyValue * 25;
          synergyMatches++;
          synergyAllies.push({ name: ally.name, value: synergyValue });
        } else if (synergyValue < 0) {
          synergyPenalty += Math.abs(synergyValue) * 20;
        }
      });

      let synergyScore = synergyBonus - synergyPenalty;

      // C. TEAM COMPOSITION & MISSING ROLE ANALYSIS
      let compScore = 100;
      let lackingSatisfiedCount = 0;
      let totalLackingCount = 0;

      Object.keys(allyComp.lacking).forEach(attr => {
        if (allyComp.lacking[attr]) {
          totalLackingCount++;
          if (attrs[attr]) lackingSatisfiedCount++;
        }
      });

      if (totalLackingCount > 0) {
        compScore = Math.round((lackingSatisfiedCount / totalLackingCount) * 100);
      } else {
        compScore = 100;
      }

      // Composition Bonus / Missing Role Bonus
      const compositionBonus = lackingSatisfiedCount * 15;
      
      let isLaneFilled = false;
      const candidateLane = candidate.lane ? candidate.lane.toLowerCase() : "";
      allyLanes.forEach(al => {
        if (candidateLane.includes(al) || al.includes(candidateLane)) {
          isLaneFilled = true;
        }
      });

      let roleFitScore = 100;
      let missingRoleBonus = 0;
      let duplicateRolePenalty = 0;

      if (isLaneFilled) {
        roleFitScore = 0;
        duplicateRolePenalty = 30;
      } else if (draftedAllies.length > 0) {
        roleFitScore = 100;
        missingRoleBonus = 15; // Role Bonus: +15
      }

      // Frontline Lack squishy penalty
      const isDamageDealer = role.includes('marksman') || role.includes('mage') || role.includes('assassin');
      if (allyComp.lacking.frontline && isDamageDealer) {
        roleFitScore = Math.max(0, roleFitScore - 50);
        duplicateRolePenalty += 40;
      }

      const roleBalanceScore = 100 - duplicateRolePenalty;

      // D. TEAM COMPATIBILITY SCORE
      // Team Compatibility Score = Synergy Score + Role Balance Score + Missing Role Bonus + Composition Bonus - Duplicate Role Penalty
      const teamCompatibilityScore = synergyScore + roleBalanceScore + missingRoleBonus + compositionBonus - duplicateRolePenalty;

      // E. COMBO BONUS SYSTEM
      let isCombo = false;
      let comboAllyName = "";
      let comboEnemyName = "";

      if (draftedAllies.length > 0 && draftedEnemies.length > 0) {
        const strongCounter = affectedEnemies.find(x => x.value <= -1.5);
        const strongSyn = synergyAllies.find(x => x.value >= 1.5);
        if (strongCounter && strongSyn) {
          isCombo = true;
          comboAllyName = strongSyn.name;
          comboEnemyName = strongCounter.name;
        }
      }
      const comboBonus = isCombo ? 35.0 : 0.0;

      // F. CALCULATE FINAL DRAFT SCORE WITH RISK DENOMINATOR
      // V3.1 Score Formula: Draft Score = ( (Counter Score * 0.40) + (Synergy Score * 0.30) + (Composition Score * 0.20) + (Role Need Score * 0.10) + Combo Bonus ) / (1 + Enemy Counter Risk / 100)
      const numerator = (
        (counterScore * 0.40) +
        (synergyScore * 0.30) +
        (compScore * 0.20) +
        (roleFitScore * 0.10) +
        comboBonus
      );

      const denominator = 1.0 + (enemyCounterRisk / 100.0);
      const rawDraftScore = numerator / denominator;

      // Normalize Draft Score cleanly into user-friendly 30 to 99 range for esports aesthetics
      let finalDraftScore = Math.round(rawDraftScore);
      if (draftedEnemies.length > 0 || draftedAllies.length > 0) {
        // Boost scaling so that top GMS picks align beautifully in 30-99 range
        finalDraftScore = Math.round(65 + (rawDraftScore * 0.22));
      }
      finalDraftScore = Math.min(99, Math.max(30, finalDraftScore));

      // G. GENERATE DYNAMIC REASONING TAGS & TRANSPARENCY EXPLANATIONS
      const reasoningTags = [];
      const debugExplanations = [];

      if (hasHardCounter) {
        reasoningTags.push(`🎯 HARD COUNTER`);
        debugExplanations.push(`🎯 HARD COUNTER vs ${hardCounterEnemyName} (${hardCounterValue.toFixed(2)} matchup value)`);
      } else if (isCombo) {
        reasoningTags.push(`🔥 COMBO: Ally ${comboAllyName} + Counters ${comboEnemyName}`);
        debugExplanations.push(`Combo Bonus: +35 applied`);
      }

      affectedEnemies.forEach(e => {
        reasoningTags.push(`✓ Counters ${e.name} (${e.value.toFixed(2)})`);
        debugExplanations.push(`+${Math.round(Math.abs(e.value) * 25 * 0.4)} Countered ${e.name} (${e.value.toFixed(2)} value)`);
      });

      synergyAllies.forEach(a => {
        reasoningTags.push(`✓ Complements ${a.name}`);
        debugExplanations.push(`+${Math.round(a.value * 25 * 0.3)} Strong synergy with ${a.name} (+${a.value.toFixed(2)})`);
      });

      if (allyComp.lacking.frontline) {
        if (attrs.frontline) {
          reasoningTags.push(`✓ Strong frontline`);
          debugExplanations.push(`+${Math.round(compScore * 0.2)} Satisfies Frontline requirement`);
        } else if (isDamageDealer) {
          reasoningTags.push(`⚠️ Avoid: Missing frontline`);
        }
      }

      if (!isLaneFilled && draftedAllies.length > 0) {
        reasoningTags.push(`✓ Fills Roam/Lane role`);
        debugExplanations.push(`+${Math.round(roleFitScore * 0.1)} Fills ${candidate.lane} Requirement`);
      }

      riskEnemies.forEach(e => {
        reasoningTags.push(`⚠️ Vulnerable to ${e.name}`);
        debugExplanations.push(`-${Math.round(e.value * 20 * 0.4)} Countered by ${e.name} (+${e.value.toFixed(2)})`);
      });

      if (enemyCounterRisk > 0) {
        debugExplanations.push(`Enemy Counter Risk Denominator: /${denominator.toFixed(2)} (${enemyCounterRisk.toFixed(0)} risk)`);
      }

      if (reasoningTags.length === 0) {
        reasoningTags.push(`✓ Balanced utility pick`);
      }

      candidates.push({
        hero: candidate,
        draftScore: finalDraftScore,
        counterScore: Math.round(Math.min(100, counterScore)),
        synergyScore: Math.round(Math.min(100, Math.max(0, synergyScore))),
        compScore,
        roleFitScore,
        antiSynergyPenalty: Math.round(synergyPenalty),
        enemyCounterRisk: Math.round(enemyCounterRisk),
        reasoningTags: reasoningTags.slice(0, 5),
        debugExplanations: debugExplanations.slice(0, 6)
      });
    });

    // Sort candidates descending by Draft Score
    candidates.sort((a, b) => b.draftScore - a.draftScore);
    return candidates;
  }
}
