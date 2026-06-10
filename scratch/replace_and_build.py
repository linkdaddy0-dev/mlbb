import os
import subprocess

app_path = r"c:\Users\rosha\Documents\MLBB\src\App.jsx"
backup_path = r"c:\Users\rosha\Documents\MLBB\src\App.jsx.orig_backup"

# Create a backup of App.jsx if it doesn't exist yet
if not os.path.exists(backup_path):
    with open(app_path, 'r', encoding='utf-8') as f:
        orig_content = f.read()
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(orig_content)
    print("Created original backup of App.jsx")

# Read current App.jsx lines
with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Read {len(lines)} lines from App.jsx")

# Define the replacement text for lines 7086 to 8319 (1-indexed, so 7085 to 8318 in 0-indexed)
replacement_content = """      {selectedHero && (
        <div className="modal-backdrop" onClick={closeHeroDetails}>
          <div className="modal-content premium-gaming-modal" onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Absolute Background Hero Art */}
            <img 
              className="modal-fixed-hero-art"
              src={`/assets/banners/hero_${selectedHero.id}_transparent.webp`} 
              alt=""
            />

            {/* Float Action Header for Modal */}
            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10 }}>
              <button 
                onClick={closeHeroDetails}
                style={{ 
                  border: 'none', 
                  background: 'rgba(255,255,255,0.08)', 
                  color: 'white', 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer' 
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Content Container (Scrollable) */}
            <div className="modal-scrollable-body" style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* IIFE wrapper for calculating variables and rendering tabs */}
              {(() => {
                const g = selectedHero.tier || detailHeroData?.tier || "A";
                const x = selectedHero.role || detailHeroData?.role || "Fighter";
                const D = selectedHero.lane || detailHeroData?.lane || "EXP Lane";
                const O = selectedHero.win_rate || detailHeroData?.win_rate || 50;
                const C = selectedHero.pick_rate || detailHeroData?.pick_rate || 1;
                const re = selectedHero.ban_rate || detailHeroData?.ban_rate || 0;
                const ue = detailHeroData?.difficulty || 40;
                const ne = Math.max(1, Math.min(5, Math.round(ue / 20)));

                const renderStars = (stars, maxStars = 5) => (
                  <span style={{ color: 'var(--accent-gold)', letterSpacing: '0.05rem', fontSize: '0.72rem' }}>
                    {"★".repeat(stars)}{"☆".repeat(maxStars - stars)}
                  </span>
                );

                const renderPowerBar = (val) => {
                  return "█".repeat(val) + "░".repeat(10 - val);
                };

                const verdict = (() => {
                  let W = `${g} Tier ${D} ${x}`,
                      K = "Versatile tactical choice for draft adjustments.",
                      Q = "Balanced Draft Utility";
                  const ke = x.toLowerCase();
                  if (ke.includes("assassin")) K = "Strong Early Game Snowball Hero";
                  else if (ke.includes("marksman")) K = "Late Game Sustained Damage Carry";
                  else if (ke.includes("mage")) K = "High Burst & Area Control Utility";
                  else if (ke.includes("tank")) K = "Reliable Teamfight Initiator & Frontline";
                  else if (ke.includes("support")) K = "High Utility Buff & Heal Partner";
                  else if (ke.includes("fighter")) K = "Versatile Sustained Duelist & EXP Lane Contender";
                  
                  if (re >= 20 || g === "S") Q = "High Priority Draft Pick";
                  else if (re < 5) Q = "Low Ban Priority";
                  else Q = "Flexible Roster Option";
                  
                  return { line1: W, line2: K, line3: Q };
                })();

                const laneInfo = (W => {
                  if (!W) return { best: "EXP Lane", secondary: [] };
                  const K = W.lane || "Flex",
                        Q = (W.role || "").toLowerCase();
                  let ke = K,
                      _e = [];
                  if (Q.includes("assassin")) {
                    ke = "Jungle";
                    _e = [{ lane: "EXP Lane", stars: 3 }, { lane: "Gold Lane", stars: 2 }];
                  } else if (Q.includes("marksman")) {
                    ke = "Gold Lane";
                    _e = [{ lane: "Jungle", stars: 3 }, { lane: "Mid Lane", stars: 2 }];
                  } else if (Q.includes("mage")) {
                    ke = "Mid Lane";
                    _e = [{ lane: "Roam Lane", stars: 3 }, { lane: "Gold Lane", stars: 2 }];
                  } else if (Q.includes("tank")) {
                    ke = "Roam Lane";
                    _e = [{ lane: "EXP Lane", stars: 3 }, { lane: "Jungle", stars: 2 }];
                  } else if (Q.includes("support")) {
                    ke = "Roam Lane";
                    _e = [{ lane: "Mid Lane", stars: 3 }, { lane: "EXP Lane", stars: 2 }];
                  } else {
                    ke = K.includes("Jungle") ? "Jungle" : "EXP Lane";
                    _e = K.includes("Jungle") ? [{ lane: "EXP Lane", stars: 4 }] : [{ lane: "Jungle", stars: 3 }, { lane: "Roam Lane", stars: 2 }];
                  }
                  return { best: ke, secondary: _e };
                })(selectedHero);

                const oData = ((W, K, Q) => {
                  const ke = String(W).toLowerCase();
                  let _e = { early: 3, mid: 3, late: 3, strongest: "Mid Game" },
                      yt = ["Versatile", "Meta Adjuster"],
                      De = ["Standard Draft"],
                      Ot = { burst: 5, sustain: 5, mobility: 5, cc: 5, scaling: 5, teamfight: 5 },
                      ot = { mechanical: 3, positioning: 3, macro: 3, combo: 3 },
                      Pt = "Mid Pick";
                  const nr = Math.max(1, Math.min(5, Math.round(K / 20)));
                  
                  if (ke.includes("assassin")) {
                    _e = { early: 5, mid: 4, late: 2, strongest: "Early Game" };
                    yt = ["High Mobility", "Burst Damage", "Single Target Pick", "Jungler Priority"];
                    De = ["Fragile Health", "Vulnerable to CC", "Mana Hungry", "Hard Execution"];
                    Ot = { burst: 9, sustain: 4, mobility: 10, cc: 3, scaling: 7, teamfight: 5 };
                    ot = { mechanical: 5, positioning: 4, macro: 3, combo: 5 };
                    Pt = "Last Pick";
                  } else if (ke.includes("marksman")) {
                    _e = { early: 2, mid: 3, late: 5, strongest: "Late Game" };
                    yt = ["Late Game DPS", "Range Advantage", "Objective Control", "High Scaling"];
                    De = ["Weak Early Game", "Lacks Mobility", "Item Dependent", "Fragile Health"];
                    Ot = { burst: 7, sustain: 5, mobility: 6, cc: 3, scaling: 10, teamfight: 7 };
                    ot = { mechanical: 3, positioning: 5, macro: 4, combo: 3 };
                    Pt = "Last Pick";
                  } else if (ke.includes("mage")) {
                    _e = { early: 3, mid: 5, late: 4, strongest: "Mid Game" };
                    yt = ["Area of Effect", "Crowd Control", "High Burst", "Lane Clearing"];
                    De = ["Low Mobility", "Cooldown Dependent", "Fragile Health", "Skill Shot Reliant"];
                    Ot = { burst: 9, sustain: 3, mobility: 5, cc: 8, scaling: 8, teamfight: 8 };
                    ot = { mechanical: 3, positioning: 4, macro: 4, combo: 4 };
                    Pt = "Mid Pick";
                  } else if (ke.includes("tank")) {
                    _e = { early: 4, mid: 5, late: 3, strongest: "Mid Game" };
                    yt = ["High Durability", "Teamfight Initiator", "Crowd Control", "Frontline Shield"];
                    De = ["Low Damage Output", "Low Mobility", "Item-Dependent Armor", "Kiteable"];
                    Ot = { burst: 3, sustain: 9, mobility: 5, cc: 10, scaling: 6, teamfight: 9 };
                    ot = { mechanical: 3, positioning: 4, macro: 5, combo: 4 };
                    Pt = "First Pick";
                  } else if (ke.includes("support")) {
                    _e = { early: 4, mid: 4, late: 3, strongest: "Mid Game" };
                    yt = ["Healing/Shields", "Tactical Utility", "Team Buffs", "Early Roam"];
                    De = ["Fragile Health", "Low Damage Output", "Team-Dependent Impact", "High Cooldowns"];
                    Ot = { burst: 4, sustain: 8, mobility: 6, cc: 7, scaling: 7, teamfight: 8 };
                    ot = { mechanical: 2, positioning: 4, macro: 5, combo: 3 };
                    Pt = "First Pick";
                  } else {
                    _e = { early: 4, mid: 5, late: 4, strongest: "Mid Game" };
                    yt = ["Duelist Capacity", "Sustained Damage", "Solo Lane Control", "Off-tank Utility"];
                    De = ["Kiteable", "Vulnerable to Burst", "Mid-range Combat", "Cooldown Dependent"];
                    Ot = { burst: 7, sustain: 8, mobility: 7, cc: 5, scaling: 8, teamfight: 7 };
                    ot = { mechanical: 4, positioning: 4, macro: 4, combo: 4 };
                    Pt = "Mid Pick";
                  }
                  
                  const Ps = nr / 4;
                  Object.keys(ot).forEach(Ir => {
                    ot[Ir] = Math.max(1, Math.min(5, Math.round(ot[Ir] * Ps)));
                  });
                  
                  let Qr = "Low";
                  if (Q >= 20) Qr = "High";
                  else if (Q >= 5) Qr = "Medium";
                  
                  return { spikes: _e, strengths: yt, weaknesses: De, combat: Ot, diffBreakdown: ot, bestPick: Pt, banPriority: Qr };
                })(x, ue, re);

                const draftRecommendation = ((W, K) => {
                  if (!W) return { text: "ADAPTIVE DRAFT CHOICE", desc: "Select based on team composition.", color: "var(--text-secondary)", bg: "rgba(0,0,0,0.02)" };
                  const Q = W.tier || K && K.tier || "A",
                        ke = W.ban_rate || 0,
                        _e = (W.role || "").toLowerCase();
                  if (ke >= 20) return { text: "HIGH BAN PRIORITY", desc: "This hero has a high ban rate in the current meta. Ban or secure in first pick phase.", color: "var(--accent-red)", bg: "rgba(239, 68, 68, 0.08)" };
                  if (Q === "S") {
                    if (_e.includes("tank") || _e.includes("support")) {
                      return { text: "SAFE FIRST PICK", desc: "High flexibility and low vulnerability. Safe to blind pick in early draft phases.", color: "var(--accent-green)", bg: "rgba(16, 185, 129, 0.08)" };
                    } else {
                      return { text: "AVOID EARLY PICK", desc: "Strong meta pick, but vulnerable to direct counter-drafting. Hold for later pick slot.", color: "var(--accent-gold)", bg: "rgba(245, 158, 11, 0.08)" };
                    }
                  }
                  return { text: "BEST USED AS COUNTER PICK", desc: "Highly effective when drafted against weak lanes or specific counter matchups.", color: "var(--accent-blue)", bg: "rgba(37, 99, 235, 0.08)" };
                })(selectedHero, detailHeroData);

                const getWhyPickList = (W) => {
                  if (!W) return ["High Versatility", "Strong Meta Choice", "Solid Picking Profile"];
                  const K = (W.role || "").toLowerCase();
                  if (K.includes("assassin")) return ["Excellent Backline Access", "High Mobility", "Strong Snowball Potential", "Quick Pick-off Tool"];
                  if (K.includes("marksman")) return ["High Late Game DPS Scaling", "Strong Objective Take Capacity", "Consistent Ranged DPS", "High Carry Potential"];
                  if (K.includes("mage")) return ["High Area Magic Damage", "Powerful Crowd Control Setups", "Fast Lane Clearance", "Strong Mid-game Rotation"];
                  if (K.includes("tank")) return ["Reliable Teamfight Setup", "Exceptional Durability and Peel", "High Crowd Control Utility", "Frontline Vision Control"];
                  if (K.includes("support")) return ["Exceptional Ally Healing/Shields", "High Team Utility and Buffs", "Excellent Early Roam Vision", "Low Gold Requirement"];
                  return ["Strong 1v1 Laning Sustain", "Versatile Off-tank Frontlining", "Good Split-push Pressure", "Reliable CC / Damage Mix"];
                };

                return (
                  <>
                    {/* Header Splash Identity */}
                    <div className="gaming-title-section">
                      <h2 className="gaming-hero-name">{selectedHero.name}</h2>
                      <div className="gaming-badges-row">
                        <span className="gaming-badge-pill">{selectedHero.role}</span>
                        <span className="gaming-badge-pill">{selectedHero.lane || 'EXP Lane'}</span>
                      </div>
                      <p className="gaming-hero-desc">{getHeroLore(selectedHero)}</p>
                    </div>

                    {/* Stats / In-Use Statistics Section */}
                    <div className="gaming-stats-section">
                      <h4 className="gaming-stats-title">In-Use Statistics</h4>
                      
                      <div className="gaming-stat-row">
                        <div className="gaming-stat-label-row">
                          <span className="gaming-stat-label">Durability</span>
                          <span className="gaming-stat-label">{selectedHero.durability}%</span>
                        </div>
                        <div className="gaming-stat-track">
                          <div className="gaming-stat-fill" style={{ width: `${selectedHero.durability}%` }}></div>
                        </div>
                      </div>

                      <div className="gaming-stat-row">
                        <div className="gaming-stat-label-row">
                          <span className="gaming-stat-label">Offense</span>
                          <span className="gaming-stat-label">{selectedHero.offense}%</span>
                        </div>
                        <div className="gaming-stat-track">
                          <div className="gaming-stat-fill" style={{ width: `${selectedHero.offense}%` }}></div>
                        </div>
                      </div>

                      <div className="gaming-stat-row">
                        <div className="gaming-stat-label-row">
                          <span className="gaming-stat-label">Control Effect</span>
                          <span className="gaming-stat-label">{selectedHero.magic || 50}%</span>
                        </div>
                        <div className="gaming-stat-track">
                          <div className="gaming-stat-fill" style={{ width: `${selectedHero.magic || 50}%` }}></div>
                        </div>
                      </div>

                      <div className="gaming-stat-row">
                        <div className="gaming-stat-label-row">
                          <span className="gaming-stat-label">Difficulty</span>
                          <span className="gaming-stat-label">{selectedHero.difficulty}%</span>
                        </div>
                        <div className="gaming-stat-track">
                          <div className="gaming-stat-fill" style={{ width: `${selectedHero.difficulty}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Tabs Bar */}
                    <div className="esports-tabs-bar" style={{ borderRadius: '12px', border: '1px solid var(--border-light)', margin: '0 1.25rem 1rem 1.25rem' }}>
                      {['overview', 'builds', 'matchups', 'guide', 'stats', 'lore'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setHeroDetailTab(tab)}
                          className={`esports-tab-btn ${heroDetailTab === tab ? 'active' : ''}`}
                          style={{ minWidth: '60px', padding: '0.65rem 0.25rem' }}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Loader if details are fetching */}
                    {heroDetailsLoading && (
                      <div className="esports-pulse-skeleton" style={{ padding: '0 1.25rem 1.5rem 1.25rem' }}>
                        <div className="shimmer skeleton-item" style={{ height: "36px", width: "50%", borderRadius: "4px", background: "#cbd5e1" }}></div>
                        <div className="shimmer skeleton-item" style={{ height: "80px", width: "100%", borderRadius: "4px", background: "#cbd5e1", marginTop: "0.5rem" }}></div>
                        <div className="shimmer skeleton-item" style={{ height: "50px", width: "90%", borderRadius: "4px", background: "#cbd5e1", marginTop: "0.5rem" }}></div>
                      </div>
                    )}

                    {!heroDetailsLoading && detailHeroData && (
                      <div className="esports-tab-content-sheet" style={{ borderTop: "1px solid var(--border-light)", borderRadius: "12px" }}>
                        
                        {/* TAB 1: OVERVIEW */}
                        {heroDetailTab === 'overview' && (
                          <div className="overview-tab-sheet animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 0 1.5rem 0' }}>
                            
                            {/* Draft Recommendation */}
                            <div style={{ background: draftRecommendation.bg, border: `1.5px solid ${draftRecommendation.color}`, borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', boxShadow: 'var(--shadow-premium)' }}>
                              <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Draft Recommendation</span>
                              <strong style={{ fontSize: '0.85rem', color: draftRecommendation.color, fontWeight: 900 }}>{draftRecommendation.text}</strong>
                              <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>{draftRecommendation.desc}</p>
                            </div>

                            {/* Hero Snapshot Card */}
                            <div className="hero-snapshot-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1rem', boxShadow: 'var(--shadow-premium)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tier</span>
                                  <strong style={{ fontSize: '0.9rem', color: g === "S" ? "var(--accent-red)" : "#b45309", fontWeight: 900 }}>{g}</strong>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role</span>
                                  <strong style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{x}</strong>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gridColumn: 'span 2' }}>
                                  <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Difficulty</span>
                                  <span style={{ display: 'flex', alignItems: 'center', marginTop: '0.1rem' }}>{renderStars(ne)}</span>
                                </div>
                              </div>

                              <div style={{ fontSize: '0.65rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 800, color: 'var(--text-primary)', marginRight: '4px' }}>Best Lane: </span>
                                  <SmartImage src={`/assets/lanes/${laneInfo.best.replace(' Lane', '')}.webp`} alt={laneInfo.best} fallbackType="item" style={{ width: '15px', height: '15px', marginRight: '4px' }} />
                                  <span style={{ color: 'var(--accent-blue)', fontWeight: 800, marginRight: '8px' }}>{laneInfo.best}</span>
                                  <span style={{ display: 'flex', alignItems: 'center' }}>{renderStars(5)}</span>
                                </div>

                                {laneInfo.secondary.length > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                                    <span style={{ fontWeight: 800, color: 'var(--text-muted)', marginRight: '4px' }}>Secondary: </span>
                                    {laneInfo.secondary.map((sec, sIdx) => (
                                      <span key={sIdx} style={{ display: 'flex', alignItems: 'center', marginRight: '8px', color: 'var(--text-secondary)' }}>
                                        <SmartImage src={`/assets/lanes/${sec.lane.replace(' Lane', '')}.webp`} alt={sec.lane} fallbackType="item" style={{ width: '13px', height: '13px', marginRight: '3px' }} />
                                        <span style={{ marginRight: '4px' }}>{sec.lane}</span>
                                        <span style={{ fontSize: '0.6rem' }}>
                                          {"★".repeat(sec.stars)}{"☆".repeat(5 - sec.stars)}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                                <div>
                                  <div style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>WIN RATE</div>
                                  <strong style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 800 }}>{O.toFixed(1)}%</strong>
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>PICK RATE</div>
                                  <strong style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 800 }}>{C.toFixed(1)}%</strong>
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>BAN RATE</div>
                                  <strong style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 800 }}>{re.toFixed(1)}%</strong>
                                </div>
                              </div>
                            </div>

                            {/* Bento Grid Redesign */}
                            <div className="gaming-bento-grid" style={{ padding: 0 }}>
                              <div className="gaming-bento-left">
                                {/* Skill Sets circular list */}
                                <div className="gaming-panel-card">
                                  <h4 className="gaming-panel-title">Skills Overview</h4>
                                  <div className="circular-bubbles-row">
                                    {detailHeroData.skills && detailHeroData.skills.map((skill, idx) => (
                                      <div key={idx} className="circular-bubble-item" onClick={() => { setHeroDetailTab('guide'); setActiveSkillIndex(idx); }}>
                                        <div className="circular-bubble-icon-wrap">
                                          <div className="circular-bubble-num">{idx === 0 ? 'P' : idx}</div>
                                          <SmartImage src={skill.icon} alt={skill.name} fallbackType="skill" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <span className="circular-bubble-label">{skill.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Item sets circular list */}
                                <div className="gaming-panel-card">
                                  <h4 className="gaming-panel-title">Core Build items</h4>
                                  <div className="circular-bubbles-row">
                                    {detailHeroData.builds?.items && detailHeroData.builds.items.slice(0, 6).map((item, idx) => {
                                      const itemDetail = getProItemDetail(item);
                                      return (
                                        <div key={idx} className="circular-bubble-item" onClick={() => { setHeroDetailTab('builds'); }}>
                                          <div className="circular-bubble-icon-wrap">
                                            <SmartImage src={itemDetail.icon} alt={itemDetail.name} fallbackType="item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          </div>
                                          <span className="circular-bubble-label">{itemDetail.name}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Combo sequence */}
                                <div className="gaming-panel-card">
                                  <h4 className="gaming-panel-title">Initiator Combo</h4>
                                  {(() => {
                                    const comboData = HERO_COMBOS_DATABASE[selectedHero.id] || {
                                      heroId: selectedHero.id,
                                      name: selectedHero.name,
                                      avatar: selectedHero.avatar_url,
                                      combos: [
                                        {
                                          title: "Optimal Battle Rotation Combo",
                                          skills: [
                                            { type: "Skill 1" },
                                            { type: "Spell" },
                                            { type: "Skill 2" },
                                            { type: "Ult" }
                                          ],
                                          description: "Initiate execution sequence."
                                        }
                                      ]
                                    };
                                    const combo = comboData.combos[0];
                                    return (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                        <div className="combo-sequence-line">
                                          {combo.skills.map((cSkill, sIdx) => (
                                            <React.Fragment key={sIdx}>
                                              {sIdx > 0 && <span className="combo-step-arrow">&gt;</span>}
                                              <div className="combo-step-bubble">
                                                {cSkill.type === 'Ult' ? 'Ult' : cSkill.type === 'Spell' ? 'Spell' : cSkill.type.replace('Skill ', 'S')}
                                              </div>
                                            </React.Fragment>
                                          ))}
                                        </div>
                                        <p style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', margin: 0 }}>{combo.description}</p>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>

                              <div className="gaming-bento-right">
                                {/* Best Suitable Skin Card */}
                                <div className="skin-showcase-card">
                                  <div className="skin-showcase-img-wrap">
                                    <SmartImage src={selectedHero.cover_url || selectedHero.avatar_url} alt={selectedHero.name} fallbackType="hero" className="skin-showcase-img" />
                                  </div>
                                  <div className="skin-showcase-info">
                                    <span className="skin-showcase-tag">Default Painting</span>
                                    <strong className="skin-showcase-name">{selectedHero.name} - Skin</strong>
                                  </div>
                                </div>

                                {/* Battle Spell circular */}
                                <div className="gaming-panel-card">
                                  <h4 className="gaming-panel-title">Battle Spell</h4>
                                  <div className="circular-bubbles-row">
                                    {getHeroSpells(selectedHero, detailHeroData.builds?.spells).slice(0, 2).map((spell, idx) => (
                                      <div key={idx} className="circular-bubble-item" style={{ width: '48px' }}>
                                        <div className="circular-bubble-icon-wrap" style={{ width: '36px', height: '36px' }}>
                                          <SmartImage src={spell.icon} alt={spell.name} fallbackType="spell" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <span className="circular-bubble-label" style={{ fontSize: '0.44rem' }}>{spell.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Emblem Set talent */}
                                <div className="gaming-panel-card">
                                  <h4 className="gaming-panel-title">Emblem Set</h4>
                                  {(() => {
                                    const emblem = getHeroEmblem(selectedHero);
                                    return (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0e16', overflow: 'hidden' }}>
                                          <SmartImage src={emblem.icon} alt={emblem.name} fallbackType="hero" style={{ width: '24px', height: '24px' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: emblem.color }}>{emblem.name}</span>
                                          <span style={{ fontSize: '0.48rem', color: 'var(--text-secondary)' }}>{emblem.talents.map(t => t.name).join(' → ')}</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Meta Verdict */}
                            <div className="meta-verdict-box" style={{ padding: '0.65rem 0.75rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.04)', borderLeft: '3px solid var(--accent-blue)' }}>
                              <div style={{ fontSize: '0.52rem', fontWeight: 900, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>META VERDICT</div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{verdict.line1}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: '1.25' }}>
                                {verdict.line2} • <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>{verdict.line3}</span>
                              </div>
                            </div>

                            {/* Why Pick This Hero */}
                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem', color: 'var(--accent-green)' }}>Why Pick This Hero?</h5>
                              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.1rem', fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {getWhyPickList(selectedHero).map((reason, idx) => (
                                  <li key={idx} style={{ lineHeight: 1.3 }}>{reason}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Power Spikes */}
                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem' }}>Power Spikes</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.65rem', fontSize: '0.65rem' }}>
                                {[
                                  { label: "Early Game", val: oData.spikes.early * 2 },
                                  { label: "Mid Game ", val: oData.spikes.mid * 2 },
                                  { label: "Late Game", val: oData.spikes.late * 2 }
                                ].map((s, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700 }}>{s.label}</span>
                                    <span style={{ color: 'var(--accent-blue)', letterSpacing: '0.05rem' }}>{renderPowerBar(s.val)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Combat Profile */}
                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem' }}>Combat Profile</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '0.65rem' }}>
                                {[
                                  { label: "Burst Damage", val: oData.combat.burst, color: 'var(--accent-red)' },
                                  { label: "Sustain", val: oData.combat.sustain, color: 'var(--accent-green)' },
                                  { label: "Mobility", val: oData.combat.mobility, color: 'var(--accent-purple)' },
                                  { label: "Crowd Control", val: oData.combat.cc, color: 'var(--accent-gold)' },
                                  { label: "Scaling Power", val: oData.combat.scaling, color: 'var(--accent-blue)' },
                                  { label: "Teamfight Impact", val: oData.combat.teamfight, color: '#f97316' }
                                ].map((cStat, csIdx) => (
                                  <div key={csIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-secondary)', width: '95px', flexShrink: 0 }}>{cStat.label}</span>
                                    <div style={{ flexGrow: 1, height: '5px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${cStat.val * 10}%`, background: cStat.color, borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-primary)', width: '28px', textAlign: 'right', flexShrink: 0 }}>{cStat.val}/10</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Strengths & Weaknesses Chips */}
                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem' }}>Tactical Capabilities</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.65rem' }}>
                                <div>
                                  <span style={{ fontSize: '0.52rem', fontWeight: 900, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Strengths</span>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.3rem' }}>
                                    {oData.strengths.map((str, idx) => (
                                      <span key={idx} style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--accent-green)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                        {str}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span style={{ fontSize: '0.52rem', fontWeight: 900, color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Weaknesses & Vulnerabilities</span>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.3rem' }}>
                                    {oData.weaknesses.map((weak, idx) => (
                                      <span key={idx} style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                        {weak}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Draft Intelligence Card */}
                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem' }}>Draft Intelligence</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.65rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                  <div>
                                    <span style={{ fontSize: '0.52rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Best Pick Timing</span>
                                    <div style={{ marginTop: '0.2rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)' }}>{oData.bestPick}</div>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: '0.52rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ban Priority</span>
                                    <div style={{ marginTop: '0.2rem', fontSize: '0.72rem', fontWeight: 800, color: oData.banPriority === 'High' ? 'var(--accent-red)' : 'var(--text-primary)' }}>{oData.banPriority}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Use In Draft Assistant Button */}
                            <button
                              onClick={() => {
                                selectHeroForActiveSlot(selectedHero);
                                closeHeroDetails();
                              }}
                              className="btn btn-primary"
                              style={{ padding: '0.65rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: 'none', background: 'var(--accent-blue)', color: 'white', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 4px 12px var(--accent-blue-glow)' }}
                            >
                              <Swords size={16} />
                              Use In Draft Assistant
                            </button>

                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )
"""

# Replace lines 7086 to 8319 (0-indexed 7085 to 8318)
new_lines = lines[:7085] + [replacement_content + "\n"] + lines[8319:]

with open(app_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Replacement done. Running npm run build to verify...")
try:
    res = subprocess.run("npm run build", shell=True, cwd=r"c:\Users\rosha\Documents\MLBB", capture_output=True, text=True, timeout=30)
    print("Build Return Code:", res.returncode)
    if res.returncode == 0:
        print("SUCCESS! The project built cleanly with the new code.")
        # If success, we keep it!
    else:
        print("BUILD FAILED! Diagnostic log:")
        print(res.stderr)
        # Restore backup
        with open(backup_path, 'r', encoding='utf-8') as backup_f:
            orig = backup_f.read()
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(orig)
        print("Reverted App.jsx to backup.")
except Exception as e:
    print("Build process crashed or timed out:", e)
    # Restore backup
    with open(backup_path, 'r', encoding='utf-8') as backup_f:
        orig = backup_f.read()
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(orig)
    print("Reverted App.jsx to backup.")
