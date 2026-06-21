import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

import { 
  Search, ShieldAlert, Award, Swords, BookOpen, ChevronRight, ChevronLeft, ChevronDown, Clock,
  Sparkles, X, Languages, Volume2, HelpCircle, AlertCircle,
  TrendingUp, Compass, Play, Zap, Eye, RefreshCw, Trophy,
  ArrowLeft, Heart, Share2, Menu, Bell, Shield, Crosshair, HelpCircle as HelpIcon,
  Flame, Target, Rocket, Lightbulb, Gamepad2, Star, AlertTriangle,
  BarChart3, Sun, Moon, Monitor, User, Edit2, Settings
} from 'lucide-react';

import SmartImage from './components/SmartImage';

import { HeroRepository, BackgroundSeeder, PatchRepository } from './database/db';

import { RecoveryModeService } from './services/RecoveryModeService';
import { TelemetryService } from './services/TelemetryService';
import { PatchManager } from './services/PatchManager';
import DraftEngine from './services/DraftEngine';

import { App as CapApp } from '@capacitor/app';

// Over-The-Air (OTA) remote update configuration proxy (e.g. Cloudflare Worker wrap)
// Replace this with your actual deployed Cloudflare Worker domain when active
const REMOTE_UPDATE_BASE_URL = "https://mlbb-ota-proxy.linkdaddy0.workers.dev";

// Fallback PWA dataset if network fetches are offline or scraper is unrun

import FALLBACK_ROSTER from './data/fallback_roster.json';

import FALLBACK_MATRIX from './data/fallback_matrix.json';

import HERO_NICKNAMES from './data/hero_nicknames.json';

import HERO_SPECIALTIES from './data/hero_specialties.json';

import BATTLE_SPELLS_DATABASE from './data/battle_spells.json';

import HERO_EMBLEMS_DATA from './data/hero_emblems.json';

import HERO_STATS_DATA from './data/hero_stats.json';

import HERO_LORE_DATA from './data/hero_lore.json';

import HERO_COMBOS_DATABASE from './data/hero_combos.json';

import FALLBACK_HEROES from './data/fallback_heroes.json';

import PRO_EQUIPMENT_DATABASE from './data/pro_equipment.json';

import HERO_META_STATS from './data/hero_meta_stats.json';

import HERO_SPOTLIGHT_VIDEOS from './data/hero_spotlight_videos.json';



// Localized UI dictionaries for 7 languages

const VOCABULARY = {

  en: {

    home: "Home",

    heroes: "Heroes",

    assistant: "Draft",

    about: "Database Info",

    searchPlaceholder: "Search heroes by name or role...",

    draftCtaTitle: "DRAFT ASSISTANT IS READY",

    draftCtaText: "Tapping enemy picks calculates perfect counter recommendations in 3 seconds.",

    draftCtaBtn: "LAUNCH DRAFT ASSISTANT",

    trendingMeta: "TRENDING META HEROES (S+ Tier)",

    matchupOfWeek: "MATCHUP COUNTER PROFILE",

    matchupSub: "Why it works: Scraped from esports databases",

    recentPatch: "RECENT DATA METRICS",

    totalHeroes: "Total Heroes",

    patch: "Patch Version",

    allRoles: "All Roles",

    durability: "Durability",

    offense: "Offense",

    magic: "Magic",

    difficulty: "Difficulty",

    close: "Close",

    overview: "Overview",

    skills: "Skills",

    builds: "Builds",

    matchups: "Counters",

    skillsUpgrade: "Combo Suggestion",

    upgradeTips: "Skill Max Priority:",

    battleSpells: "Ideal Battle Spells:",

    gearBuild: "Optimal Pro Gear Set:",

    bestPartner: "Best Synergy Teammate:",

    countersHero: "Strong Against (Counters):",

    counteredBy: "Vulnerable to (Countered By):",

    assistantTitle: "Draft Assistant Counter Picker",

    assistantSub: "Select up to 5 drafted enemy heroes below. We will instantly query the patch-versioned static matrix and calculate the top 3 counter recommendations.",

    enemyDraft: "Current Enemy Draft:",

    emptySlot: "Empty Slot",

    selectEnemy: "Tap a hero below to add to enemy draft slots:",

    clearDraft: "Clear Draft",

    suggestedCounters: "TOP COUNTER RECOMMENDATIONS FOR YOUR TEAM:",

    confidenceRating: "Confidence Rating",

    suggestedLane: "Suggested Lane",

    disclaimer: "Disclaimer: MLDraft is an independent guide and companion app. It is not affiliated with, endorsed by, or associated with Moonton or Mobile Legends: Bang Bang."

  }

};



const TankIcon = ({ className, size = 18 }) => (
  <img src="/assets/icons/role_tank.png" alt="Tank" className={className} style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }} />
);
const FighterIcon = ({ className, size = 18 }) => (
  <img src="/assets/icons/role_fighter.png" alt="Fighter" className={className} style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }} />
);
const AssassinIcon = ({ className, size = 18 }) => (
  <img src="/assets/icons/role_assassin.png" alt="Assassin" className={className} style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }} />
);
const MarksmanIcon = ({ className, size = 18 }) => (
  <img src="/assets/icons/role_marksman.png" alt="Marksman" className={className} style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }} />
);
const MageIcon = ({ className, size = 18 }) => (
  <img src="/assets/icons/role_mage.png" alt="Mage" className={className} style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }} />
);
const SupportIcon = ({ className, size = 18 }) => (
  <img src="/assets/icons/role_support.png" alt="Support" className={className} style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }} />
);

const LaneIcon = ({ lane, size = 16, style = {} }) => {
  if (!lane) return null;
  const laneLower = lane.toLowerCase();
  let src = "";
  if (laneLower.includes("gold")) {
    src = "/assets/icons/lane_gold.png";
  } else if (laneLower.includes("exp")) {
    src = "/assets/icons/lane_exp.png";
  } else if (laneLower.includes("mid")) {
    src = "/assets/icons/lane_mid.png";
  } else if (laneLower.includes("jungle")) {
    src = "/assets/icons/lane_jungle.png";
  } else if (laneLower.includes("roam")) {
    src = "/assets/icons/lane_roam.png";
  }

  if (!src) return null;

  return (
    <img 
      src={src} 
      alt={lane} 
      style={{ 
        width: size, 
        height: size, 
        display: 'inline-block', 
        verticalAlign: 'middle', 
        marginRight: '6px',
        ...style 
      }} 
    />
  );
};


const getHeroNickname = (hero) => {

  if (!hero) return "";

  const hId = String(hero.id);

  if (HERO_NICKNAMES[hId]) return HERO_NICKNAMES[hId];

  if (hero.role === 'Marksman') return "Deadly Marksman";

  if (hero.role === 'Tank') return "Unbreakable Shield";

  if (hero.role === 'Assassin') return "Silent Executor";

  if (hero.role === 'Mage') return "Mystic Conjurer";

  if (hero.role === 'Fighter') return "Ruthless Gladiator";

  if (hero.role === 'Support') return "Guardian Angel";

  return "Legend of the Dawn";

};



const getHeroSpecialties = (hero) => {

  if (!hero) return [];

  const hId = String(hero.id);

  if (HERO_SPECIALTIES[hId]) return HERO_SPECIALTIES[hId];

  return [hero.role, "Meta Pick"];

};



const getSpellByUrl = (url) => {

  if (!url) return null;

  if (url.includes("rB_-LVo8_haATKt0AABH0pUQqEg1474122") || url.includes("Inspire")) return BATTLE_SPELLS_DATABASE.inspire;

  if (url.includes("rB_-LVo8_dGAFBn4AABQ7mzW4KI9082406") || url.includes("Flicker")) return BATTLE_SPELLS_DATABASE.flicker;

  if (url.includes("rB_-LVo8_k2ADx6dAABFn4q9Ntc1737750") || url.includes("Retribution")) return BATTLE_SPELLS_DATABASE.retribution;

  if (url.includes("rB_-LVpAyeqAJzS_AAAFNn9p9k842600") || url.includes("Execute")) return BATTLE_SPELLS_DATABASE.execute;

  if (url.includes("rB_-LVo8_hCAf6YVAAAFj0D9k1Y338166") || url.includes("Petrify")) return BATTLE_SPELLS_DATABASE.petrify;

  if (url.includes("rB_-LVo8_mWAWl9qAAAFz8p7p9I3621440") || url.includes("Aegis")) return BATTLE_SPELLS_DATABASE.aegis;

  if (url.includes("rB_-LVo8_iCAeZ55AAAFz8p7p9I3621440") || url.includes("Revitalize")) return BATTLE_SPELLS_DATABASE.revitalize;

  if (url.includes("rB_-LVo8_kCASzSAAAFn4q9Ntc1737750") || url.includes("Flameshot")) return BATTLE_SPELLS_DATABASE.flameshot;

  if (url.includes("rB_-LVpAye2AJzSAAAFn4q9Ntc1737750") || url.includes("Vengeance")) return BATTLE_SPELLS_DATABASE.vengeance;

  return null;

};



const getHeroSpells = (hero, moontonSpells = []) => {

  if (!hero) return [];

  

  const resolved = [];

  if (moontonSpells && moontonSpells.length > 0) {

    moontonSpells.forEach(url => {

      const match = getSpellByUrl(url);

      if (match) resolved.push(match);

    });

  }

  

  if (resolved.length > 0) return resolved;



  const role = hero.role.toLowerCase();

  if (role === 'marksman') {

    return [BATTLE_SPELLS_DATABASE.inspire, BATTLE_SPELLS_DATABASE.flicker];

  } else if (role === 'assassin') {

    return [BATTLE_SPELLS_DATABASE.retribution, BATTLE_SPELLS_DATABASE.execute];

  } else if (role === 'tank') {

    return [BATTLE_SPELLS_DATABASE.flicker, BATTLE_SPELLS_DATABASE.petrify];

  } else if (role === 'support') {

    return [BATTLE_SPELLS_DATABASE.flicker, BATTLE_SPELLS_DATABASE.revitalize];

  } else if (role === 'mage') {

    return [BATTLE_SPELLS_DATABASE.flicker, BATTLE_SPELLS_DATABASE.flameshot];

  } else if (role === 'fighter') {

    return [BATTLE_SPELLS_DATABASE.flicker, BATTLE_SPELLS_DATABASE.vengeance];

  }

  

  return [BATTLE_SPELLS_DATABASE.flicker, BATTLE_SPELLS_DATABASE.petrify];

};



const getHeroEmblem = (hero) => {

  if (!hero) return HERO_EMBLEMS_DATA.marksman;

  const role = hero.role.toLowerCase();

  

  if (hero.name === "Chou") return HERO_EMBLEMS_DATA.fighter;

  if (hero.name === "Kaja") return HERO_EMBLEMS_DATA.support;

  if (hero.name === "Karrie" || hero.name === "Claude") return HERO_EMBLEMS_DATA.marksman;

  

  if (HERO_EMBLEMS_DATA[role]) {

    return HERO_EMBLEMS_DATA[role];

  }

  return HERO_EMBLEMS_DATA.assassin;

};



const getHeroStats = (hero) => {

  if (!hero) return {};

  return hero.battle_status || HERO_STATS_DATA[hero.name] || {
    durability: 0,
    offense: 0,
    control_effect: 0,
    difficulty: 0
  };

};



const getHeroLore = (hero) => {

  if (!hero) return "";

  return HERO_LORE_DATA[hero.name] || "A legendary warrior of the Land of Dawn, fighting for honor, justice, and mastery of their unique skills in professional draft matchups.";

};

const validateEnglishText = (text, fallbackText = '') => {
  return text || fallbackText;
};



const getUpgradePriority = (hero) => {

  return {

    sequence: [1, 2, 3],

    text: "Prioritize upgrading Skill 1 > Skill 2 > Ultimate"

  };

};



const getProItemDetail = (item) => {

  if (!item) return null;

  const itemId = parseInt(item.id);

  const matched = PRO_EQUIPMENT_DATABASE.find(x => x.id === itemId || x.name.toLowerCase().trim() === item.name.toLowerCase().trim());

  if (matched) {

    return {

      id: matched.id,

      name: matched.name,

      icon: matched.icon,

      des: matched.passive,

      stats: matched.stats

    };

  }

  return {

    id: item.id,

    name: item.name,

    icon: item.icon,

    des: Array.isArray(item.des) ? item.des.join(" ") : String(item.des || ""),

    stats: ""

  };

};



const getItemPrice = (item) => {

  if (!item) return 0;

  if (item.category === 'Movement' || item.name.toLowerCase().includes('boots')) {

    return 250 + (item.id % 5) * 50 + 200; // boots: 450-700

  }

  return 1900 + (item.id % 8) * 100 + 50; // others: 1900-2650

};



const parseStatVal = (statStr) => {

  const match = statStr.match(/([+-]?\d+(?:\.\d+)?%?)/);

  if (!match) return { valStr: '', pct: 50 };

  const valStr = match[1];

  const numeric = parseFloat(valStr);

  let maxVal = 100;

  if (statStr.toLowerCase().includes('attack')) maxVal = 100;

  else if (statStr.toLowerCase().includes('defense')) maxVal = 60;

  else if (statStr.toLowerCase().includes('hp') && !statStr.toLowerCase().includes('percent')) maxVal = 1000;

  else if (statStr.toLowerCase().includes('speed') || statStr.toLowerCase().includes('cd')) maxVal = 40;

  const pct = Math.min(100, Math.max(10, (numeric / maxVal) * 100));

  return { valStr, pct };

};



const getSynergizedHeroes = (item) => {

  if (!item) return [];

  return FALLBACK_HEROES.filter(hero => {

    if (!hero.builds || !hero.builds.items) return false;

    return hero.builds.items.some(buildItem => {

      return buildItem.name.toLowerCase().trim() === item.name.toLowerCase().trim() ||

             String(buildItem.id) === String(item.id);

    });

  }).slice(0, 4);

};



const RANK_TIERS = [

  { name: "Warrior", color: "#b25e2c", icon: "/assets/ranks/warrior.webp" },

  { name: "Elite", color: "#7a8a99", icon: "/assets/ranks/elite.webp" },

  { name: "Master", color: "#e39a3e", icon: "/assets/ranks/master.webp" },

  { name: "Grandmaster", color: "#61a4ad", icon: "/assets/ranks/grandmaster.webp" },

  { name: "Epic", color: "#3bd49b", icon: "/assets/ranks/epic.webp" },

  { name: "Legend", color: "#d8a6ff", icon: "/assets/ranks/legend.webp" },

  { name: "Mythic", color: "#ff8c3b", icon: "/assets/ranks/mythic.webp" },

  { name: "Mythical Honor", color: "#ffd700", icon: "/assets/ranks/mythical_honor.webp" },

  { name: "Mythical Glory", color: "#fbbf24", icon: "/assets/ranks/mythical_glory.webp" },

  { name: "Mythical Immortal", color: "#a5f3fc", icon: "/assets/ranks/mythical_immortal.webp" }

];



export default function App() {

  // English-only for now (other languages coming soon)
  const lang = 'en';
  const setLang = () => {}; // no-op — language switching disabled

  // Dynamic Static Assets Database State (moved to top to avoid TDZ ReferenceErrors)
  const [heroes, setHeroes] = useState(FALLBACK_ROSTER);
  const [draftMatrix, setDraftMatrix] = useState(FALLBACK_MATRIX);
  const [patchMeta, setPatchMeta] = useState({ current_patch: "1.8.84", total_heroes: 124 });
  const [loading, setLoading] = useState(false);
  const appMountTimeRef = useRef(Date.now());
  const activeDataBaseUrlRef = useRef(window.location.origin);
  const activeDataRevisionRef = useRef('');
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOutSplash, setFadeOutSplash] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const splashVideoRef = useRef(null);

  // Force play the video programmatically to bypass WebView autoplay restrictions
  useEffect(() => {
    if (splashVideoRef.current) {
      const playPromise = splashVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('[App] Autoplay blocked or failed:', error);
        });
      }
    }
  }, [showSplash]);

  const [isFirstTimeUser] = useState(() => {
    const hasOpened = localStorage.getItem('mythiciq_has_opened_before');
    if (!hasOpened) {
      localStorage.setItem('mythiciq_has_opened_before', 'true');
      return true;
    }
    return false;
  });

  // Enforce 5s playback for first-time users and 3s playback for returning users
  useEffect(() => {
    const delay = isFirstTimeUser ? 5000 : 3000;
    const timer = setTimeout(() => {
      setVideoFinished(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [isFirstTimeUser]);

  // Fade out splash overlay when loading is complete and video requirements are met
  useEffect(() => {
    if (!loading && videoFinished) {
      setFadeOutSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, videoFinished]);

  // Manage body background style during boot and clear it when splash completes to allow css classes to style the page
  useEffect(() => {
    if (!showSplash) {
      document.body.style.backgroundColor = '';
    } else {
      document.body.style.backgroundColor = '#000000';
    }
  }, [showSplash]);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('mlbb_companion_theme');
    if (saved === 'system' || saved === 'light' || saved === 'dark') return saved;
    return 'system';
  });

  useEffect(() => {
    const handleThemeApply = () => {
      let appliedTheme = theme;
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        appliedTheme = systemPrefersDark ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', appliedTheme);
    };

    handleThemeApply();
    localStorage.setItem('mlbb_companion_theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        const systemPrefersDark = mediaQuery.matches;
        document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
      } else {
        mediaQuery.addListener(listener);
      }
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', listener);
        } else {
          mediaQuery.removeListener(listener);
        }
      };
    }
  }, [theme]);

  // Contrast Auditor Debug Mode
  useEffect(() => {
    if (import.meta.env.PROD) return; // Skip expensive DOM contrast scan in production builds
    const timer = setTimeout(() => {
      console.log(`[Contrast Audit] Checking page element contrasts for: ${theme}`);
      const elements = document.querySelectorAll('*');
      let warningCount = 0;

      elements.forEach((el) => {
        if (['SCRIPT', 'STYLE', 'LINK', 'SVG', 'PATH', 'IFRAME', 'HEAD', 'HTML'].includes(el.tagName)) return;
        const text = el.textContent?.trim();
        if (!text || el.children.length === el.childNodes.length) return;

        const computedStyle = window.getComputedStyle(el);
        const color = computedStyle.color;
        
        let bg = computedStyle.backgroundColor;
        let parent = el;
        while ((bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') && parent.parentElement) {
          parent = parent.parentElement;
          bg = window.getComputedStyle(parent).backgroundColor;
        }

        const parseRGB = (colStr) => {
          const match = colStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
        };

        const rgbColor = parseRGB(color);
        const rgbBg = parseRGB(bg);

        if (rgbColor && rgbBg) {
          const getLuminance = ([r, g, b]) => {
            const a = [r, g, b].map((v) => {
              v /= 255;
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
          };

          const lumColor = getLuminance(rgbColor);
          const lumBg = getLuminance(rgbBg);
          const ratio = (Math.max(lumColor, lumBg) + 0.05) / (Math.min(lumColor, lumBg) + 0.05);

          if (ratio < 2.5) {
            warningCount++;
            console.warn(
              `[Theme Contrast Warning] Element <${el.tagName.toLowerCase()} class="${el.className}" id="${el.id}"> has poor contrast ratio: ${ratio.toFixed(2)}:1. Text: ${color}, BG: ${bg}. Snippet: "${text.substring(0, 30)}..."`
            );
          }
        }
      });
      console.log(`[Contrast Audit] Complete. Found ${warningCount} low-contrast elements.`);
    }, 1500); // 1.5 seconds delay to allow transitions and renders to stabilize
    return () => clearTimeout(timer);
  }, [theme]);

  const [activeTab, setActiveTab] = useState('home');

  const [searchQuery, setSearchQuery] = useState('');

  const [roleFilter, setRoleFilter] = useState('All');
  const [laneFilter, setLaneFilter] = useState('All');

  const [showBuffedOnly, setShowBuffedOnly] = useState(false);

  const [showcaseFilter, setShowcaseFilter] = useState(false);

  // Section Collapsing States
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('mldraft_collapsed_sections');
      return saved ? JSON.parse(saved) : { meta: false, role: false, intel: false };
    } catch {
      return { meta: false, role: false, intel: false };
    }
  });

  const toggleSectionCollapse = (sectionKey) => {
    setCollapsedSections(prev => {
      const updated = { ...prev, [sectionKey]: !prev[sectionKey] };
      localStorage.setItem('mldraft_collapsed_sections', JSON.stringify(updated));
      return updated;
    });
  };

  // Recent Activity States
  const [lastHeroViewed, setLastHeroViewed] = useState(() => {
    try {
      const saved = localStorage.getItem('mldraft_last_hero');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [lastRoleFilter, setLastRoleFilter] = useState(() => {
    return localStorage.getItem('mldraft_last_role') || null;
  });

  // Automatically update last role filter in localStorage
  useEffect(() => {
    if (roleFilter && roleFilter !== 'All') {
      localStorage.setItem('mldraft_last_role', roleFilter);
      setLastRoleFilter(roleFilter);
    }
  }, [roleFilter]);

  

  // Custom Overlays & Skeletons State

  const [showCombosModal, setShowCombosModal] = useState(false);

  const [showItemsModal, setShowItemsModal] = useState(false);

  const [showSpellsModal, setShowSpellsModal] = useState(false);

  const [showMatchupModal, setShowMatchupModal] = useState(false);



  const [battleStatusHeroId, setBattleStatusHeroId] = useState(1);

  const [battleStatusSubTab, setBattleStatusSubTab] = useState('counters'); // 'counters', 'teammates', 'weak_against'

  const [battleSearchQuery, setBattleSearchQuery] = useState('');

  const [showAllMatchups, setShowAllMatchups] = useState(false);

  const [comboHeroId, setComboHeroId] = useState(1);

  const [showLangMenu, setShowLangMenu] = useState(false);

  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const [activeDrawerTab, setActiveDrawerTab] = useState('profile');

  const handleDrawerTabClick = (tabName) => {
    if (activeDrawerTab === tabName) {
      setActiveDrawerTab(null);
    } else if (activeDrawerTab) {
      setActiveDrawerTab(null);
      setTimeout(() => {
        setActiveDrawerTab(tabName);
      }, 350);
    } else {
      setActiveDrawerTab(tabName);
    }
  };

  const [largeText, setLargeText] = useState(() => {
    return document.documentElement.classList.contains('large-text');
  });

  const [profileAvatarFilter, setProfileAvatarFilter] = useState('All');

  const [profileBannerFilter, setProfileBannerFilter] = useState('All');

  const [selectedMetaHeroId, setSelectedMetaHeroId] = useState(null);

  const [guideVideoLoaded, setGuideVideoLoaded] = useState(false);

  const [activeExploreRole, setActiveExploreRole] = useState(null);

  const [activeExploreLane, setActiveExploreLane] = useState(null);

  const [exploreSearchQuery, setExploreSearchQuery] = useState('');

  const [videoIframeLoading, setVideoIframeLoading] = useState(false);

  const [backToast, setBackToast] = useState('');

  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const avatarRefs = useRef([]);
  const avatarTrackRef = useRef(null);
  const slideRefs = useRef({});

  const showcaseHeroes = useMemo(() => {
    if (!heroes || heroes.length === 0) return [];
    
    const selected = new Set();
    const lanes = ['Gold Lane', 'EXP Lane', 'Mid Lane', 'Jungle', 'Roam'];
    const roles = ['Marksman', 'Assassin', 'Fighter', 'Mage', 'Tank', 'Support'];
    
    const getTopForFilter = (filterFn) => {
      const filtered = heroes.filter(filterFn);
      if (filtered.length === 0) return [];
      
      const topWin = [...filtered].sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0))[0];
      const topPick = [...filtered].sort((a, b) => (b.pick_rate || 0) - (a.pick_rate || 0))[0];
      const topBan = [...filtered].sort((a, b) => (b.ban_rate || 0) - (a.ban_rate || 0))[0];
      
      return [topWin, topPick, topBan].filter(Boolean);
    };

    // 1. Process Lanes
    lanes.forEach(lane => {
      const topLanes = getTopForFilter(h => String(h.lane || '').toLowerCase() === lane.toLowerCase());
      topLanes.forEach(h => selected.add(h.id));
    });

    // 2. Process Roles
    roles.forEach(role => {
      const topRoles = getTopForFilter(h => String(h.role || '').toLowerCase() === role.toLowerCase());
      topRoles.forEach(h => selected.add(h.id));
    });

    return Array.from(selected)
      .map(id => heroes.find(h => h.id === id))
      .filter(Boolean);
  }, [heroes]);

  // Unified Swipe Gesture State (Touch + Mouse) for Featured Hero Showcase
  // CRITICAL: Use refs (not state) for all values read/written during drag to avoid re-renders
  const touchStartRef = useRef(null);
  const isSwipingRef = useRef(false);
  const [, forceSwipeRender] = useState(0); // only to re-render cursor style
  const touchOffsetRef = useRef(0);
  const dragMoved = useRef(false);

  const handleDragStart = useCallback((clientX) => {
    touchStartRef.current = clientX;
    touchOffsetRef.current = 0;
    isSwipingRef.current = true;
    dragMoved.current = false;
    forceSwipeRender(v => v + 1);
  }, []);

  const handleDragMove = useCallback((clientX) => {
    if (touchStartRef.current === null) return;
    const diff = clientX - touchStartRef.current;
    touchOffsetRef.current = diff;
    if (Math.abs(diff) > 8) {
      dragMoved.current = true;
    }

    // Direct DOM manipulation for buttery smooth 60fps tracking during swiping
    const len = showcaseHeroes.length;
    if (len === 0) return;
    
    const activeIdx = showcaseIndex;
    const leftIdx = (activeIdx - 1 + len) % len;
    const rightIdx = (activeIdx + 1) % len;

    const activeEl = slideRefs.current[activeIdx];
    const leftEl = slideRefs.current[leftIdx];
    const rightEl = slideRefs.current[rightIdx];

    if (activeEl) {
      activeEl.style.transition = 'none';
      activeEl.style.transform = `translate(${diff}px, 0px) scale(1)`;
    }
    if (leftEl) {
      leftEl.style.transition = 'none';
      leftEl.style.transform = `translate(${-150 + diff}px, 20px) scale(0.75)`;
    }
    if (rightEl) {
      rightEl.style.transition = 'none';
      rightEl.style.transform = `translate(${150 + diff}px, 20px) scale(0.75)`;
    }
  }, [showcaseHeroes.length, showcaseIndex]);

  const handleDragEnd = useCallback(() => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    forceSwipeRender(v => v + 1);
    
    // Restore CSS transitions on all slides for the snap-back animation
    Object.values(slideRefs.current).forEach(el => {
      if (el) el.style.transition = '';
    });

    const finalOffset = touchOffsetRef.current;
    const threshold = 40; // 40px minimum swipe distance for snappy feel
    if (finalOffset > threshold) {
      setShowcaseIndex(prev => (prev - 1 + showcaseHeroes.length) % showcaseHeroes.length);
    } else if (finalOffset < -threshold) {
      setShowcaseIndex(prev => (prev + 1) % showcaseHeroes.length);
    }
    
    touchStartRef.current = null;
    touchOffsetRef.current = 0;
    setTimeout(() => {
      dragMoved.current = false;
    }, 50);
  }, [showcaseHeroes.length]);

  // Meta Spotlight tabs state
  const [metaSpotlightTab, setMetaSpotlightTab] = useState('banned');

  const metaSpotlightHeroes = useMemo(() => {
    if (!heroes || heroes.length === 0) return { banned: null, winRate: null, picked: null };
    
    const sorted = heroes.filter(h => h.ban_rate != null && h.win_rate != null && h.pick_rate != null);
    const banned = [...sorted].sort((a, b) => b.ban_rate - a.ban_rate)[0] || null;
    const winRate = [...sorted].sort((a, b) => b.win_rate - a.win_rate)[0] || null;
    const picked = [...sorted].sort((a, b) => b.pick_rate - a.pick_rate)[0] || null;
    return { banned, winRate, picked };
  }, [heroes]);



  useEffect(() => {
    const track = avatarTrackRef.current;
    const activeItem = avatarRefs.current[showcaseIndex];
    if (track && activeItem) {
      const trackWidth = track.clientWidth;
      const activeWidth = activeItem.clientWidth;
      const activeLeft = activeItem.offsetLeft;
      
      const targetScrollLeft = activeLeft - (trackWidth / 2) + (activeWidth / 2);
      
      track.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  }, [showcaseIndex]);

  // Duplicate touch state declaration removed to allow proper swipe gesture tracking.



  // First-Time Welcome Onboarding States

  const [onboardingComplete, setOnboardingComplete] = useState(() => {

    try {

      const saved = localStorage.getItem('mldraft_onboarding_complete');

      return saved === 'true';

    } catch {

      return false;

    }

  });

  const [onboardingStep, setOnboardingStep] = useState(1);

  const [onboardProfile, setOnboardProfile] = useState({

    username: "",

    badgeIndex: 8,

    profileHeroId: 1,

    preferredRoles: []

  });

  const [onboardSearchQuery, setOnboardSearchQuery] = useState('');

  const [onboardRoleFilter, setOnboardRoleFilter] = useState('All');



  // Core database states moved to top of App component to avoid TDZ reference errors.



  // Asynchronous split-fetch Detailed overlay state

  const [selectedHero, setSelectedHero] = useState(null);

  const [detailHeroData, setDetailHeroData] = useState(null);

  const [heroDetailsLoading, setHeroDetailsLoading] = useState(false);

  const [heroDetailTab, setHeroDetailTab] = useState('overview');

  const [activeSkillIndex, setActiveSkillIndex] = useState(0);

  const [mistakesExpanded, setMistakesExpanded] = useState(false);

  const [proTipsExpanded, setProTipsExpanded] = useState(false);

  

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

        const matchHero = heroes.find(h => h.id === item.id || (item.name && h.name.toLowerCase() === item.name.toLowerCase()));

        const meta = (item.name && HERO_META_STATS.find(m => m.name.toLowerCase() === item.name.toLowerCase())) || {};

        return {

          id: item.id || (matchHero ? matchHero.id : null),

          name: item.name || (matchHero ? matchHero.name : 'Unknown'),

          avatar_url: matchHero ? matchHero.avatar_url : (item.avatar || ''),

          role: matchHero ? matchHero.role : (meta.role || 'Unknown'),

          lane: matchHero ? matchHero.lane : (meta.lane || 'Lane'),

          tier: meta.tier || 'A',

          win_rate: matchHero ? matchHero.win_rate : (meta.win_rate || 50),

          reason: (item.reason && validateEnglishText(item.reason)) || null,

          score: item.score

        };

      };



      // 1. Best Counters (weak_against list with positive scores, sorted descending)

      bestCounters = (node.weak_against || [])

        .filter(item => item.score > 0)

        .sort((a, b) => b.score - a.score)

        .map(mapItem);



      // 2. Weakest Counters (weak_against list with negative scores, sorted ascending - most negative first)

      weakestCounters = (node.weak_against || [])

        .filter(item => item.score < 0)

        .sort((a, b) => a.score - b.score)

        .map(mapItem);



      // 3. Best Teammates (synergy list with positive scores, sorted descending)

      bestTeammates = (node.synergy || [])

        .filter(item => item.score > 0)

        .sort((a, b) => b.score - a.score)

        .map(mapItem);



      // 4. Least Synergy (synergy list with negative scores, sorted ascending - most negative first)

      leastSynergy = (node.synergy || [])

        .filter(item => item.score < 0)

        .sort((a, b) => a.score - b.score)

        .map(mapItem);



      // 5. Complete Raw lists mapped

      rawSynergy = (node.synergy || []).map(mapItem);

      rawCounters = (node.weak_against || []).map(mapItem);

    }



    // Fallbacks if lists are empty (retro compatibility)

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

      counters: bestCounters, // Positives (Strong Against)

      weakAgainst: weakestCounters, // Negatives (Weak Against)

      synergy: bestTeammates, 

      leastSynergy, 

      rawSynergy, 

      rawCounters 

    };

  };

  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const [favoriteHeroes, setFavoriteHeroes] = useState(() => {

    try {

      const saved = localStorage.getItem('mldraft_favorites');

      return saved ? JSON.parse(saved) : [];

    } catch {

      return [];

    }

  });

  const [showShareToast, setShowShareToast] = useState(false);

  const [showBuildToast, setShowBuildToast] = useState(false);

  const [modalScrollTop, setModalScrollTop] = useState(0);

  const [heroImageRatio, setHeroImageRatio] = useState(1.0);



  // User Legend Profile Customizable State

  const [playerProfile, setPlayerProfile] = useState(() => {

    try {

      const saved = localStorage.getItem('mldraft_player_profile');

      if (saved) {

        const parsed = JSON.parse(saved);

        return {

          ...parsed,

          preferredRoles: parsed.preferredRoles || [],
          matches: parsed.matches !== undefined ? parsed.matches : 1245,
          winRate: parsed.winRate !== undefined ? parsed.winRate : 58.7,
          mvpCount: parsed.mvpCount !== undefined ? parsed.mvpCount : 284

        };

      }

      return {

        username: "Legend",

        rank: "Mythical Glory",

        stars: 52,

        badgeIndex: 8,

        profileHeroId: 1,

        bannerHeroId: 1,

        preferredRoles: [],
        matches: 1245,
        winRate: 58.7,
        mvpCount: 284

      };

    } catch {

      return {

        username: "Legend",

        rank: "Mythical Glory",

        stars: 52,

        badgeIndex: 8,

        profileHeroId: 1,

        bannerHeroId: 1,

        preferredRoles: [],
        matches: 1245,
        winRate: 58.7,
        mvpCount: 284

      };

    }

  });



  const finalProfile = useMemo(() => {

    return {

      username: playerProfile.username || "Legend",

      rank: playerProfile.rank || "Mythical Glory",

      stars: playerProfile.stars !== undefined ? playerProfile.stars : 52,

      badgeIndex: playerProfile.badgeIndex !== undefined ? playerProfile.badgeIndex : 8,

      profileHeroId: playerProfile.profileHeroId || 1,

      bannerHeroId: playerProfile.profileHeroId || 1,

      preferredRoles: playerProfile.preferredRoles || [],
      matches: playerProfile.matches !== undefined ? playerProfile.matches : 1245,
      winRate: playerProfile.winRate !== undefined ? playerProfile.winRate : 58.7,
      mvpCount: playerProfile.mvpCount !== undefined ? playerProfile.mvpCount : 284

    };

  }, [playerProfile]);



  const profileHero = useMemo(() => {
    const fallback = FALLBACK_ROSTER && FALLBACK_ROSTER[0] ? FALLBACK_ROSTER[0] : {};
    if (!heroes || heroes.length === 0) return fallback;
    return heroes.find(h => h.id === finalProfile.profileHeroId) || heroes[0] || fallback;
  }, [heroes, finalProfile.profileHeroId]);

  const bannerHero = useMemo(() => {
    const fallback = FALLBACK_ROSTER && FALLBACK_ROSTER[2] ? FALLBACK_ROSTER[2] : (FALLBACK_ROSTER && FALLBACK_ROSTER[0] ? FALLBACK_ROSTER[0] : {});
    if (!heroes || heroes.length === 0) return fallback;
    return heroes.find(h => h.id === finalProfile.profileHeroId) || heroes[2] || fallback;
  }, [heroes, finalProfile.profileHeroId]);



  // Rankings Page State

  const [rankingsSubTab, setRankingsSubTab] = useState('ban');

  const [rankingsSearch, setRankingsSearch] = useState('');

  const [rankingsRoleFilter, setRankingsRoleFilter] = useState('All');

  const [rankingsRankFilter, setRankingsRankFilter] = useState('101');

  const [rankingsDaysFilter, setRankingsDaysFilter] = useState('1d');



  // Fully Operational Builds Tab Categories

  const [buildTabFilter, setBuildTabFilter] = useState('All');

  const [buildSearchQuery, setBuildSearchQuery] = useState('');



  useEffect(() => {

    try {

      localStorage.setItem('mldraft_favorites', JSON.stringify(favoriteHeroes));

    } catch (e) {

      console.warn("Storage sync failed:", e);

    }

  }, [favoriteHeroes]);



  useEffect(() => {

    try {

      localStorage.setItem('mldraft_player_profile', JSON.stringify(playerProfile));

    } catch (e) {

      console.warn("Profile sync failed:", e);

    }

  }, [playerProfile]);



  useEffect(() => {

    if (!heroes || heroes.length === 0) return;

    if (!selectedMetaHeroId) {

      setSelectedMetaHeroId(finalProfile.profileHeroId || 1);

    }

  }, [heroes, selectedMetaHeroId, finalProfile.profileHeroId]);



  useEffect(() => {

    if (finalProfile.profileHeroId) {

      setSelectedMetaHeroId(finalProfile.profileHeroId);

    }

  }, [finalProfile.profileHeroId]);



  // Create a React Ref to store the latest values of reactive states

  const backButtonStateRef = React.useRef({

    activeTab,

    selectedHero,

    showProfileEdit,

    showCombosModal,

    showItemsModal,

    showSpellsModal,

    showLangMenu,

    showMatchupModal

  });



  // Keep the Ref current with the latest values on every render

  useEffect(() => {

    backButtonStateRef.current = {

      activeTab,

      selectedHero,

      showProfileEdit,

      showCombosModal,

      showItemsModal,

      showSpellsModal,

      showLangMenu,

      showMatchupModal

    };

  });



  useEffect(() => {

    let lastBackPress = 0;



    const setupBackButtonListener = async () => {

      const listener = await CapApp.addListener('backButton', () => {

        const {

          activeTab,

          selectedHero,

          showProfileEdit,

          showCombosModal,

          showItemsModal,

          showSpellsModal,

          showLangMenu,

          showMatchupModal

        } = backButtonStateRef.current;



        const hasOverlay = selectedHero || showProfileEdit || showCombosModal || showItemsModal || showSpellsModal || showLangMenu || showMatchupModal;



        if (selectedHero) {

          closeHeroDetails();

          return;

        }

        

        if (showProfileEdit || showCombosModal || showItemsModal || showSpellsModal || showLangMenu || showMatchupModal) {

          setShowProfileEdit(false);

          setShowCombosModal(false);

          setShowItemsModal(false);

          setShowSpellsModal(false);

          setShowLangMenu(false);

          setShowMatchupModal(false);

          return;

        }



        if (activeTab !== 'home') {

          setActiveTab('home');

          return;

        }



        const now = Date.now();

        if (now - lastBackPress > 1800) {

          lastBackPress = now;

          setBackToast('Press back again to exit');

          setTimeout(() => setBackToast(''), 1800);

        } else {

          CapApp.exitApp();

        }

      });



      return listener;

    };



    const backButtonPromise = setupBackButtonListener();



    return () => {

      backButtonPromise.then(listener => {

        listener.remove();

      });

    };

  }, []);



  const toggleFavorite = (heroId) => {

    setFavoriteHeroes(prev => 

      prev.includes(heroId) ? prev.filter(id => id !== heroId) : [...prev, heroId]

    );

  };



  // Counter Picker Draft State
  const [allyDraft, setAllyDraft] = useState([null, null, null, null, null]);
  const [enemyDraft, setEnemyDraft] = useState([null, null, null, null, null]);
  const [activeDraftSlot, setActiveDraftSlot] = useState({ team: 'enemy', index: 0 });
  const [draftSearch, setDraftSearch] = useState('');
  const [draftRoleFilter, setDraftRoleFilter] = useState('All');
  const [activeLaneTab, setActiveLaneTab] = useState('overall');
  const [expandedHeroId, setExpandedHeroId] = useState(null);
  const [activeStrategyTab, setActiveStrategyTab] = useState('overall');
  const [showInspector, setShowInspector] = useState(false);
  const [pickerExpanded, setPickerExpanded] = useState(false);
  const [previewRecomHero, setPreviewRecomHero] = useState(null);
  const searchInputRef = useRef(null);
  const indexToLaneKey = ['jungleLane', 'expLane', 'goldLane', 'midLane', 'roamLane'];
  const [replaceConfirmation, setReplaceConfirmation] = useState(null);
  const [errorToast, setErrorToast] = useState('');
  const [healthCollapsed, setHealthCollapsed] = useState(true);
  const [recentPicks, setRecentPicks] = useState([]);

  // Mobile Swipe Gesture State & Callbacks for Sticky Bottom Sheet Hero Picker
  const sheetTouchStartRef = useRef(null);
  const sheetTouchStartExpandedRef = useRef(false);

  const handleSheetTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    sheetTouchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
    sheetTouchStartExpandedRef.current = pickerExpanded;
  }, [pickerExpanded]);

  const handleSheetTouchEnd = useCallback((e) => {
    if (!sheetTouchStartRef.current) return;
    if (e.changedTouches.length !== 1) return;

    const startY = sheetTouchStartRef.current.y;
    const endY = e.changedTouches[0].clientY;
    const diffY = endY - startY; // positive = down, negative = up

    const startX = sheetTouchStartRef.current.x;
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - startX;

    // Minimum swipe threshold of 50px
    if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX)) {
      if (diffY < 0 && !sheetTouchStartExpandedRef.current) {
        // Swipe UP -> Expand sheet
        setPickerExpanded(true);
      } else if (diffY > 0 && sheetTouchStartExpandedRef.current) {
        // Swipe DOWN -> Collapse sheet
        // Check if the user is scrolling a scrollable area inside the sheet
        const target = e.target;
        const scrollableContainer = target.closest('.dense-hero-pool-grid, .picker-recent-picks-row, .rankings-role-pills');
        if (scrollableContainer && scrollableContainer.scrollTop > 0) {
          return;
        }
        setPickerExpanded(false);
      }
    }
    sheetTouchStartRef.current = null;
  }, [pickerExpanded]);

  // Mobile Swipe Gesture State & Callbacks for Draft Container background
  const containerTouchStartRef = useRef(null);
  const handleContainerTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    containerTouchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, []);

  const handleContainerTouchEnd = useCallback((e) => {
    if (!containerTouchStartRef.current) return;
    if (e.changedTouches.length !== 1) return;

    const startY = containerTouchStartRef.current.y;
    const endY = e.changedTouches[0].clientY;
    const diffY = endY - startY;

    const startX = containerTouchStartRef.current.x;
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - startX;

    // Swipe UP on draft page container to open the hero picker sheet
    if (diffY < -50 && Math.abs(diffY) > Math.abs(diffX)) {
      if (!pickerExpanded) {
        setPickerExpanded(true);
      }
    }
    containerTouchStartRef.current = null;
  }, [pickerExpanded]);

  // Memoized grid search filter declared at top-level component scope to adhere to Hook order rules
  const filteredDraftHeroes = useMemo(() => {
    if (!heroes) return [];
    const searchLower = draftSearch.toLowerCase();
    return heroes.filter(h => {
      const matchesSearch = !searchLower || 
                            h.name.toLowerCase().includes(searchLower) ||
                            h.role.toLowerCase().includes(searchLower);
      const matchesRole = draftRoleFilter === 'All' || h.role === draftRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [heroes, draftSearch, draftRoleFilter]);

  // Memoized Draft Health Score & Explanation state calculators
  const draftHealthDetails = useMemo(() => {
    if (!heroes || heroes.length === 0) {
      return { score: 30, strengths: [], weaknesses: [], stats: {} };
    }
    
    // Auxiliary helper to extract hero attributes based on Moonton GMS metrics
    const getHeroAttributes = (h) => {
      const role = (h.role || "").toLowerCase();
      const spec = (h.speciality || []).map(s => s.toLowerCase());
      const lane = (h.lane || "").toLowerCase();
      const alive = Number(h.durability || h.alive || 0);
      const mag = Number(h.magic || h.mag || 0);
      const phy = Number(h.offense || h.phy || 0);
      return {
        frontline: role.includes("tank") || (role.includes("fighter") && alive >= 60) || alive >= 75,
        crowdControl: spec.some(s => s.includes("control") || s.includes("stun") || s.includes("slow")) || (role.includes("mage") && mag >= 75) || (role.includes("tank") && mag >= 60),
        magicDamage: role.includes("mage") || mag >= 75,
        objectiveControl: (alive >= 50 && phy >= 50) || role.includes("assassin") || role.includes("fighter") || lane.includes("jungle"),
        mobility: spec.some(s => s.includes("mobility") || s.includes("charge") || s.includes("speed")) || role.includes("assassin") || lane.includes("jungle")
      };
    };

    const activeAllies = allyDraft.filter(h => h !== null);
    const stats = { frontline: 0, crowdControl: 0, magicDamage: 0, objectiveControl: 0, mobility: 0 };
    
    activeAllies.forEach(hero => {
      const attrs = getHeroAttributes(hero);
      if (attrs.frontline) stats.frontline++;
      if (attrs.crowdControl) stats.crowdControl++;
      if (attrs.magicDamage) stats.magicDamage++;
      if (attrs.objectiveControl) stats.objectiveControl++;
      if (attrs.mobility) stats.mobility++;
    });

    const strengths = [];
    const weaknesses = [];
    let score = 30; // Base score out of 100

    // Frontline Analysis
    if (stats.frontline >= 1) {
      score += 14;
      strengths.push({ key: 'frontline', name: 'Frontline', heroSuggestions: [] });
    } else {
      weaknesses.push({ key: 'frontline', name: 'Frontline', heroSuggestions: ['Belerick', 'Tigreal', 'Ruby'] });
    }

    // Crowd Control Analysis
    if (stats.crowdControl >= 1) {
      score += 14;
      strengths.push({ key: 'crowdControl', name: 'Crowd Control', heroSuggestions: [] });
    } else {
      weaknesses.push({ key: 'crowdControl', name: 'Crowd Control', heroSuggestions: ['Franco', 'Khufra', 'Atlas'] });
    }

    // Magic Damage Balance
    if (stats.magicDamage >= 1) {
      score += 14;
      strengths.push({ key: 'magicDamage', name: 'Magic Damage', heroSuggestions: [] });
    } else {
      weaknesses.push({ key: 'magicDamage', name: 'Magic Damage', heroSuggestions: ['Lylia', 'Xavier', 'Eudora'] });
    }

    // Objective Control (Turtle/Lord/Towers)
    if (stats.objectiveControl >= 1) {
      score += 14;
      strengths.push({ key: 'objectiveControl', name: 'Objective Control', heroSuggestions: [] });
    } else {
      weaknesses.push({ key: 'objectiveControl', name: 'Objective Control', heroSuggestions: ['Ling', 'Lancelot', 'Helcurt'] });
    }

    // Team Mobility & Rotations
    if (stats.mobility >= 1) {
      score += 14;
      strengths.push({ key: 'mobility', name: 'Mobility', heroSuggestions: [] });
    } else {
      weaknesses.push({ key: 'mobility', name: 'Mobility', heroSuggestions: ['Fanny', 'Benedetta', 'Joy'] });
    }

    // Dynamic Draft scaling reward
    const pickedCount = activeAllies.length;
    if (pickedCount > 0) {
      score += Math.round((pickedCount / 5) * 30);
    }
    score = Math.min(100, Math.max(30, score));

    return { score, strengths, weaknesses, stats, getHeroAttributes };
  }, [allyDraft, heroes]);



  const t = VOCABULARY[lang] || VOCABULARY.en;



  // Debounced search mapping to avoid excessive rendering

  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {

    const handler = setTimeout(() => {

      setDebouncedQuery(searchQuery);

    }, 150);

    return () => clearTimeout(handler);

  }, [searchQuery]);



  // Dynamic versioned patch loaders with database boot integrity check and telemetry logging

  useEffect(() => {

    let active = true;

    setLoading(true);



    const bootAndLoad = async () => {

      TelemetryService.log('boot_start', { lang });

      

      try {

        // 1. Run Boot integrity check

        console.log('[App] Hook: Performing database boot integrity check...');

        const integrity = await RecoveryModeService.checkIntegrity();

        

        if (!integrity.ok) {

          console.warn('[App] Hook: Database integrity check failed! Active issues:', integrity.issues);

          TelemetryService.log('boot_integrity_failed', { issues: integrity.issues });

          

          // Trigger automated recovery mode

          const rec = await RecoveryModeService.recover();

          if (rec.recovered) {

            console.log('[App] Hook: Database recovery completed successfully.');

            TelemetryService.log('boot_recovery_success');

          } else {

            console.error('[App] Hook: Database recovery failed:', rec.error);

            TelemetryService.log('boot_recovery_failed', { error: rec.error });

          }

        } else {

          console.log('[App] Hook: Database boot integrity verified.');

          TelemetryService.log('boot_integrity_passed');

        }

      } catch (err) {

        console.error('[App] Hook: Boot integrity check crashed:', err);

        TelemetryService.log('boot_integrity_crash', { error: err.message });

      }



      if (!active) return;

      // 2. Fetch global patch metadata and index files (with remote OTA update check)
      try {
        // 1. Always fetch local patch configuration first
        let localPatchData = { current_patch: "1.8.84", data_revision: "0", total_heroes: 124 };
        try {
          const localPatchRes = await fetch(
            `${window.location.origin}/data/meta/current_patch.json?t=${Date.now()}`,
            { cache: 'no-store' }
          );
          if (localPatchRes.ok) {
            localPatchData = await localPatchRes.json();
          }
        } catch (localErr) {
          console.warn('[App] Local patch metadata fetch failed:', localErr);
        }

        let patchData = { ...localPatchData };
        let activeBaseUrl = window.location.origin;
        let isUsingRemote = false;

        // 2. Try checking remote Cloudflare Worker proxy (OTA update) — only on deployed builds
        try {
          const isLocal = (window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' || 
                          window.location.hostname.startsWith('192.168.') || 
                          window.location.hostname.endsWith('.local')) &&
                          !window.Capacitor;
          
          if (isLocal) {
            console.log('[App] Local environment detected. Skipping remote OTA fetch to use local static assets.');
          } else {
            console.log(`[App] Checking remote OTA patch metadata from: ${REMOTE_UPDATE_BASE_URL}`);
            const remotePatchRes = await fetch(
              `${REMOTE_UPDATE_BASE_URL}/data/meta/current_patch.json?t=${Date.now()}`,
              { cache: 'no-store' }
            );
            if (remotePatchRes.ok) {
              const remoteData = await remotePatchRes.json();
              if (remoteData && remoteData.current_patch) {
                // Compare data_revision (timestamp-based build number, e.g. "20260613142019")
                // Higher revision = fresher data. Fall back to last_updated_time if data_revision is missing.
                const getRevisionValue = (meta) => {
                  if (meta.data_revision) {
                    const r = String(meta.data_revision);
                    if (r.length === 14 && /^\d+$/.test(r)) {
                      const year = parseInt(r.substring(0, 4), 10);
                      const month = parseInt(r.substring(4, 6), 10);
                      const day = parseInt(r.substring(6, 8), 10);
                      const hour = parseInt(r.substring(8, 10), 10);
                      const minute = parseInt(r.substring(10, 12), 10);
                      const second = parseInt(r.substring(12, 14), 10);
                      return Date.UTC(year, month - 1, day, hour, minute, second);
                    }
                  }
                  if (meta.last_updated_time) {
                    const parsed = Date.parse(meta.last_updated_time);
                    if (!isNaN(parsed)) return parsed;
                  }
                  return 0;
                };

                const localRevVal = getRevisionValue(localPatchData);
                const remoteRevVal = getRevisionValue(remoteData);
                const localRevDisplay = localPatchData.data_revision || localPatchData.last_updated_time || "0";
                const remoteRevDisplay = remoteData.data_revision || remoteData.last_updated_time || "0";

                if (remoteRevVal > localRevVal) {
                  patchData = remoteData;
                  activeBaseUrl = REMOTE_UPDATE_BASE_URL;
                  isUsingRemote = true;
                  console.log(`[App] Remote OTA has fresher data (rev ${remoteRevDisplay} > local ${localRevDisplay}). Using remote.`);
                } else {
                  console.log(`[App] Local data is up-to-date (local rev ${localRevDisplay} >= remote ${remoteRevDisplay}). Using local.`);
                }
              }
            }
          }
        } catch (remoteErr) {
          console.warn('[App] Remote OTA patch check unavailable or offline. Defaulting to local assets.', remoteErr);
        }
        
        if (!active) return;
        setPatchMeta(patchData);
        const version = patchData.current_patch;
        const dataRevision = patchData.data_revision || patchData.last_updated_time || '';
        const revisionQuery = dataRevision ? `?rev=${encodeURIComponent(dataRevision)}` : '';
        activeDataBaseUrlRef.current = activeBaseUrl;
        activeDataRevisionRef.current = revisionQuery;

        // Track data_revision to detect when a new compilation has been published
        const localKey = `mlbb_data_revision_${version}_${lang}`;
        const prevRevision = localStorage.getItem(localKey);
        
        if (dataRevision && prevRevision !== dataRevision) {
          console.log(`[App] Detected new data revision (${dataRevision} vs prev ${prevRevision}). Resetting load state to force re-seed.`);
          await PatchRepository.setPatchLoaded(version, lang, false);
          localStorage.setItem(localKey, dataRevision);
        }

        // Fetch index.json and draft_matrix.json concurrently from active base URL
        const [indexRes, matrixRes] = await Promise.all([
          fetch(`${activeBaseUrl}/data/patches/${version}/${lang}/heroes/index.json${revisionQuery}`),
          fetch(`${activeBaseUrl}/data/patches/${version}/${lang}/draft_matrix.json${revisionQuery}`)
        ]);

        if (!indexRes.ok || !matrixRes.ok) {
          throw new Error('Index or draft matrix file fetch failed');
        }

        const indexData = await indexRes.json();
        const matrixData = await matrixRes.json();

        if (!active) return;
        setHeroes(indexData);
        setDraftMatrix(matrixData);
        setLoading(false);
        TelemetryService.log('boot_load_success', { version, lang, dataRevision, isUsingRemote });

        // 3. Asynchronously seed database in the background non-blockingly
        BackgroundSeeder.start(version, lang, indexData, activeBaseUrl, dataRevision);

      } catch (err) {

        console.warn('[App] Hook: Static assets fetch failed. Initializing PWA fallback cache:', err);

        TelemetryService.log('boot_load_failed', { error: err.message });

        

        if (!active) return;

        setHeroes(FALLBACK_ROSTER);

        setDraftMatrix(FALLBACK_MATRIX);

        setLoading(false);

      }

    };



    bootAndLoad();



    return () => {

      active = false;

    };

  }, [lang]);



  // Dynamic Roster filtering

  const filteredHeroes = useMemo(() => {
    if (!heroes) return [];
    let baseHeroes = heroes;
    if (showcaseFilter) {
      const showcaseIds = new Set(showcaseHeroes.map(h => h.id));
      baseHeroes = heroes.filter(h => showcaseIds.has(h.id));
    }
    return baseHeroes.filter(hero => {
      const matchesSearch = hero.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
                            hero.role.toLowerCase().includes(debouncedQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || hero.role === roleFilter;
      const matchesLane = laneFilter === 'All' || (hero.lane && hero.lane.toLowerCase().includes(laneFilter.toLowerCase()));
      const matchesBuffed = !showBuffedOnly || [2, 4, 9, 12, 15, 29, 43, 45, 108].includes(hero.id);
      return matchesSearch && matchesRole && matchesLane && matchesBuffed;
    });
  }, [heroes, debouncedQuery, roleFilter, laneFilter, showBuffedOnly, showcaseFilter, showcaseHeroes]);



  // Dynamic Builds list filtering

  const filteredEquipment = useMemo(() => {

    return PRO_EQUIPMENT_DATABASE.filter(item => {

      const matchesSearch = item.name.toLowerCase().includes(buildSearchQuery.toLowerCase()) ||

                            item.passive.toLowerCase().includes(buildSearchQuery.toLowerCase());

      const matchesCat = buildTabFilter === 'All' || item.category === buildTabFilter;

      return matchesSearch && matchesCat;

    });

  }, [buildTabFilter, buildSearchQuery]);



  const highestWinrateHero = useMemo(() => {

    if (!heroes || heroes.length === 0) return null;

    return [...heroes].sort((a, b) => b.win_rate - a.win_rate)[0];

  }, [heroes]);



  const highestBanrateHero = useMemo(() => {

    if (!heroes || heroes.length === 0) return null;

    return [...heroes].sort((a, b) => b.ban_rate - a.ban_rate)[0];

  }, [heroes]);



  const selectedMetaHero = useMemo(() => {

    if (!heroes || heroes.length === 0) return null;

    return heroes.find(h => String(h.id) === String(selectedMetaHeroId)) || highestWinrateHero || heroes[0];

  }, [heroes, selectedMetaHeroId, highestWinrateHero]);



  const averageWinRate = useMemo(() => {

    if (!heroes || heroes.length === 0) return 50.0;

    return heroes.reduce((acc, h) => acc + (h.win_rate || 50), 0) / heroes.length;

  }, [heroes]);



  const averageBanRate = useMemo(() => {

    if (!heroes || heroes.length === 0) return 10.0;

    return heroes.reduce((acc, h) => acc + (h.ban_rate || 0), 0) / heroes.length;

  }, [heroes]);



  const matchupSpotlight = useMemo(() => {

    if (!heroes || heroes.length === 0 || !draftMatrix) return null;

    const byId = new Map(heroes.map(hero => [Number(hero.id), hero]));

    const candidates = [];



    Object.entries(draftMatrix).forEach(([heroId, node]) => {

      const hero = byId.get(Number(heroId));

      if (!hero || !node) return;

      (node.strong_against || []).forEach(target => {

        const targetHero = byId.get(Number(target.id)) || heroes.find(h => h.name === target.name);

        if (targetHero) {

          // 1. Calculate Base Esports Score

          let score = (hero.win_rate || 50) + (hero.ban_rate || 0) * 0.18 + (targetHero.pick_rate || 0) * 0.4;



          // 2. Personalization: Role Sync (Boost matches player's active role)

          if (profileHero && hero.role === profileHero.role) {

            score += 12; // Role alignment boost

          }



          // 3. Personalization: Favorite Sync (Boost matches player's favorite list)

          if (Array.isArray(favoriteHeroes) && favoriteHeroes.includes(hero.id)) {

            score += 15; // Favorite hero alignment boost

          }



          // 4. Personalization: Preferred Roles Sync (Boost matches player's onboarding selection)

          if (Array.isArray(finalProfile.preferredRoles) && finalProfile.preferredRoles.includes(hero.role)) {

            score += 18; // Onboarding role preference alignment boost

          }



          candidates.push({

            hero,

            target: targetHero,

            reason: target.reason || `${hero.name} has a strong matchup into ${targetHero.name}.`,

            score

          });

        }

      });

    });



    if (candidates.length === 0) return null;



    // 5. Sort candidates by their personalized scores descending

    const sortedCandidates = candidates.sort((a, b) => b.score - a.score);



    // 6. Rolling Daily Rotation: Select from the top 10 candidates based on day calendar seed

    const topLimit = Math.min(10, sortedCandidates.length);

    const topCandidates = sortedCandidates.slice(0, topLimit);

    

    // Day code (local date midnight boundary)

    const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

    return topCandidates[dayOfYear % topLimit] || null;

  }, [heroes, draftMatrix, profileHero, favoriteHeroes, finalProfile]);

  const getHeroTier = (heroName) => {
    if (!heroName) return 'A';
    const dynamicHero = heroes.find(h => h.name.toLowerCase() === heroName.toLowerCase());
    if (dynamicHero && dynamicHero.tier) return dynamicHero.tier;
    const meta = HERO_META_STATS.find(m => m.name.toLowerCase() === heroName.toLowerCase());
    return meta ? meta.tier : 'A';
  };

  const getHeroTrendBadge = (heroName) => {
    if (!heroName) return null;
    const tier = getHeroTier(heroName);
    if (['S+', 'S'].includes(tier)) {
      return <span className="trend-badge priority">★ Priority</span>;
    }
    let hash = 0;
    for (let i = 0; i < heroName.length; i++) {
      hash = heroName.charCodeAt(i) + ((hash << 5) - hash);
    }
    if (Math.abs(hash) % 2 === 0) {
      return <span className="trend-badge rising">↑ Rising</span>;
    } else {
      return <span className="trend-badge falling">↓ Falling</span>;
    }
  };

  const metaLeaders = useMemo(() => {
    if (!heroes || heroes.length === 0) {
      return { highestWR: null, mostBanned: null, mostPicked: null, mostContested: null };
    }
    const highestWR = [...heroes].sort((a, b) => b.win_rate - a.win_rate)[0] || null;
    const mostBanned = [...heroes].sort((a, b) => b.ban_rate - a.ban_rate)[0] || null;
    const mostPicked = [...heroes].sort((a, b) => b.pick_rate - a.pick_rate)[0] || null;
    const mostContested = [...heroes].sort((a, b) => (b.pick_rate + b.ban_rate) - (a.pick_rate + a.ban_rate))[0] || null;
    return { highestWR, mostBanned, mostPicked, mostContested };
  }, [heroes]);

  const roleLeaders = useMemo(() => {
    if (!heroes || heroes.length === 0) return {};
    
    const roles = ['Marksman', 'Mage', 'Fighter', 'Assassin', 'Tank', 'Support'];
    const leaders = {};
    roles.forEach(role => {
      const roleHeroes = heroes.filter(h => h.role === role);
      if (roleHeroes.length > 0) {
        leaders[role] = [...roleHeroes].sort((a, b) => b.win_rate - a.win_rate)[0];
      } else {
        leaders[role] = null;
      }
    });
    return leaders;
  }, [heroes]);

  const draftIntel = useMemo(() => {
    if (!heroes || heroes.length === 0 || !draftMatrix) {
      return { counterToWatch: null, strongDuo: null, priorityPick: null };
    }
    
    const counters = [];
    heroes.forEach(h => {
      const node = draftMatrix[String(h.id)];
      if (node && node.weak_against) {
        node.weak_against.forEach(item => {
          if (item.score > 0) {
            const counterHero = heroes.find(x => x.id === item.id || (item.name && x.name.toLowerCase() === item.name.toLowerCase()));
            if (counterHero) {
              counters.push({
                counterHero,
                targetHero: h,
                score: item.score
              });
            }
          }
        });
      }
    });
    counters.sort((a, b) => b.score - a.score);
    const counterToWatch = counters[0] || null;

    const duos = [];
    heroes.forEach(h => {
      const node = draftMatrix[String(h.id)];
      if (node && node.synergy) {
        node.synergy.forEach(item => {
          if (item.score > 0) {
            const partnerHero = heroes.find(x => x.id === item.id || (item.name && x.name.toLowerCase() === item.name.toLowerCase()));
            if (partnerHero && h.id < partnerHero.id) {
              duos.push({
                heroA: h,
                heroB: partnerHero,
                score: item.score
              });
            }
          }
        });
      }
    });
    duos.sort((a, b) => b.score - a.score);
    const strongDuo = duos[0] || null;

    const priorityCandidates = heroes.map(h => {
      const meta = HERO_META_STATS.find(m => m.name.toLowerCase() === h.name.toLowerCase()) || {};
      const tier = meta.tier || 'A';
      let tierBonus = 1;
      if (tier === 'S' || tier === 'S+') tierBonus = 1.5;
      const score = (h.pick_rate * h.ban_rate) * tierBonus;
      return { hero: h, score };
    });
    priorityCandidates.sort((a, b) => b.score - a.score);
    const priorityPick = priorityCandidates[0]?.hero || heroes[0] || null;

    return { counterToWatch, strongDuo, priorityPick };
  }, [heroes, draftMatrix]);

  // Dynamic Real-data Statistics Calculations
  const dashboardStats = useMemo(() => {
    const totalHeroesCount = heroes.length;
    const metaPicksCount = heroes.filter(h => {
      const tier = getHeroTier(h.name);
      return ['S+', 'S'].includes(tier);
    }).length;

    let counterPairsCount = 0;
    let synergyDuosCount = 0;
    let matchupsProcessedCount = 0;

    Object.values(draftMatrix || {}).forEach(node => {
      if (node) {
        if (node.weak_against) {
          node.weak_against.forEach(item => {
            if (item.score > 0) counterPairsCount++;
            matchupsProcessedCount++;
          });
        }
        if (node.synergy) {
          node.synergy.forEach(item => {
            if (item.score > 0) synergyDuosCount++;
            matchupsProcessedCount++;
          });
        }
      }
    });

    // Halve synergy duos since they are double counted (A+B and B+A)
    const uniqueSynergies = Math.max(0, Math.round(synergyDuosCount / 2));

    // Calculate dynamic meta coverage percentage
    const rankedHeroes = heroes.filter(h => {
      const tier = getHeroTier(h.name);
      return ['S+', 'S', 'A', 'B'].includes(tier);
    }).length;
    const metaCoveragePercent = totalHeroesCount > 0 ? Math.round((rankedHeroes / totalHeroesCount) * 100) : 92;

    return {
      totalHeroesCount,
      metaPicksCount: metaPicksCount || 68,
      counterPairsCount: counterPairsCount || 42,
      synergyDuosCount: uniqueSynergies || 18,
      matchupsProcessedCount: matchupsProcessedCount || 420,
      metaCoveragePercent: metaCoveragePercent || 92
    };
  }, [heroes, draftMatrix]);

  const renderHomepageHeroCard = ({
    categoryTitle,
    hero,
    primaryStatText,
    onCardClick,
    onHeroClick,
    secondaryHero,
    secondaryText,
  }) => {
    if (!hero) return null;
    
    return (
      <div 
        className="meta-leader-card"
        onClick={onCardClick}
      >
        {/* Background Splash Art */}
        <div className="meta-leader-bg-art">
          <SmartImage 
            src={hero.cover_transparent || hero.cover_thumb || hero.avatar_url} 
            alt={hero.name} 
            fallbackType="hero" 
          />
        </div>

        {/* Card Content */}
        <div className="meta-leader-content">
          {/* Category Header */}
          <div className="meta-leader-category">
            <span>{categoryTitle}</span>
            {getHeroTrendBadge(hero.name)}
          </div>

          {/* Hero Portrait & Details */}
          <div 
            onClick={(e) => {
              if (onHeroClick) {
                e.stopPropagation();
                onHeroClick(hero);
              }
            }}
            className="meta-leader-hero-row"
            style={{ cursor: onHeroClick ? 'pointer' : 'default' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
              {/* Hero Portrait */}
              <div className="meta-leader-avatar-wrapper">
                <SmartImage src={hero.avatar_url} alt={hero.name} fallbackType="hero" />
              </div>
              {/* Name & Primary Stat */}
              <div className="meta-leader-text">
                <span className="meta-leader-hero-name">
                  {hero.name}
                </span>
                <span className="meta-leader-stat">
                  {primaryStatText}
                </span>
              </div>
            </div>

            {/* Optional secondary hero */}
            {secondaryHero && (
              <div className="meta-leader-secondary-wrapper">
                <span className="meta-leader-versus-label">
                  {secondaryText}
                </span>
                <div 
                  onClick={(e) => {
                    if (onHeroClick) {
                      e.stopPropagation();
                      onHeroClick(secondaryHero);
                    }
                  }}
                  className="meta-leader-avatar-wrapper"
                  style={{ borderRadius: '50%' }}
                >
                  <SmartImage src={secondaryHero.avatar_url} alt={secondaryHero.name} fallbackType="hero" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Load individual detailed profile on-demand (Split-file asynchronously with IndexedDB query first)


  const handleHeroClick = (hero) => {

    setSelectedHero(hero);

    setLastHeroViewed(hero);

    localStorage.setItem('mldraft_last_hero', JSON.stringify(hero));

    setHeroDetailTab('overview');

    setActiveSkillIndex(0);

    setGuideVideoLoaded(false);

    setVideoIframeLoading(false);

    setHeroDetailsLoading(true);

    setDetailHeroData(null);

    setMistakesExpanded(false);

    setProTipsExpanded(false);

    setModalScrollTop(0);

    setHeroImageRatio(1.0);



    const version = patchMeta.current_patch || "1.8.84";



    HeroRepository.getHeroById(hero.id)

      .then(dbHero => {

        // If the hero has full details loaded (e.g. contains skills list and is not just a base index entity)

        if (dbHero && dbHero.skills && dbHero.skills.length > 0) {

          setDetailHeroData(dbHero);

          setHeroDetailsLoading(false);

        } else {

          // Fallback read-through local assets path if background seeder has not finished yet

          fetch(
            `${activeDataBaseUrlRef.current}/data/patches/${version}/${lang}/heroes/${hero.id}.json${activeDataRevisionRef.current}`
          )

            .then(res => {

              if (!res.ok) throw new Error("Detailed card fetch unsuccessful");

              return res.json();

            })

            .then(data => {

              setDetailHeroData(data);

              setHeroDetailsLoading(false);

              // Asynchronously cache it back to IndexedDB for subsequent instant lookups

              HeroRepository.saveHero(data);

            })

            .catch(err => {

              throw err;

            });

        }

      })

      .catch(err => {

        console.warn("Detail profile load failed, executing fallback map:", err);

        const fallbackDetails = FALLBACK_HEROES.find(h => h.id === hero.id);

        if (fallbackDetails) {

          setDetailHeroData(fallbackDetails);

        } else {

          setDetailHeroData({

            id: hero.id,

            name: hero.name,

            role: hero.role,

            durability: 50, offense: 50, magic: 20, difficulty: 40,

            avatar_url: hero.avatar_url,

            cover_url: hero.cover_thumb,

            cover_transparent: hero.cover_transparent || hero.cover_thumb,

            skills: [{ name: "Hero Mastery", description: "Esports specifications details profile offline.", tips: "" }],

            builds: { items: [], tips: "No offline tips registered." },

            matchups: { synergy: { name: "", tips: "" }, counters: { name: "", tips: "" }, countered_by: { name: "", tips: "" } }

          });

        }

        setHeroDetailsLoading(false);

      });

  };



  const closeHeroDetails = () => {

    setSelectedHero(null);

    setDetailHeroData(null);

    setMistakesExpanded(false);

    setProTipsExpanded(false);

    setModalScrollTop(0);

    setHeroImageRatio(1.0);

  };



  const showErrorToast = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 2500);
  };

  const draftHeroAutomatically = (hero, laneTab) => {
    if (!hero) return;

    // Blur search input after hero selection
    searchInputRef.current?.blur();

    // Scenario 3: Prevent duplicate draft
    const isAlreadyDrafted = 
      allyDraft.some(h => h && h.id === hero.id) || 
      enemyDraft.some(h => h && h.id === hero.id);
    if (isAlreadyDrafted) {
      showErrorToast('Hero already drafted');
      return;
    }

    // Determine target index based on laneTab
    let targetIndex = -1;
    const laneKey = laneTab || activeLaneTab;

    if (laneKey === 'jungleLane') targetIndex = 0;
    else if (laneKey === 'expLane') targetIndex = 1;
    else if (laneKey === 'goldLane') targetIndex = 2;
    else if (laneKey === 'midLane') targetIndex = 3;
    else if (laneKey === 'roamLane') targetIndex = 4;
    else {
      // Fallback: match hero's lane or empty slot
      const heroLane = (hero.lane || "").toLowerCase();
      if (heroLane.includes("jung") || heroLane.includes("assas")) targetIndex = 0;
      else if (heroLane.includes("exp") || heroLane.includes("fight")) targetIndex = 1;
      else if (heroLane.includes("gold") || heroLane.includes("marks")) targetIndex = 2;
      else if (heroLane.includes("mid") || heroLane.includes("mage")) targetIndex = 3;
      else if (heroLane.includes("roam") || heroLane.includes("supp") || heroLane.includes("tank")) targetIndex = 4;
      else {
        targetIndex = allyDraft.indexOf(null);
        if (targetIndex === -1) targetIndex = 0;
      }
    }

    if (targetIndex >= 0 && targetIndex < 5) {
      const existingHero = allyDraft[targetIndex];
      if (existingHero !== null) {
        // Scenario 2: Target lane occupied -> Show confirmation dialog
        setReplaceConfirmation({
          targetHero: existingHero,
          newHero: hero,
          targetIndex: targetIndex
        });
      } else {
        // Scenario 1: Target lane empty -> Pick directly
        const newDraft = [...allyDraft];
        newDraft[targetIndex] = hero;
        setAllyDraft(newDraft);
        setRecentPicks(prev => {
          const filtered = prev.filter(id => id !== hero.id);
          return [hero.id, ...filtered].slice(0, 5);
        });
        
        // Auto-advance active tab
        const nextIndex = newDraft.indexOf(null);
        if (nextIndex !== -1) {
          setActiveLaneTab(indexToLaneKey[nextIndex]);
        }
      }
    }
  };

  const selectHeroForActiveSlot = (hero) => {
    if (!hero) return;
    
    // Blur search input after hero selection
    searchInputRef.current?.blur();
    
    // Ensure the hero is not already drafted on either team
    const isAlreadyDrafted = 
      allyDraft.some(h => h && h.id === hero.id) || 
      enemyDraft.some(h => h && h.id === hero.id);
    if (isAlreadyDrafted) return;

    if (activeDraftSlot.team === 'ally') {
      const newDraft = [...allyDraft];
      newDraft[activeDraftSlot.index] = hero;
      setAllyDraft(newDraft);
      setRecentPicks(prev => {
        const filtered = prev.filter(id => id !== hero.id);
        return [hero.id, ...filtered].slice(0, 5);
      });
      
      // Auto-advance active slot to next empty slot on either ally or enemy
      const nextIndex = newDraft.indexOf(null);
      if (nextIndex !== -1) {
        setActiveDraftSlot({ team: 'ally', index: nextIndex });
        setActiveLaneTab(indexToLaneKey[nextIndex]);
      } else {
        const nextEnemyIndex = enemyDraft.indexOf(null);
        if (nextEnemyIndex !== -1) {
          setActiveDraftSlot({ team: 'enemy', index: nextEnemyIndex });
        }
      }
    } else {
      const newDraft = [...enemyDraft];
      newDraft[activeDraftSlot.index] = hero;
      setEnemyDraft(newDraft);
      setRecentPicks(prev => {
        const filtered = prev.filter(id => id !== hero.id);
        return [hero.id, ...filtered].slice(0, 5);
      });
      
      // Auto-advance active slot
      const nextIndex = newDraft.indexOf(null);
      if (nextIndex !== -1) {
        setActiveDraftSlot({ team: 'enemy', index: nextIndex });
      } else {
        const nextAllyIndex = allyDraft.indexOf(null);
        if (nextAllyIndex !== -1) {
          setActiveDraftSlot({ team: 'ally', index: nextAllyIndex });
          setActiveLaneTab(indexToLaneKey[nextAllyIndex]);
        }
      }
    }
  };

  const removeHeroFromSlot = (team, index) => {
    if (team === 'ally') {
      const newDraft = [...allyDraft];
      newDraft[index] = null;
      setAllyDraft(newDraft);
      setActiveDraftSlot({ team: 'ally', index });
      setActiveLaneTab(indexToLaneKey[index]);
    } else {
      const newDraft = [...enemyDraft];
      newDraft[index] = null;
      setEnemyDraft(newDraft);
      setActiveDraftSlot({ team: 'enemy', index });
    }
  };

  const clearAllDrafts = () => {
    setAllyDraft([null, null, null, null, null]);
    setEnemyDraft([null, null, null, null, null]);
    setActiveDraftSlot({ team: 'enemy', index: 0 });
    setActiveLaneTab('overall');
  };

  const toggleActiveTeam = () => {
    setActiveDraftSlot(prev => {
      const newTeam = prev.team === 'ally' ? 'enemy' : 'ally';
      if (newTeam === 'ally') {
        setActiveLaneTab(indexToLaneKey[prev.index]);
      }
      return {
        team: newTeam,
        index: prev.index
      };
    });
  };



  // Advanced client-side draft counter logic utilizing reciprocal GMS index sequence matching
  const draftRecommendations = useMemo(() => {
    if (!heroes || heroes.length === 0) {
      return { overall: [], goldLane: [], midLane: [], roamLane: [], jungleLane: [], expLane: [] };
    }
    const engine = new DraftEngine(heroes, draftMatrix);
    
    const overall = engine.getRecommendations(allyDraft, enemyDraft, "Any");
    const goldLane = engine.getRecommendations(allyDraft, enemyDraft, "Gold");
    const midLane = engine.getRecommendations(allyDraft, enemyDraft, "Mid");
    const roamLane = engine.getRecommendations(allyDraft, enemyDraft, "Roam");
    const jungleLane = engine.getRecommendations(allyDraft, enemyDraft, "Jungle");
    const expLane = engine.getRecommendations(allyDraft, enemyDraft, "EXP");
    
    const sliceTop = (list) => list.slice(0, 10);

    return {
      overall: sliceTop(overall),
      goldLane: sliceTop(goldLane),
      midLane: sliceTop(midLane),
      roamLane: sliceTop(roamLane),
      jungleLane: sliceTop(jungleLane),
      expLane: sliceTop(expLane)
    };
  }, [allyDraft, enemyDraft, heroes, draftMatrix]);

  // Auto-preview first recommended hero when slot or lane filter changes
  useEffect(() => {
    const list = draftRecommendations[activeLaneTab] || [];
    if (list.length > 0) {
      setPreviewRecomHero(list[0].hero);
    } else {
      setPreviewRecomHero(null);
    }
  }, [activeLaneTab, activeStrategyTab, activeDraftSlot, draftRecommendations]);

  // Unified click handler for draft slots that opens picker sheet and autofocuses keyboard
  const handleSlotClick = (team, index) => {
    searchInputRef.current?.blur();
    setActiveDraftSlot({ team, index });
    if (team === 'ally') {
      setActiveLaneTab(indexToLaneKey[index]);
    }
    setPickerExpanded(true);
  };

  const handleSuggestionTagClick = (heroName) => {
    if (!heroes || heroes.length === 0) return;
    const found = heroes.find(h => h.name.toLowerCase() === heroName.toLowerCase());
    if (found) {
      setPreviewRecomHero(found);
    }
  };



  const str = (val) => {

    return val !== undefined && val !== null ? String(val) : "";

  };



  const LANGUAGES_LIST = [
    { code: 'en', label: 'English' },
    { code: 'id', label: 'Indonesian (Coming Soon)', disabled: true }
  ];



  // Render Onboarding Welcome Flow if incomplete

  if (!onboardingComplete) {

    return (

      <div className="onboarding-container animate-fadeIn" style={{ minHeight: '100vh', background: '#090d16', color: '#ffffff', fontFamily: 'Inter, sans-serif', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflowX: 'hidden' }}>

        {/* Glow ambient background effects */}

        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(0,0,0,0) 70%)', zIndex: 1, pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, rgba(0,0,0,0) 70%)', zIndex: 1, pointerEvents: 'none' }} />



        <div className="card glass border-l-4" style={{ width: '100%', maxWidth: '440px', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>

          {/* Header */}

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>

              <img src="/logo.png" alt="MythicIQ Logo" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />

              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '1px', margin: 0 }}>Mythic<span style={{ fontWeight: 300, color: 'var(--accent-blue)' }}>IQ</span></h2>

            </div>

            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent-gold)', letterSpacing: '2px', textTransform: 'uppercase' }}>Initialize Tactical Profiling</span>

            

            {/* Step progress dots */}

            <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.65rem' }}>

              {[1, 2, 3, 4].map(step => (

                <div key={step} style={{ width: onboardingStep === step ? '20px' : '6px', height: '6px', borderRadius: '3px', background: onboardingStep === step ? 'var(--accent-blue)' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s ease' }} />

              ))}

            </div>

          </div>



          {/* STEP 1: ENTER USERNAME */}

          {onboardingStep === 1 && (

            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="profile-edit-section">

                <label className="profile-edit-label" style={{ marginBottom: '0.5rem', fontSize: '0.72rem' }}>Choose Local Display Nickname</label>

                <input 
                  id="local-profile-nickname-input"
                  name="nickname"
                  autocomplete="off"
                  type="text" 
                  placeholder="Enter nickname (e.g. Legend, Slayer)"
                  value={onboardProfile.username} 
                  onChange={(e) => setOnboardProfile({...onboardProfile, username: e.target.value})}
                  className="profile-edit-input"
                  style={{ 
                    fontSize: '0.82rem', 
                    padding: '0.75rem', 
                    borderRadius: '10px',
                    color: '#ffffff',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                />

                <p style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.3 }}>
                  This display name is stored locally on your device for offline personalization. No account sign-in or online connection is required.
                </p>

              </div>

              <button 

                onClick={() => {

                  if (!onboardProfile.username.trim()) {

                    alert("Please enter a nickname to continue!");

                    return;

                  }

                  setOnboardingStep(2);

                }}

                className="btn btn-primary"

                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', fontWeight: 800 }}

              >

                Next: Select Division Crest

              </button>

            </div>

          )}



          {/* STEP 2: CHOOSE DIVISION CREST */}

          {onboardingStep === 2 && (

            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="profile-edit-section">

                <label className="profile-edit-label" style={{ marginBottom: '0.5rem', fontSize: '0.72rem' }}>Select Current Rank Badge</label>

                <div className="badge-selector-row" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem', gap: '0.45rem' }}>

                  {RANK_TIERS.map((tier, idx) => (

                    <button

                      key={idx}

                      type="button"

                      onClick={() => setOnboardProfile({...onboardProfile, badgeIndex: idx})}

                      className={`badge-select-btn ${onboardProfile.badgeIndex === idx ? 'active' : ''}`}

                      style={{ padding: '0.5rem 0.75rem', borderRadius: '10px' }}

                    >

                      <SmartImage src={tier.icon} alt="badge" className="badge-select-img" fallbackType="item" style={{ width: '28px', height: '28px' }} />

                      <span className="badge-select-lbl" style={{ fontSize: '0.72rem' }}>{tier.name}</span>

                    </button>

                  ))}

                </div>

              </div>

              

              <div style={{ display: 'flex', gap: '0.5rem' }}>

                <button 

                  type="button"

                  onClick={() => setOnboardingStep(1)}

                  className="btn btn-secondary"

                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: 800 }}

                >

                  Back

                </button>

                <button 

                  type="button"

                  onClick={() => setOnboardingStep(3)}

                  className="btn btn-primary"

                  style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', fontWeight: 800 }}

                >

                  Next: Choose Main Hero

                </button>

              </div>

            </div>

          )}



          {/* STEP 3: CHOOSE PROFILE AVATAR (HERO) */}

          {onboardingStep === 3 && (

            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="profile-edit-section">

                <label className="profile-edit-label" style={{ marginBottom: '0.5rem', fontSize: '0.72rem' }}>Select Main Hero Avatar</label>

                

                {/* Search Bar */}

                <div className="input-field-wrapper" style={{ marginBottom: '0.65rem', position: 'relative' }}>

                  <Search className="input-field-icon" size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />

                  <input 

                    type="text" 

                    placeholder="Search main hero..." 

                    value={onboardSearchQuery} 

                    onChange={(e) => setOnboardSearchQuery(e.target.value)}

                    className="profile-edit-input"

                    style={{ fontSize: '0.72rem', padding: '0.5rem 0.75rem 0.5rem 2rem', width: '100%' }}

                  />

                </div>



                {/* Role Tabs */}

                <div className="picker-role-tabs" style={{ gap: '0.25rem', marginBottom: '0.65rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>

                  {['All', 'Marksman', 'Assassin', 'Fighter', 'Mage', 'Tank', 'Support'].map(role => (

                    <button

                      key={role}

                      type="button"

                      onClick={() => setOnboardRoleFilter(role)}

                      className={`picker-tab-btn ${onboardRoleFilter === role ? 'active' : ''}`}

                      style={{ fontSize: '0.55rem', padding: '0.25rem 0.5rem', borderRadius: '20px' }}

                    >

                      {role}

                    </button>

                  ))}

                </div>



                {/* Hero Grid */}

                <div className="picker-hero-grid" style={{ maxHeight: '200px', overflowY: 'auto', gap: '0.45rem', paddingRight: '0.25rem' }}>

                  {heroes.filter(h => (onboardRoleFilter === 'All' || h.role === onboardRoleFilter) && h.name.toLowerCase().includes(onboardSearchQuery.toLowerCase())).map(hero => (

                    <button

                      key={hero.id}

                      type="button"

                      onClick={() => setOnboardProfile({...onboardProfile, profileHeroId: hero.id})}

                      className={`picker-grid-card ${onboardProfile.profileHeroId === hero.id ? 'active' : ''}`}

                      style={{ padding: '0.35rem 0.5rem', borderRadius: '10px' }}

                    >

                      <div className="picker-card-avatar-wrapper" style={{ width: '22px', height: '22px' }}>

                        <SmartImage src={hero.avatar_url} alt={hero.name} className="picker-card-avatar" fallbackType="hero" />

                      </div>

                      <span className="picker-card-name" style={{ fontSize: '0.62rem' }}>{hero.name}</span>

                    </button>

                  ))}

                </div>

              </div>



              <div style={{ display: 'flex', gap: '0.5rem' }}>

                <button 

                  type="button"

                  onClick={() => setOnboardingStep(2)}

                  className="btn btn-secondary"

                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: 800 }}

                >

                  Back

                </button>

                <button 

                  type="button"

                  onClick={() => setOnboardingStep(4)}

                  className="btn btn-primary"

                  style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', fontWeight: 800 }}

                >

                  Next: Preferred Roles

                </button>

              </div>

            </div>

          )}



          {/* STEP 4: PREFERRED ROLES MULTI-SELECT */}

          {onboardingStep === 4 && (

            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="profile-edit-section">

                <label className="profile-edit-label" style={{ marginBottom: '0.25rem', fontSize: '0.72rem' }}>Select Preferred Draft Roles</label>

                <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', lineHeight: 1.35 }}>

                  We will prioritize Matchup Spotlights and draft counters aligned with these selections!

                </p>

                

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>

                  {['Marksman', 'Assassin', 'Fighter', 'Mage', 'Tank', 'Support'].map(role => {

                    const isSelected = onboardProfile.preferredRoles.includes(role);

                    return (

                      <button

                        key={role}

                        type="button"

                        onClick={() => {

                          const roles = isSelected 

                            ? onboardProfile.preferredRoles.filter(r => r !== role)

                            : [...onboardProfile.preferredRoles, role];

                          setOnboardProfile({...onboardProfile, preferredRoles: roles});

                        }}

                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}

                        style={{ padding: '0.6rem 0.75rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', border: isSelected ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}

                      >

                        {role}

                      </button>

                    );

                  })}

                </div>

              </div>



              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>

                <button 

                  type="button"

                  onClick={() => setOnboardingStep(3)}

                  className="btn btn-secondary"

                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: 800 }}

                >

                  Back

                </button>

                <button 

                  type="button"

                  onClick={() => {

                    const profileData = {

                      username: onboardProfile.username || "Legend",

                      rank: RANK_TIERS[onboardProfile.badgeIndex].name,

                      stars: onboardProfile.badgeIndex >= 6 ? 25 : 0, 

                      badgeIndex: onboardProfile.badgeIndex,

                      profileHeroId: onboardProfile.profileHeroId,

                      bannerHeroId: onboardProfile.profileHeroId,

                      preferredRoles: onboardProfile.preferredRoles

                    };

                    setPlayerProfile(profileData);

                    localStorage.setItem('mldraft_player_profile', JSON.stringify(profileData));

                    localStorage.setItem('mldraft_onboarding_complete', 'true');

                    setOnboardingComplete(true);

                  }}

                  className="btn btn-accent"

                  style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', fontWeight: 900, background: 'var(--accent-gold)', color: '#000000', border: 'none', boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}

                >

                  Enter Land of Dawn <Swords size={14} style={{ display: 'inline-block' }} />

                </button>

              </div>

            </div>

          )}

        </div>

      </div>

    );

  }



  return (

    <div className="min-h-screen pb-24 flex flex-col justify-between" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {showSplash && (
        <div className={`splash-screen-overlay ${fadeOutSplash ? 'fade-out' : ''}`}>
          <div className="splash-video-container">
            <video
              ref={splashVideoRef}
              src="/logo_intro.mp4"
              autoPlay
              muted
              playsInline
              preload="auto"
              poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              loop={!isFirstTimeUser}
              onEnded={() => {
                if (isFirstTimeUser) {
                  setVideoFinished(true);
                }
              }}
              className="splash-video"
              style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'transparent' }}
            />
          </div>
          <div className="splash-text-container">
            <RefreshCw className="animate-spin splash-spinner" size={16} />
            <span className="splash-loading-text">MythicIQ is Loading...</span>
          </div>
        </div>
      )}

      {/* App Content Wrapper: completely hidden while splash is active to prevent pre-load visual flickering */}
      <div style={showSplash ? { display: 'none' } : { display: 'flex', flexDirection: 'column', minHeight: '100vh', flex: 1 }}>

      

      {/* Global Header Bar */}

      <header className="app-header">

        <button 

          onClick={() => setShowProfileEdit(true)}

          className="header-action-btn"

          aria-label="Menu"

        >

          <Menu size={20} />

        </button>



        <div className="logo-container" onClick={() => setActiveTab('home')}>

          <img src="/logo.png" alt="MythicIQ Logo" style={{ width: '22px', height: '22px', marginRight: '0.45rem', objectFit: 'contain' }} />

          <h1 className="logo-text-bold">

            Mythic<span className="logo-text-light">IQ</span>

          </h1>

        </div>



        <div style={{ display: 'flex', gap: '0.95rem', alignItems: 'center' }}>

          <button 

            onClick={() => setActiveTab('heroes')} 

            className="header-action-btn"

            aria-label="Search"

          >

            <Search size={20} />

          </button>

          <button 

            className="header-action-btn"

            aria-label="Toggle Theme"

            onClick={() => {
              const currentTheme = document.documentElement.getAttribute('data-theme');
              setTheme(currentTheme === 'dark' ? 'light' : 'dark');
            }}

          >

            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}

          </button>

        </div>

      </header>



      {/* Main Containers */}

      <main className={`main-container ${activeTab === 'assistant' ? 'draft-assistant-active' : ''}`} style={{ flex: '1 0 auto' }}>

        

        {/* Loading Spinner */}

        {loading && (

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', color: 'var(--accent-blue)', gap: '0.5rem' }}>

            <RefreshCw className="animate-spin" size={18} />

            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Caching Static Patches...</span>

          </div>

        )}



        {/* TAB 1: ESPORTS DASHBOARD */}

        {!loading && activeTab === 'home' && (

          <div className="animate-fadeIn premium-showcase-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.2rem 0' }}>

            {/* 1. Welcome Legend Profile Banner */}
            <div className="profile-header-card" onClick={() => setShowProfileEdit(true)} style={{ position: 'relative', overflow: 'visible' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', zIndex: 10 }}>
                <div className="profile-header-left">
                  <div className="profile-header-avatar-wrapper">
                    <SmartImage 
                      src={profileHero.avatar_url} 
                      alt="Player Avatar" 
                      className="profile-header-avatar"
                      style={{ borderColor: RANK_TIERS[finalProfile.badgeIndex].color }}
                      fallbackType="hero"
                    />
                    <div className="profile-header-badge-icon">
                      <SmartImage 
                        src={RANK_TIERS[finalProfile.badgeIndex].icon} 
                        alt="Rank Crest" 
                        fallbackType="item" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                  <div className="profile-header-info">
                    <span className="profile-header-welcome">Welcome back,</span>
                    <h2 className="profile-header-name" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                      {finalProfile.username}!
                    </h2>
                    <div className="profile-header-rank-row">
                      <span className="profile-header-rank-badge" style={{ color: RANK_TIERS[finalProfile.badgeIndex].color }}>
                        <SmartImage src={RANK_TIERS[finalProfile.badgeIndex].icon} alt="badge" fallbackType="item" style={{ width: '12px', height: '12px', display: 'inline-block' }} />
                        {finalProfile.rank}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  className="profile-header-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileEdit(true);
                  }}
                  style={{ zIndex: 15 }}
                  aria-label="Edit Profile"
                >
                  <Edit2 size={13} />
                </button>
              </div>

              <div className="profile-header-bg-art" style={{ zIndex: 3, pointerEvents: 'none' }}>
                <img 
                  src={bannerHero?.id ? `/assets/banners/hero_${bannerHero.id}_transparent.webp?v=3` : (bannerHero?.cover_transparent && bannerHero.cover_transparent.includes('_transparent.webp') ? `${bannerHero.cover_transparent}?v=3` : (bannerHero?.cover_transparent || bannerHero?.cover_thumb || bannerHero?.avatar_url))} 
                  alt="Hero Character" 
                  onError={(e) => {
                    e.target.src = bannerHero?.avatar_url || '';
                  }}
                />
              </div>
            </div>

            {/* META SPOTLIGHT — Most Banned / Highest Win / Most Picked */}
            {metaSpotlightHeroes.banned && (
              <div className="meta-spotlight-section">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Flame size={16} style={{ color: '#D4AF37' }} />
                    <span className="premium-section-title" style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-primary, #F8FAFC)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Meta Spotlight
                    </span>
                  </div>
                  <span style={{ fontSize: '0.58rem', color: 'var(--text-muted, #94A3B8)', fontWeight: 500, paddingLeft: '1.35rem' }}>
                    Epic and above · 7-Day
                  </span>
                </div>

                {/* Tab Pills */}
                <div className="meta-spotlight-tabs">
                  {[
                    { key: 'banned', label: 'Most Banned', icon: <ShieldAlert size={13} /> },
                    { key: 'winRate', label: 'Highest Win', icon: <Trophy size={13} /> },
                    { key: 'picked', label: 'Most Picked', icon: <TrendingUp size={13} /> },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      className={`meta-spotlight-tab-btn ${metaSpotlightTab === tab.key ? 'active' : ''}`}
                      onClick={() => setMetaSpotlightTab(tab.key)}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Bento Card Grid */}
                {(() => {
                  const spotlightHero = metaSpotlightHeroes[metaSpotlightTab];
                  if (!spotlightHero) return null;

                  const statLabel = metaSpotlightTab === 'banned' ? 'Ban Rate'
                    : metaSpotlightTab === 'winRate' ? 'Win Rate' : 'Pick Rate';
                  const statValue = metaSpotlightTab === 'banned' ? spotlightHero.ban_rate
                    : metaSpotlightTab === 'winRate' ? spotlightHero.win_rate : spotlightHero.pick_rate;
                  const statColor = metaSpotlightTab === 'banned' ? '#EF4444'
                    : metaSpotlightTab === 'winRate' ? '#10B981' : '#3B82F6';

                  const bannerUrl = spotlightHero.id
                    ? `/assets/paintings/hero_${spotlightHero.id}.webp?v=3`
                    : (spotlightHero.cover_thumb || spotlightHero.avatar_url);

                  const isTransparent = bannerUrl.toLowerCase().includes('transparent') || 
                                        bannerUrl.toLowerCase().includes('avatar') || 
                                        bannerUrl.toLowerCase().includes('thumb') ||
                                        (spotlightHero.cover_transparent && spotlightHero.cover_transparent.includes('_transparent.webp'));

                  return (
                    <div className="meta-spotlight-bento" key={metaSpotlightTab}>

                      {/* Main Hero Banner Card (top, wide) */}
                      <div
                        className="meta-bento-main"
                        onClick={() => handleHeroClick(spotlightHero)}
                      >
                        <div className="meta-bento-main-img-wrapper">
                          <img
                            src={bannerUrl}
                            alt={spotlightHero.name}
                            className={`meta-bento-main-img ${isTransparent ? 'is-transparent' : ''}`}
                            onError={(e) => {
                              e.target.src = spotlightHero.cover_thumb || spotlightHero.avatar_url || '';
                            }}
                          />
                          <div className="meta-bento-main-overlay" />
                        </div>
                        <div className="meta-bento-main-info">
                          <span className="meta-bento-role-pill" style={{ background: `${statColor}22`, color: statColor, borderColor: `${statColor}44` }}>
                            {spotlightHero.role}
                          </span>
                          <h3 className="meta-bento-hero-name">{spotlightHero.name}</h3>
                          <p className="meta-bento-hero-subtitle">{getHeroNickname(spotlightHero)}</p>
                        </div>
                      </div>

                      {/* Bottom Row — Two Stat Cards */}
                      <div className="meta-bento-bottom-row">
                        {/* Stat Highlight Card */}
                        <div className="meta-bento-stat-card" style={{ '--accent': statColor }}>
                          <div className="meta-bento-stat-card-inner">
                            <SmartImage
                              src={spotlightHero.avatar_url}
                              alt={spotlightHero.name}
                              className="meta-bento-stat-avatar"
                              fallbackType="hero"
                            />
                            <div className="meta-bento-stat-text">
                              <span className="meta-bento-stat-value" style={{ color: statColor }}>
                                {statValue?.toFixed(1)}%
                              </span>
                              <span className="meta-bento-stat-label">{statLabel}</span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Stats Card */}
                        <div className="meta-bento-extra-card">
                          <div className="meta-bento-extra-stats">
                            <div className="meta-bento-extra-stat-item">
                              <span className="meta-bento-extra-val" style={{ color: '#10B981' }}>{spotlightHero.win_rate?.toFixed(1)}%</span>
                              <span className="meta-bento-extra-lbl">Win</span>
                            </div>
                            <div className="meta-bento-extra-divider" />
                            <div className="meta-bento-extra-stat-item">
                              <span className="meta-bento-extra-val" style={{ color: '#3B82F6' }}>{spotlightHero.pick_rate?.toFixed(1)}%</span>
                              <span className="meta-bento-extra-lbl">Pick</span>
                            </div>
                            <div className="meta-bento-extra-divider" />
                            <div className="meta-bento-extra-stat-item">
                              <span className="meta-bento-extra-val" style={{ color: '#EF4444' }}>{spotlightHero.ban_rate?.toFixed(1)}%</span>
                              <span className="meta-bento-extra-lbl">Ban</span>
                            </div>
                          </div>
                          <button
                            className="meta-bento-view-btn"
                            onClick={() => handleHeroClick(spotlightHero)}
                          >
                            View Guide <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {showcaseHeroes && showcaseHeroes.length > 0 && (() => {
              const activeHero = showcaseHeroes[showcaseIndex] || showcaseHeroes[0] || (FALLBACK_ROSTER && FALLBACK_ROSTER[0]) || {};
              const leftIndex = (showcaseIndex - 1 + showcaseHeroes.length) % showcaseHeroes.length;
              const rightIndex = (showcaseIndex + 1) % showcaseHeroes.length;
              
              const leftHero = showcaseHeroes[leftIndex] || activeHero;
              const rightHero = showcaseHeroes[rightIndex] || activeHero;

              const isTransparent = activeHero?.cover_transparent && activeHero.cover_transparent.includes('_transparent.webp');
              const rawRenderUrl = activeHero?.transparentImage || activeHero?.renderImage || (isTransparent ? activeHero.cover_transparent : '') || (activeHero?.id ? `/assets/paintings/hero_${activeHero.id}.webp` : '') || activeHero?.cover_transparent || activeHero?.image || activeHero?.cover_thumb;
              const heroRenderUrl = rawRenderUrl ? (rawRenderUrl.includes('?') ? `${rawRenderUrl}&v=3` : `${rawRenderUrl}?v=3`) : rawRenderUrl;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'visible' }}>
                  
                  {/* Section Header */}
                  <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Gamepad2 size={16} style={{ color: '#D4AF37' }} />
                        <span className="premium-section-title" style={{ fontSize: '0.75rem', fontWeight: 900, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Featured Hero Showcase
                        </span>
                      </div>
                      <span style={{ fontSize: '0.58rem', color: 'var(--text-muted, #94A3B8)', fontWeight: 500, paddingLeft: '1.35rem' }}>
                        Epic and above · 7-Day
                      </span>
                    </div>
                    <span 
                      className="view-all-link" 
                      onClick={() => { 
                        setRoleFilter('All'); 
                        setLaneFilter('All');
                        setShowBuffedOnly(false);
                        setSearchQuery(''); 
                        setShowcaseFilter(true);
                        setActiveTab('heroes'); 
                      }}
                      style={{ fontSize: '0.62rem', fontWeight: 700, color: '#D4AF37', cursor: 'pointer' }}
                    >
                      View All Heroes →
                    </span>
                  </div>

                  {/* Hero Avatar Selector Strip */}
                  <div className="avatar-selector-glass-container">
                    <div className="avatar-selector-track" ref={avatarTrackRef}>
                      {showcaseHeroes.map((hero, idx) => {
                        const isSelected = idx === showcaseIndex;
                        return (
                          <div
                            key={hero.id}
                            ref={el => avatarRefs.current[idx] = el}
                            className={`avatar-selector-item ${isSelected ? 'active' : ''}`}
                            onClick={() => setShowcaseIndex(idx)}
                          >
                            <SmartImage 
                              src={hero?.avatar_url || ''} 
                              alt={hero?.name || ''} 
                              className="avatar-selector-img"
                              fallbackType="hero"
                            />
                            {isSelected && <div className="active-item-gold-glow" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Carousel Container - 3 Card Layout */}
                  <div 
                    className="showcase-carousel-wrapper"
                    onTouchStart={(e) => {
                      handleDragStart(e.touches[0].clientX);
                    }}
                    onTouchMove={(e) => {
                      if (isSwipingRef.current && Math.abs(touchOffsetRef.current) > 10) {
                        e.preventDefault(); // prevent page scroll during horizontal swipe
                      }
                      handleDragMove(e.touches[0].clientX);
                    }}
                    onTouchEnd={handleDragEnd}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      handleDragStart(e.clientX);
                    }}
                    onMouseMove={(e) => {
                      handleDragMove(e.clientX);
                    }}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={() => {
                      if (isSwipingRef.current) handleDragEnd();
                    }}
                    style={{ touchAction: 'pan-y', cursor: isSwipingRef.current ? 'grabbing' : 'grab' }}
                  >
                    <div className="showcase-carousel-track">
                      
                      {showcaseHeroes.map((hero, idx) => {
                        let offset = idx - showcaseIndex;
                        const len = showcaseHeroes.length;
                        if (offset > len / 2) offset -= len;
                        if (offset < -len / 2) offset += len;

                        // Only render visible/adjacent slides in the DOM for efficiency
                        if (Math.abs(offset) > 2) return null;

                        const isActive = offset === 0;
                        const isLeft = offset === -1;
                        const isRight = offset === 1;

                        let slideClass = "showcase-slide";
                        if (isActive) slideClass += " active";
                        else if (isLeft) slideClass += " left";
                        else if (isRight) slideClass += " right";
                        else slideClass += " hidden";

                        const isTransparent = hero?.cover_transparent && hero.cover_transparent.includes('_transparent.webp');
                        const rawRenderUrl = hero?.transparentImage || hero?.renderImage || (isTransparent ? hero.cover_transparent : '') || (hero?.id ? `/assets/paintings/hero_${hero.id}.webp` : '') || hero?.cover_transparent || hero?.image || hero?.cover_thumb;
                        const heroRenderUrl = rawRenderUrl ? (rawRenderUrl.includes('?') ? `${rawRenderUrl}&v=3` : `${rawRenderUrl}?v=3`) : rawRenderUrl;

                        let translateX = offset * 150;
                        let translateY = isActive ? 0 : 20;
                        let scale = isActive ? 1 : 0.75;
                        let opacity = isActive ? 1 : (Math.abs(offset) === 1 ? 0.7 : 0);
                        let zIndex = isActive ? 10 : (Math.abs(offset) === 1 ? 5 : 1);

                        const slideStyle = {
                          position: 'absolute',
                          left: '50%',
                          bottom: '0',
                          width: isActive ? '220px' : '140px',
                          marginLeft: isActive ? '-110px' : '-70px',
                          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                          opacity: opacity,
                          zIndex: zIndex,
                          pointerEvents: (isActive || isLeft || isRight) ? 'auto' : 'none',
                          willChange: 'transform, opacity',
                          transition: isSwipingRef.current ? 'none' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease, width 0.4s ease, margin-left 0.4s ease',
                        };

                        return (
                          <div 
                            key={hero.id}
                            ref={el => slideRefs.current[idx] = el}
                            style={slideStyle}
                            className={slideClass}
                            onClick={(e) => {
                              if (dragMoved.current) {
                                e.preventDefault();
                                return;
                              }
                              if (isLeft) setShowcaseIndex(idx);
                              if (isRight) setShowcaseIndex(idx);
                            }}
                          >
                            {isActive ? (
                              <>
                                <div className="slide-hero-art-wrapper center">
                                  <img 
                                    src={heroRenderUrl}
                                    alt={hero?.name || ''}
                                    className="slide-hero-art active-art animate-float"
                                    onError={(e) => {
                                      e.target.src = hero?.avatar_url || '';
                                      e.target.style.width = '100px';
                                      e.target.style.height = '100px';
                                      e.target.style.borderRadius = '50%';
                                    }}
                                  />
                                </div>
                                <div className="slide-card active-card">
                                  <div className="active-card-content">
                                    <div>
                                      <div className="showcase-badges-row">
                                        <span className="showcase-role-badge">{hero?.role || ''}</span>
                                        {getHeroSpecialties(hero).slice(1, 2).map((spec, sIdx) => (
                                          <span key={sIdx} className="showcase-spec-badge">{spec}</span>
                                        ))}
                                      </div>
                                      <h2 className="showcase-hero-name">
                                        {hero?.name || ''}
                                      </h2>
                                    </div>

                                    <p className="showcase-description">
                                      {getHeroLore(hero)}
                                    </p>

                                    <div className="showcase-metrics">
                                      <div className="showcase-metric-box">
                                        <span className="showcase-metric-val wr">{hero?.win_rate?.toFixed(1) || '0.0'}%</span>
                                        <span className="showcase-metric-lbl">Win Rate</span>
                                      </div>
                                      <div className="showcase-metric-box">
                                        <span className="showcase-metric-val">{hero?.pick_rate?.toFixed(1) || '0.0'}%</span>
                                        <span className="showcase-metric-lbl">Pick Rate</span>
                                      </div>
                                      <div className="showcase-metric-box">
                                        <span className="showcase-metric-val">{hero?.ban_rate?.toFixed(1) || '0.0'}%</span>
                                        <span className="showcase-metric-lbl">Ban Rate</span>
                                      </div>
                                    </div>

                                    <button 
                                      className="showcase-guide-btn"
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onTouchStart={(e) => e.stopPropagation()}
                                      onClick={(e) => {
                                        if (dragMoved.current) {
                                          e.preventDefault();
                                          return;
                                        }
                                        handleHeroClick(hero);
                                      }}
                                    >
                                      <span>VIEW GUIDE</span>
                                      <ChevronRight size={14} style={{ color: '#D4AF37' }} />
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="slide-hero-art-wrapper">
                                  <img 
                                    src={hero?.id ? `/assets/paintings/hero_${hero.id}.webp?v=3` : ''}
                                    alt={hero?.name || ''}
                                    className="slide-hero-art"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                                <div className="slide-card">
                                  <div className="slide-card-info">
                                    <h3 className="slide-card-name">{hero?.name || ''}</h3>
                                    <span className="slide-card-role">/ {hero?.role || ''}</span>
                                  </div>
                                  <p className="slide-card-lore">{getHeroLore(hero)}</p>
                                  <span className="slide-card-link">LEARN MORE →</span>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}

                      {/* Chevron Navigation Arrows */}
                      <button 
                        className="showcase-nav-btn prev" 
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setShowcaseIndex(leftIndex); }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button 
                        className="showcase-nav-btn next" 
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setShowcaseIndex(rightIndex); }}
                      >
                        <ChevronRight size={18} />
                      </button>

                    </div>
                  </div>

                  {/* Pagination Indicators and Progress Bar */}
                  <div className="showcase-indicators-row">
                    <div className="progress-bar-track">
                      <div 
                        className="progress-bar-fill"
                        style={{ width: `${((showcaseIndex + 1) / showcaseHeroes.length) * 100}%` }}
                      />
                    </div>
                    <span className="showcase-counter-lbl">
                      {String(showcaseIndex + 1).padStart(2, '0')} / {String(showcaseHeroes.length).padStart(2, '0')}
                    </span>
                  </div>

                </div>
              );
            })()}

            {/* 4. Role Leaders — Redesigned with Banner Cards */}
            {(() => {
              const roleTabList = [
                { key: 'Marksman', icon: <MarksmanIcon />, color: '#D4AF37', banner: '/assets/banners/hero_1.webp' },
                { key: 'Mage', icon: <MageIcon />, color: '#EC4899', banner: '/assets/banners/hero_15.webp' },
                { key: 'Fighter', icon: <FighterIcon />, color: '#EF4444', banner: '/assets/banners/hero_16.webp' },
                { key: 'Assassin', icon: <AssassinIcon />, color: '#8B5CF6', banner: '/assets/banners/hero_3.webp' },
                { key: 'Tank', icon: <TankIcon />, color: '#3B82F6', banner: '/assets/banners/hero_6.webp' },
                { key: 'Support', icon: <SupportIcon />, color: '#10B981', banner: '/assets/banners/hero_132.webp' },
              ];
              const activeRoleTab = roleTabList.find(r => r.key === (collapsedSections.roleTab || 'Marksman')) || roleTabList[0];
              const leader = roleLeaders[activeRoleTab.key];
              if (!leader) return null;

              const leaderBanner = leader.id
                ? `/assets/paintings/hero_${leader.id}.webp?v=3`
                : (leader.cover_thumb || leader.avatar_url);

              const isTransparent = leaderBanner.toLowerCase().includes('transparent') || 
                                    leaderBanner.toLowerCase().includes('avatar') || 
                                    leaderBanner.toLowerCase().includes('thumb') ||
                                    (leader.cover_transparent && leader.cover_transparent.includes('_transparent.webp'));

              return (
                <div className="role-leaders-v2-section">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Award size={16} style={{ color: '#D4AF37' }} />
                      <span className="premium-section-title" style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-primary, #F8FAFC)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Role Leaders
                      </span>
                    </div>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted, #94A3B8)', fontWeight: 500, paddingLeft: '1.35rem' }}>
                      Epic and above · 7-Day
                    </span>
                  </div>

                  {/* Role Tab Pills */}
                  <div className="role-leaders-v2-tabs">
                    {roleTabList.map(rt => (
                      <button
                        key={rt.key}
                        className={`role-leaders-v2-tab ${activeRoleTab.key === rt.key ? 'active' : ''}`}
                        style={{ 
                          '--rl-accent': rt.color,
                          backgroundImage: `linear-gradient(rgba(7, 11, 20, 0.55), rgba(7, 11, 20, 0.85)), url(${rt.banner})`
                        }}
                        onClick={() => setCollapsedSections(prev => ({ ...prev, roleTab: rt.key }))}
                      >
                        <span className="role-leaders-v2-tab-icon">{rt.icon}</span>
                        <span>{rt.key}</span>
                      </button>
                    ))}
                  </div>

                  {/* Leader Banner Card */}
                  <div className="role-leaders-v2-bento" key={activeRoleTab.key}>
                    <div
                      className="role-leaders-v2-banner"
                      onClick={() => handleHeroClick(leader)}
                    >
                      <div className="role-leaders-v2-banner-img-wrap">
                        <img
                          src={leaderBanner}
                          alt={leader.name}
                          className={`role-leaders-v2-banner-img ${isTransparent ? 'is-transparent' : ''}`}
                          onError={(e) => {
                            e.target.src = leader.cover_thumb || leader.avatar_url || '';
                          }}
                        />
                        <div className="role-leaders-v2-banner-overlay" />
                      </div>
                      <div className="role-leaders-v2-banner-info">
                        <div className="role-leaders-v2-crown-row">
                          <Trophy size={14} style={{ color: activeRoleTab.color }} />
                          <span style={{ fontSize: '0.55rem', fontWeight: 900, color: activeRoleTab.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            #{1} {activeRoleTab.key}
                          </span>
                        </div>
                        <h3 className="role-leaders-v2-name">{leader.name}</h3>
                        <p className="role-leaders-v2-subtitle">{getHeroNickname(leader)}</p>
                      </div>
                    </div>

                    {/* Bottom Stats Row */}
                    <div className="role-leaders-v2-stats-row">
                      <div className="role-leaders-v2-stat-pill">
                        <SmartImage src={leader.avatar_url} alt={leader.name} className="role-leaders-v2-stat-ava" fallbackType="hero" />
                        <div className="role-leaders-v2-stat-info">
                          <span className="role-leaders-v2-stat-val" style={{ color: '#10B981' }}>{leader.win_rate?.toFixed(1)}%</span>
                          <span className="role-leaders-v2-stat-lbl">Win Rate</span>
                        </div>
                      </div>
                      <div className="role-leaders-v2-stat-pill">
                        <div className="role-leaders-v2-stat-info" style={{ alignItems: 'center' }}>
                          <span className="role-leaders-v2-stat-val" style={{ color: '#3B82F6' }}>{leader.pick_rate?.toFixed(1)}%</span>
                          <span className="role-leaders-v2-stat-lbl">Pick Rate</span>
                        </div>
                      </div>
                      <div className="role-leaders-v2-stat-pill">
                        <div className="role-leaders-v2-stat-info" style={{ alignItems: 'center' }}>
                          <span className="role-leaders-v2-stat-val" style={{ color: '#EF4444' }}>{leader.ban_rate?.toFixed(1)}%</span>
                          <span className="role-leaders-v2-stat-lbl">Ban Rate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. Explore Heroes By Role */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Compass size={14} style={{ color: '#D4AF37' }} />
                <span className="premium-section-title" style={{ fontSize: '0.72rem', fontWeight: 900, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Explore Heroes by Role
                </span>
              </div>
              
              <div className="explore-roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                {[
                  { name: 'Tank', icon: <TankIcon />, color: '#3B82F6' },
                  { name: 'Fighter', icon: <FighterIcon />, color: '#EF4444' },
                  { name: 'Assassin', icon: <AssassinIcon />, color: '#8B5CF6' },
                  { name: 'Marksman', icon: <MarksmanIcon />, color: '#D4AF37' },
                  { name: 'Mage', icon: <MageIcon />, color: '#EC4899' },
                  { name: 'Support', icon: <SupportIcon />, color: '#10B981' }
                ].map(roleItem => (
                  <button 
                    key={roleItem.name}
                    className={`explore-role-btn ${activeExploreRole === roleItem.name ? 'active' : ''}`}
                    style={{ '--role-accent': roleItem.color }}
                    onClick={() => {
                      if (activeExploreRole === roleItem.name) {
                        setActiveExploreRole(null);
                      } else {
                        setActiveExploreRole(roleItem.name);
                        setActiveExploreLane(null);
                        setExploreSearchQuery('');
                      }
                    }}
                  >
                    <div className="explore-role-icon-container" style={{ color: roleItem.color }}>
                      {roleItem.icon}
                    </div>
                    <span className="explore-role-lbl">{roleItem.name}</span>
                    <div className="explore-role-glow" />
                  </button>
                ))}
              </div>

              {/* Expanded Panel for Role */}
              {activeExploreRole && (
                <div className="explore-expand-panel animate-fadeIn">
                  <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.65rem', alignItems: 'center' }}>
                    <Search size={12} style={{ color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder={`Search ${activeExploreRole}s...`}
                      value={exploreSearchQuery}
                      onChange={(e) => setExploreSearchQuery(e.target.value)}
                      className="explore-search-input"
                    />
                  </div>
                  <div className="explore-hero-avatar-list">
                    {heroes
                      .filter(h => h.role === activeExploreRole && h.name.toLowerCase().includes(exploreSearchQuery.toLowerCase()))
                      .map(hero => (
                        <button 
                          key={hero.id} 
                          onClick={() => setSelectedHero(hero)} 
                          className="explore-hero-avatar-btn"
                          title={hero.name}
                        >
                          <div className="explore-hero-avatar-img-wrap">
                            <SmartImage src={hero.avatar_url} alt={hero.name} fallbackType="hero" />
                          </div>
                          <span className="explore-hero-avatar-name">{hero.name}</span>
                        </button>
                      ))}
                    {heroes.filter(h => h.role === activeExploreRole && h.name.toLowerCase().includes(exploreSearchQuery.toLowerCase())).length === 0 && (
                      <span className="explore-empty-lbl">No heroes match your filter.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Explore Heroes By Lane */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Compass size={14} style={{ color: '#D4AF37' }} />
                <span className="premium-section-title" style={{ fontSize: '0.72rem', fontWeight: 900, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Explore Heroes by Lane
                </span>
              </div>
              
              <div className="explore-roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.45rem' }}>
                {[
                  { name: 'Gold', label: 'Gold Lane', color: '#D4AF37' },
                  { name: 'EXP', label: 'EXP Lane', color: '#3B82F6' },
                  { name: 'Mid', label: 'Mid Lane', color: '#EC4899' },
                  { name: 'Jungle', label: 'Jungle', color: '#EF4444' },
                  { name: 'Roam', label: 'Roam', color: '#10B981' }
                ].map(laneItem => (
                  <button 
                    key={laneItem.name}
                    className={`explore-role-btn ${activeExploreLane === laneItem.name ? 'active' : ''}`}
                    style={{ 
                      '--role-accent': laneItem.color,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.65rem 0.15rem'
                    }}
                    onClick={() => {
                      if (activeExploreLane === laneItem.name) {
                        setActiveExploreLane(null);
                      } else {
                        setActiveExploreLane(laneItem.name);
                        setActiveExploreRole(null);
                        setExploreSearchQuery('');
                      }
                    }}
                  >
                    <div className="explore-role-icon-container" style={{ color: laneItem.color, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>
                      <LaneIcon lane={laneItem.name} size={18} style={{ marginRight: 0 }} />
                    </div>
                    <span className="explore-role-lbl" style={{ fontSize: '0.48rem', whiteSpace: 'nowrap', display: 'block', textAlign: 'center', width: '100%', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {laneItem.name}
                    </span>
                    <div className="explore-role-glow" />
                  </button>
                ))}
              </div>

              {/* Expanded Panel for Lane */}
              {activeExploreLane && (
                <div className="explore-expand-panel animate-fadeIn">
                  <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.65rem', alignItems: 'center' }}>
                    <Search size={12} style={{ color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder={`Search ${activeExploreLane} Lane...`}
                      value={exploreSearchQuery}
                      onChange={(e) => setExploreSearchQuery(e.target.value)}
                      className="explore-search-input"
                    />
                  </div>
                  <div className="explore-hero-avatar-list">
                    {heroes
                      .filter(h => {
                        const hLane = h.lane || HERO_META_STATS.find(m => m.name.toLowerCase() === h.name.toLowerCase())?.lane || '';
                        return hLane && hLane.toLowerCase().includes(activeExploreLane.toLowerCase()) && h.name.toLowerCase().includes(exploreSearchQuery.toLowerCase());
                      })
                      .map(hero => (
                        <button 
                          key={hero.id} 
                          onClick={() => setSelectedHero(hero)} 
                          className="explore-hero-avatar-btn"
                          title={hero.name}
                        >
                          <div className="explore-hero-avatar-img-wrap">
                            <SmartImage src={hero.avatar_url} alt={hero.name} fallbackType="hero" />
                          </div>
                          <span className="explore-hero-avatar-name">{hero.name}</span>
                        </button>
                      ))}
                    {heroes.filter(h => {
                      const hLane = h.lane || HERO_META_STATS.find(m => m.name.toLowerCase() === h.name.toLowerCase())?.lane || '';
                      return hLane && hLane.toLowerCase().includes(activeExploreLane.toLowerCase()) && h.name.toLowerCase().includes(exploreSearchQuery.toLowerCase());
                    }).length === 0 && (
                      <span className="explore-empty-lbl">No heroes match your filter.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Database Status Card */}
            <div className="database-status-card">
              <div className="database-status-title-row">
                <div className="database-status-title">
                  <BookOpen size={14} style={{ color: '#D4AF37' }} />
                  <span>Database Status</span>
                </div>
                <span className="database-status-badge">Synced</span>
              </div>
              
              <div className="db-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div className="db-stat-card glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.65rem 0.5rem', borderRadius: '12px' }}>
                  <span className="db-stat-lbl" style={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Game Patch</span>
                  <span className="db-stat-val" style={{ fontSize: '0.85rem', fontWeight: 900, color: '#F8FAFC', marginTop: '0.15rem' }}>v{patchMeta.current_patch || '1.8.84'}</span>
                </div>
                <div className="db-stat-card glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.65rem 0.5rem', borderRadius: '12px' }}>
                  <span className="db-stat-lbl" style={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Last Synced</span>
                  <span className="db-stat-val" style={{ fontSize: '0.68rem', fontWeight: 900, color: '#F8FAFC', marginTop: '0.2rem', textAlign: 'center' }}>
                    {patchMeta.last_updated_time ? new Date(patchMeta.last_updated_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </span>
                </div>
              </div>
              
              <div className="db-patch-footer" style={{ textAlign: 'center', fontSize: '0.58rem', color: '#475569', fontWeight: 600, marginTop: '0.65rem' }}>
                <span>Static Local Engine • Patch {patchMeta.current_patch || '1.8.84'} • App v2.3</span>
              </div>
            </div>

          </div>

        )}



        {/* TAB 2: HERO DIRECTORY */}

        {!loading && activeTab === 'heroes' && (

          <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              <div className="input-field-wrapper">

                <Search className="input-field-icon" size={16} />

                <input 

                  type="text" 

                  value={searchQuery}

                  onChange={(e) => setSearchQuery(e.target.value)}

                  placeholder={t.searchPlaceholder}

                  className="input-field"

                />

              </div>



              {showBuffedOnly && (

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.45rem 0.75rem', borderRadius: '8px' }}>

                  <span style={{ fontSize: '0.62rem', color: 'var(--accent-green)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>

                    <TrendingUp size={12} />

                    Showing Buffed Heroes Only

                  </span>

                  <button 

                    onClick={() => setShowBuffedOnly(false)} 

                    style={{ border: 'none', background: 'none', color: 'var(--accent-green)', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}

                  >

                    Clear Filter

                  </button>

                </div>

              )}

              {showcaseFilter && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.15)', padding: '0.45rem 0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.62rem', color: '#D4AF37', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={12} />
                    Showing Featured Showcase Heroes
                  </span>
                  <button 
                    onClick={() => setShowcaseFilter(false)} 
                    style={{ border: 'none', background: 'none', color: '#D4AF37', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', alignItems: 'center' }}>
                {['All', 'Marksman', 'Tank', 'Assassin', 'Fighter', 'Mage', 'Support'].map(role => (
                  <button 
                    key={role}
                    onClick={() => {
                      setRoleFilter(role);
                      setLaneFilter('All');
                      setShowcaseFilter(false);
                    }}
                    className={`btn ${roleFilter === role && laneFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.65rem', whiteSpace: 'nowrap' }}
                  >
                    {role === 'All' ? t.allRoles : role}
                  </button>
                ))}
                {laneFilter !== 'All' && (
                  <button 
                    onClick={() => {
                      setLaneFilter('All');
                      setShowcaseFilter(false);
                    }}
                    className="btn btn-primary"
                    style={{ borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                  >
                    <LaneIcon lane={laneFilter} size={12} style={{ marginRight: '2px' }} />
                    {laneFilter} Lane
                    <span style={{ fontSize: '0.55rem', marginLeft: '4px', opacity: 0.8 }}>✕</span>
                  </button>
                )}
              </div>

            </div>



            {/* Roster Listing Grid */}

            <div className="roster-grid">

              {filteredHeroes.map(hero => (

                <div 

                  key={hero.id}

                  onClick={() => handleHeroClick(hero)}

                  className="roster-item-container"

                >

                  <div className="roster-card">

                    <SmartImage 

                      src={hero.cover_thumb || hero.avatar_url} 

                      alt={hero.name} 

                      className="roster-avatar"

                      fallbackType="hero"

                    />

                  </div>

                  <h4 className="roster-name">{hero.name}</h4>

                </div>

              ))}

            </div>

          </div>

        )}



        {/* TAB 3: DRAFT ASSISTANT COUNTER PICKER */}

        {!loading && activeTab === 'assistant' && (() => {
          const laneKeys = [
            { key: 'overall', label: 'Overall', role: 'All Roles', icon: Star },
            { key: 'goldLane', label: 'Gold', role: 'Marksman', icon: Crosshair },
            { key: 'midLane', label: 'Mid', role: 'Mage', icon: Zap },
            { key: 'roamLane', label: 'Roam', role: 'Tank/Support', icon: Shield },
            { key: 'jungleLane', label: 'Jungle', role: 'Assassin/Fighter', icon: Swords },
            { key: 'expLane', label: 'Exp', role: 'Fighter/Tank', icon: Flame }
          ];

          // Exclude any lanes already drafted by allies from display (except overall)
          const draftedLanes = new Set(
            allyDraft
              .filter(h => h !== null)
              .map(h => h.lane ? h.lane.toLowerCase() : "")
              .filter(l => l !== "")
          );

          // Memoized filtered roster grid is loaded from top-level component scope

          // Helper to check if a hero is already picked on either team
          const isHeroDrafted = (heroId) => {
            return allyDraft.some(h => h && h.id === heroId) || 
                   enemyDraft.some(h => h && h.id === heroId);
          };

          // Live Team Status Widget Analysis
          const activeAllies = allyDraft.filter(h => h !== null);
          const teamStats = { frontline: 0, crowdControl: 0, magicDamage: 0, objectiveControl: 0, mobility: 0 };
          activeAllies.forEach(hero => {
            const role = (hero.role || "").toLowerCase();
            const spec = (hero.speciality || []).map(s => s.toLowerCase());
            const lane = (hero.lane || "").toLowerCase();
            const alive = Number(hero.durability || hero.alive || 0);
            const mag = Number(hero.magic || hero.mag || 0);
            const phy = Number(hero.offense || hero.phy || 0);

            if (role.includes("tank") || (role.includes("fighter") && alive >= 60) || alive >= 75) teamStats.frontline++;
            if (spec.some(s => s.includes("control") || s.includes("stun") || s.includes("slow")) || (role.includes("mage") && mag >= 75) || (role.includes("tank") && mag >= 60)) teamStats.crowdControl++;
            if (role.includes("mage") || mag >= 75) teamStats.magicDamage++;
            if ((alive >= 50 && phy >= 50) || role.includes("assassin") || role.includes("fighter") || lane.includes("jungle")) teamStats.objectiveControl++;
            if (spec.some(s => s.includes("mobility") || s.includes("charge") || s.includes("speed")) || role.includes("assassin") || lane.includes("jungle")) teamStats.mobility++;
          });

          const getStatusText = (count) => {
            if (count === 0) return { label: 'Missing', color: 'var(--accent-red)', icon: '❌' };
            if (count < 1.5) return { label: 'Weak', color: 'var(--accent-gold)', icon: '⚠️' };
            return { label: 'Good', color: 'var(--accent-green)', icon: '✅' };
          };

          const draftedEnemies = enemyDraft.filter(h => h !== null);
          const firstEnemy = draftedEnemies[0];
          const isDraftEmpty = allyDraft.every(h => h === null) && enemyDraft.every(h => h === null);

          // Compute top counter picks for the Inspector Panel
          let topCounters = [];
          if (firstEnemy) {
            const engine = new DraftEngine(heroes, draftMatrix);
            const scoredList = engine.getRecommendations([], [firstEnemy], "overall");
            topCounters = scoredList
              .sort((a, b) => b.counterScore - a.counterScore)
              .slice(0, 20);
          }

          const getPersonalityBadges = (item) => {
            const badges = [];
            const tagsStr = item.reasoningTags.join(' ').toLowerCase();
            
            if (tagsStr.includes('counter')) {
              badges.push(<span key="ctr" className="recom-badge-pill counter">🎯 Hard Counter</span>);
            }
            if (tagsStr.includes('synergy') || tagsStr.includes('combo')) {
              badges.push(<span key="syn" className="recom-badge-pill synergy">🤝 Synergy</span>);
            }
            if (tagsStr.includes('frontline') || tagsStr.includes('tank') || tagsStr.includes('defensive')) {
              badges.push(<span key="front" className="recom-badge-pill frontline">🛡 Frontline</span>);
            }
            if (tagsStr.includes('teamfight') || tagsStr.includes('comp') || tagsStr.includes('crowd')) {
              badges.push(<span key="tf" className="recom-badge-pill teamfight">⚔ Teamfight</span>);
            }
            if (item.draftScore >= 85 || tagsStr.includes('value') || tagsStr.includes('meta')) {
              badges.push(<span key="val" className="recom-badge-pill value">🔥 Draft Value</span>);
            }
            
            if (badges.length === 0) {
              badges.push(<span key="std" className="recom-badge-pill synergy">👍 Good Fit</span>);
            }
            
            return badges.slice(0, 1); // Show exactly 1 primary badge to keep HUD super clean!
          };

          return (
            <div 
              className={`draft-container animate-fadeIn ${pickerExpanded ? 'picker-expanded' : ''}`}
              onTouchStart={handleContainerTouchStart}
              onTouchEnd={handleContainerTouchEnd}
            >
              
              {/* Sticky Active Slot & Progress segments bar */}
              <div className="draft-active-slot-bar">
                <span className={`active-slot-value ${activeDraftSlot.team}`}>
                  {activeDraftSlot.team === 'ally' ? '🔵' : '🔴'}{' '}
                  DRAFTING:{' '}
                  {activeDraftSlot.team === 'ally' 
                    ? `ALLIED ${['Jungle', 'EXP', 'Gold', 'Mid', 'Roam'][activeDraftSlot.index].toUpperCase()}` 
                    : `ENEMY SLOT ${activeDraftSlot.index + 1}`}
                </span>

                <div className="draft-progress-container" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div className="draft-progress-segments" style={{ display: 'flex', gap: '0.1rem', alignItems: 'center' }}>
                    {(() => {
                      const allyCount = allyDraft.filter(Boolean).length;
                      const enemyCount = enemyDraft.filter(Boolean).length;
                      const totalCount = allyCount + enemyCount;
                      const segments = [];
                      for (let i = 0; i < 10; i++) {
                        const isFilled = i < totalCount;
                        segments.push(
                          <span
                            key={i}
                            className={`progress-segment ${isFilled ? 'filled' : 'empty'}`}
                            style={{
                              width: '5px',
                              height: '9px',
                              borderRadius: '1px',
                              background: isFilled 
                                ? (activeDraftSlot.team === 'ally' ? 'var(--accent-blue)' : 'var(--accent-red)') 
                                : 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid var(--border-light)',
                              display: 'inline-block'
                            }}
                          />
                        );
                      }
                      return segments;
                    })()}
                  </div>
                  <span className="draft-progress-text" style={{ fontSize: '0.52rem', fontWeight: 900, color: 'var(--text-secondary)' }}>
                    {allyDraft.filter(Boolean).length + enemyDraft.filter(Boolean).length}/10
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  {firstEnemy && (
                    <button
                      onClick={() => setShowInspector(!showInspector)}
                      className="strategy-segmented-btn"
                      style={{ padding: '0.15rem 0.35rem', fontSize: '0.45rem', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '6px', color: 'var(--accent-gold)', background: 'var(--accent-gold-soft)', cursor: 'pointer' }}
                    >
                      {showInspector ? 'Hide' : 'Inspect'}
                    </button>
                  )}
                  <span className="rankings-tier-badge b" style={{ fontSize: '0.42rem', padding: '0.1rem 0.25rem', margin: 0 }}>v{patchMeta.current_patch}</span>
                </div>
              </div>

              {/* Active Draft Context helper row */}
              <div className="draft-active-context-helper">
                Currently Selecting: {activeDraftSlot.team === 'ally' ? 'Allied' : 'Enemy'} {['Jungle', 'EXP Lane', 'Gold Lane', 'Mid Lane', 'Roam'][activeDraftSlot.index]}
              </div>

              {/* Developer Collapsible Inspector Panel */}
              {showInspector && firstEnemy && (
                <div className="draft-card animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '3px solid var(--accent-gold)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--accent-gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <TrendingUp size={10} className="text-accent-gold" />
                      Roster Inspector V3.1
                    </span>
                    <span style={{ fontSize: '0.48rem', color: 'var(--text-muted)' }}>Enemy Focus: <strong style={{ color: 'var(--accent-red)' }}>{firstEnemy.name}</strong></span>
                  </div>
                  <span style={{ fontSize: '0.45rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>Top picks and GMS calculations:</span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', maxHeight: '140px', overflowY: 'auto', paddingRight: '0.1rem' }}>
                    {topCounters.map((item, idx) => {
                      let matchupVal = 0;
                      const enemyNode = draftMatrix && draftMatrix[String(firstEnemy.id)];
                      if (enemyNode) {
                        const strongItem = enemyNode.strong_against?.find(x => Number(x.id) === Number(item.hero.id));
                        if (strongItem) matchupVal = -strongItem.score;
                        else {
                          const weakItem = enemyNode.weak_against?.find(x => Number(x.id) === Number(item.hero.id));
                          if (weakItem && weakItem.score > 0) matchupVal = weakItem.score;
                        }
                      }
                      
                      return (
                        <div key={item.hero.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', padding: '0.25rem 0.35rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.52rem', fontWeight: 900, color: 'var(--text-primary)' }}>{idx + 1}. {item.hero.name}</span>
                            <span style={{ fontSize: '0.52rem', fontWeight: 900, color: 'var(--accent-gold)' }}>Score: {item.draftScore}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.1rem', fontSize: '0.4rem', color: 'var(--text-muted)' }}>
                            <div>Val: <strong style={{ color: matchupVal < 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{matchupVal.toFixed(1)}</strong></div>
                            <div>Ctr: <strong style={{ color: item.counterScore >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>+{item.counterScore}</strong></div>
                            <div>Syn: <strong style={{ color: 'var(--accent-blue)' }}>+{item.synergyScore}</strong></div>
                            <div>Fit: <strong style={{ color: '#8b5cf6' }}>+{item.roleFitScore}</strong></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1. ENEMY TEAM HUD CARD (Horizontal compact circles) */}
              <div className="draft-hud-card enemy animate-fadeIn">
                <div className="draft-team-panel" style={{ padding: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                    <span className="draft-team-header enemy" style={{ fontSize: '0.52rem' }}>
                      <span className="enemy-glow-dot" />
                      Enemy Team
                    </span>
                    {activeDraftSlot.team === 'enemy' && (
                      <span className="active-team-indicator enemy">🔴 Active Target</span>
                    )}
                  </div>
                  
                  <div className="draft-slots-row">
                    {enemyDraft.map((slot, index) => {
                      const isActive = activeDraftSlot.team === 'enemy' && activeDraftSlot.index === index;
                      const hasHero = !!slot;
                      return (
                        <div 
                          key={index}
                          onClick={() => handleSlotClick('enemy', index)}
                          className={`draft-slot circular-slot ${isActive ? 'active-enemy' : hasHero ? 'filled-enemy' : 'empty'}`}
                        >
                          {hasHero ? (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeHeroFromSlot('enemy', index); }}
                                className="draft-slot-delete-btn"
                              >
                                <X size={7} />
                              </button>
                              <SmartImage src={slot.avatar_url} alt={slot.name} fallbackType="hero" className="draft-slot-avatar circular-avatar" />
                              {slot.lane && <span className="draft-slot-lane-badge enemy">{slot.lane.substring(0, 3)}</span>}
                            </>
                          ) : (
                            <span className="draft-slot-label">E{index + 1}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. RECOMMENDED PICKS PANEL (THE HERO SECTION) */}
              <div className="draft-card recommendations-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Sparkles size={12} className="text-accent-gold" />
                    Recommended Picks
                  </span>
                  <span style={{ fontSize: '0.48rem', color: 'var(--text-muted)' }}>
                    {(() => {
                      if (activeLaneTab !== 'overall') {
                        let currentLaneHero = null;
                        let currentLaneLabel = "";
                        if (activeLaneTab === 'jungleLane') { currentLaneHero = allyDraft[0]; currentLaneLabel = "Jungle"; }
                        else if (activeLaneTab === 'expLane') { currentLaneHero = allyDraft[1]; currentLaneLabel = "EXP"; }
                        else if (activeLaneTab === 'goldLane') { currentLaneHero = allyDraft[2]; currentLaneLabel = "Gold"; }
                        else if (activeLaneTab === 'midLane') { currentLaneHero = allyDraft[3]; currentLaneLabel = "Mid"; }
                        else if (activeLaneTab === 'roamLane') { currentLaneHero = allyDraft[4]; currentLaneLabel = "Roam"; }

                        if (currentLaneHero) {
                          return (
                            <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>
                              ⚠️ {currentLaneLabel} Filled ({currentLaneHero.name})
                            </span>
                          );
                        }
                      }
                      return enemyDraft.filter(h => h !== null).length > 0 ? "Sorted by Strategy Mode V3" : "Select enemy picks to begin";
                    })()}
                  </span>
                </div>

                {isDraftEmpty ? (
                  <div style={{ textAlign: 'center', padding: '1.25rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', width: '100%', minHeight: '120px', justifyContent: 'center' }}>
                    <Sparkles size={14} className="text-accent-gold animate-pulse" />
                    <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Select heroes first to compute recommendations
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Tactical Strategy Mode Selector */}
                    <div className="strategy-segmented-row">
                  {[
                    { key: 'overall', label: 'Best Overall', icon: Star },
                    { key: 'counters', label: 'Enemy Counters', icon: Swords },
                    { key: 'synergy', label: 'Team Synergy', icon: Shield },
                    { key: 'value', label: 'Draft Value', icon: Trophy }
                  ].map(tab => {
                    const isSelected = activeStrategyTab === tab.key;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveStrategyTab(tab.key)}
                        className={`strategy-segmented-btn ${isSelected ? 'active' : ''}`}
                      >
                        <Icon size={10} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Lane Pills Selector */}
                <div className="rankings-role-pills" style={{ margin: 0, paddingBottom: '0.1rem' }}>
                  {laneKeys.map(lane => {
                    const laneLower = lane.label.toLowerCase();
                    let isLaneDrafted = false;
                    
                    if (lane.key !== 'overall') {
                      draftedLanes.forEach(dl => {
                        if (laneLower.includes(dl) || dl.includes(lane.label.toLowerCase())) {
                          isLaneDrafted = true;
                        }
                      });
                    }

                    const isSelected = activeLaneTab === lane.key;
                    const TabIcon = lane.icon;

                    return (
                      <button
                        key={lane.key}
                        onClick={() => setActiveLaneTab(lane.key)}
                        className={`rankings-role-pill ${isSelected ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.25rem 0.5rem', fontSize: '0.52rem' }}
                      >
                        <TabIcon size={10} />
                        {lane.label} {isLaneDrafted ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>

                {/* Horizontal Swipable Recommendation Carousel */}
                <div className="recom-cards-list" style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '0.25rem', paddingRight: '0.1rem' }}>
                  {(() => {
                    let currentList = [...(draftRecommendations[activeLaneTab] || [])];
                    if (currentList.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', width: '100%' }}>
                          <AlertTriangle size={14} className="text-accent-gold" />
                          <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontWeight: 700 }}>No picks computed. Check enemy team setup.</span>
                        </div>
                      );
                    }

                    // Client-side strategy category sorting
                    if (activeStrategyTab === 'counters') {
                      currentList.sort((a, b) => b.counterScore - a.counterScore);
                    } else if (activeStrategyTab === 'synergy') {
                      currentList.sort((a, b) => b.synergyScore - a.synergyScore);
                    } else if (activeStrategyTab === 'value') {
                      currentList.sort((a, b) => b.draftScore - a.draftScore);
                    }

                    return currentList.slice(0, 5).map((item) => {
                      const isSelected = previewRecomHero && previewRecomHero.id === item.hero.id;
                      const draftScoreClass = item.draftScore >= 80 ? 'high' : item.draftScore >= 65 ? 'mid' : 'low';
                      const tierLabel = item.draftScore >= 80 ? 'S' : item.draftScore >= 65 ? 'A' : 'B';
                      return (
                        <div
                          key={item.hero.id}
                          onClick={() => setPreviewRecomHero(item.hero)}
                          className={`recom-card-compact animate-fadeIn ${isSelected ? 'selected' : ''}`}
                          style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.2rem',
                            padding: '0.3rem 0.45rem',
                            background: 'var(--bg-main)',
                            border: isSelected ? '1.5px solid var(--accent-blue)' : '1px solid var(--border-light)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            minWidth: '76px',
                            maxWidth: '76px',
                            flexShrink: 0,
                            position: 'relative',
                            boxShadow: isSelected ? '0 0 8px var(--accent-blue-glow)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                            <SmartImage
                              src={item.hero.avatar_url}
                              alt={item.hero.name}
                              fallbackType="hero"
                              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
                            />
                            <span className={`recom-tier-badge ${tierLabel.toLowerCase()}`} style={{
                              position: 'absolute',
                              top: '-2px',
                              left: '-2px',
                              fontSize: '0.34rem',
                              fontWeight: 900,
                              padding: '1px 3.5px',
                              borderRadius: '4px',
                              color: 'white',
                              background: tierLabel === 'S' ? '#EF4444' : tierLabel === 'A' ? '#F59E0B' : '#3B82F6',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                              zIndex: 2
                            }}>
                              {tierLabel}
                            </span>
                            <span className={`recom-score-value ${draftScoreClass}`} style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              fontSize: '0.36rem',
                              fontWeight: 900,
                              padding: '1px 3px',
                              borderRadius: '4px',
                              color: 'white',
                              background: item.draftScore >= 80 ? 'var(--accent-green)' : item.draftScore >= 65 ? 'var(--accent-gold)' : 'var(--accent-red)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                            }}>
                              {item.draftScore}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.48rem', fontWeight: 800, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {item.hero.name}
                          </span>
                          <span style={{ fontSize: '0.38rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {item.hero.role.substring(0, 3)}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Compact Recommendation Inspector Panel (110px budget) */}
                {(() => {
                  if (!previewRecomHero) return null;
                  
                  // Find recommendation details in the current computed list
                  const currentList = [...(draftRecommendations[activeLaneTab] || [])];
                  const recomDetails = currentList.find(x => x.hero.id === previewRecomHero.id);
                  if (!recomDetails) return null;

                  const draftScoreClass = recomDetails.draftScore >= 80 ? 'high' : recomDetails.draftScore >= 65 ? 'mid' : 'low';
                  const personalityBadge = getPersonalityBadges(recomDetails)[0];

                  // Dynamic GMS self-explaining calculations
                  let bestCounterTarget = null;
                  let bestCounterVal = 0;
                  const draftedEnemies = enemyDraft.filter(h => h !== null);
                  draftedEnemies.forEach(enemy => {
                    let matchupVal = 0;
                    const enemyNode = draftMatrix && draftMatrix[String(enemy.id)];
                    if (enemyNode) {
                      const strongItem = enemyNode.strong_against?.find(x => Number(x.id) === Number(previewRecomHero.id));
                      if (strongItem) matchupVal = -strongItem.score;
                      const weakItem = enemyNode.weak_against?.find(x => Number(x.id) === Number(previewRecomHero.id));
                      if (weakItem && weakItem.score > 0) matchupVal = weakItem.score;
                    }
                    if (matchupVal < bestCounterVal) {
                      bestCounterVal = matchupVal;
                      bestCounterTarget = enemy;
                    }
                  });

                  let bestSynergyAlly = null;
                  let bestSynergyVal = 0;
                  const draftedAllies = allyDraft.filter(h => h !== null);
                  draftedAllies.forEach(ally => {
                    let synergyValue = 0;
                    const allyNode = draftMatrix && draftMatrix[String(ally.id)];
                    if (allyNode && allyNode.synergy) {
                      const synItem = allyNode.synergy.find(x => Number(x.id) === Number(previewRecomHero.id));
                      if (synItem) synergyValue = synItem.score;
                    }
                    if (synergyValue > bestSynergyVal) {
                      bestSynergyVal = synergyValue;
                      bestSynergyAlly = ally;
                    }
                  });

                  // Calculate Health score delta if this hero was drafted
                  let scoreDelta = 0;
                  if (draftHealthDetails.getHeroAttributes) {
                    const tempAllies = [...draftedAllies, previewRecomHero];
                    const tempStats = { frontline: 0, crowdControl: 0, magicDamage: 0, objectiveControl: 0, mobility: 0 };
                    tempAllies.forEach(h => {
                      const hAttrs = draftHealthDetails.getHeroAttributes(h);
                      if (hAttrs.frontline) tempStats.frontline++;
                      if (hAttrs.crowdControl) tempStats.crowdControl++;
                      if (hAttrs.magicDamage) tempStats.magicDamage++;
                      if (hAttrs.objectiveControl) tempStats.objectiveControl++;
                      if (hAttrs.mobility) tempStats.mobility++;
                    });
                    
                    let tempScore = 30;
                    if (tempStats.frontline >= 1) tempScore += 14;
                    if (tempStats.crowdControl >= 1) tempScore += 14;
                    if (tempStats.magicDamage >= 1) tempScore += 14;
                    if (tempStats.objectiveControl >= 1) tempScore += 14;
                    if (tempStats.mobility >= 1) tempScore += 14;
                    
                    const pickedCount = tempAllies.length;
                    if (pickedCount > 0) {
                      tempScore += Math.round((pickedCount / 5) * 30);
                    }
                    tempScore = Math.min(100, Math.max(30, tempScore));
                    scoreDelta = tempScore - draftHealthDetails.score;
                  }

                  // Create dynamic visual reasons tags
                  const dynamicReasons = [];
                  if (bestCounterTarget) {
                    dynamicReasons.push({ text: `🎯 Counters ${bestCounterTarget.name}`, type: 'counter' });
                  }
                  if (bestSynergyAlly) {
                    dynamicReasons.push({ text: `🤝 Strong with ${bestSynergyAlly.name}`, type: 'synergy' });
                  }
                  
                  // Balance correction check
                  if (draftHealthDetails.weaknesses) {
                    const previewAttrs = draftHealthDetails.getHeroAttributes ? draftHealthDetails.getHeroAttributes(previewRecomHero) : {};
                    draftHealthDetails.weaknesses.forEach(w => {
                      if (previewAttrs[w.key]) {
                        dynamicReasons.push({ text: `🛡 Fixes Missing ${w.name}`, type: 'sustain' });
                      }
                    });
                  }
                  
                  if (scoreDelta > 0) {
                    dynamicReasons.push({ text: `⚔ Health Gain +${scoreDelta}`, type: 'health' });
                  }

                  // If empty, fall back to Moonton GMS tags
                  if (dynamicReasons.length === 0) {
                    recomDetails.reasoningTags.slice(0, 3).forEach(tag => {
                      dynamicReasons.push({ text: tag, type: 'synergy' });
                    });
                  }

                  return (
                    <div className="recom-inspector-compact animate-fadeIn" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      padding: '4px 8px',
                      background: 'rgba(15, 23, 42, 0.02)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxSizing: 'border-box'
                    }}>
                      
                      {/* Top Inspector Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }} onClick={() => handleHeroClick(previewRecomHero)}>
                          <SmartImage src={previewRecomHero.avatar_url} alt={previewRecomHero.name} fallbackType="hero" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>{previewRecomHero.name}</span>
                            <span style={{ fontSize: '0.44rem', color: 'var(--text-muted)' }}>{previewRecomHero.role} • {previewRecomHero.lane}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {personalityBadge}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.38rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Score</span>
                            <span className={`recom-score-value ${draftScoreClass}`} style={{ fontSize: '0.58rem', fontWeight: 900, padding: '0.05rem 0.25rem', borderRadius: '4px' }}>
                              {recomDetails.draftScore}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Inspector Row (Reasoning tags) */}
                      <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '0.05rem', height: '22px', alignItems: 'center' }}>
                        {dynamicReasons.slice(0, 3).map((tag, tagIdx) => {
                          let tagColor = 'var(--accent-blue)';
                          if (tag.type === 'counter') tagColor = 'var(--accent-red)';
                          if (tag.type === 'health') tagColor = 'var(--accent-green)';
                          if (tag.type === 'sustain') tagColor = 'var(--accent-gold)';
                          
                          return (
                            <div key={tagIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.44rem', color: 'var(--text-secondary)', fontWeight: 650, background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '0.1rem 0.25rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                              <span style={{ color: tagColor, fontSize: '0.44rem', fontWeight: 'bold' }}>✓</span>
                              <span>{tag.text}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom Inspector Row (Dual Action Buttons) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', height: '36px', alignItems: 'center' }}>
                        <button
                          onClick={() => draftHeroAutomatically(previewRecomHero, activeLaneTab)}
                          className="btn btn-primary"
                          style={{
                            padding: 0,
                            height: '36px',
                            borderRadius: '6px',
                            fontSize: '0.5rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            background: 'var(--accent-blue)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.2rem'
                          }}
                        >
                          {(() => {
                            let currentLaneHero = null;
                            let targetLane = activeLaneTab;
                            if (targetLane === 'overall' && previewRecomHero) {
                              const heroLane = (previewRecomHero.lane || "").toLowerCase();
                              if (heroLane.includes("jung") || heroLane.includes("assas")) targetLane = 'jungleLane';
                              else if (heroLane.includes("exp") || heroLane.includes("fight")) targetLane = 'expLane';
                              else if (heroLane.includes("gold") || heroLane.includes("marks")) targetLane = 'goldLane';
                              else if (heroLane.includes("mid") || heroLane.includes("mage")) targetLane = 'midLane';
                              else if (heroLane.includes("roam") || heroLane.includes("supp") || heroLane.includes("tank")) targetLane = 'roamLane';
                            }

                            if (targetLane === 'jungleLane') currentLaneHero = allyDraft[0];
                            else if (targetLane === 'expLane') currentLaneHero = allyDraft[1];
                            else if (targetLane === 'goldLane') currentLaneHero = allyDraft[2];
                            else if (targetLane === 'midLane') currentLaneHero = allyDraft[3];
                            else if (targetLane === 'roamLane') currentLaneHero = allyDraft[4];

                            if (currentLaneHero) {
                              return `Replace ${currentLaneHero.name}`;
                            }
                            return "Pick For Team";
                          })()} <Swords size={9} />
                        </button>
                        <button
                          onClick={() => handleHeroClick(previewRecomHero)}
                          className="btn btn-secondary"
                          style={{
                            padding: 0,
                            height: '36px',
                            borderRadius: '6px',
                            fontSize: '0.5rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            background: 'transparent',
                            border: '1px solid var(--border-light)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          View Guide
                        </button>
                      </div>

                    </div>
                  );
                })()}
                  </>
                )}
              </div>

              {/* 3. ALLIED TEAM HUD CARD (Horizontal compact circles) */}
              <div className="draft-hud-card ally animate-fadeIn">
                <div className="draft-team-panel" style={{ padding: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                    <span className="draft-team-header ally" style={{ fontSize: '0.52rem' }}>
                      <span className="ally-glow-dot" />
                      Allied Team
                    </span>
                    {activeDraftSlot.team === 'ally' && (
                      <span className="active-team-indicator ally">🔵 Active Target</span>
                    )}
                  </div>
                  
                  <div className="draft-slots-row">
                    {allyDraft.map((slot, index) => {
                      const isActive = activeDraftSlot.team === 'ally' && activeDraftSlot.index === index;
                      const hasHero = !!slot;
                      const laneLabels = ['Jungle', 'EXP', 'Gold', 'Mid', 'Roam'];
                      const laneAbbrev = ['JGL', 'EXP', 'GLD', 'MID', 'ROM'];
                      return (
                        <div 
                          key={index}
                          onClick={() => handleSlotClick('ally', index)}
                          className={`draft-slot circular-slot ${isActive ? 'active-ally' : hasHero ? 'filled-ally' : 'empty'}`}
                        >
                          {hasHero ? (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeHeroFromSlot('ally', index); }}
                                className="draft-slot-delete-btn"
                              >
                                <X size={7} />
                              </button>
                              <SmartImage src={slot.avatar_url} alt={slot.name} fallbackType="hero" className="draft-slot-avatar circular-avatar" />
                              <span className="draft-slot-lane-badge">{laneAbbrev[index]}</span>
                            </>
                          ) : (
                            <span className="draft-slot-label" style={{ fontSize: '0.34rem' }}>{laneLabels[index]}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. DRAFT HEALTH & TEAM BALANCE CARD */}
              <div className={`draft-card draft-health-explanation-card animate-fadeIn ${healthCollapsed ? 'collapsed' : 'expanded'}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.2rem' }}>
                  <span className="explanation-card-title" style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <TrendingUp size={10} className="text-accent-blue" />
                    Draft Health
                  </span>
                  
                  <div className="health-score-container" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.45rem', color: 'var(--text-muted)' }}>Score:</span>
                    <span style={{
                      fontSize: '0.55rem',
                      fontWeight: 900,
                      color: draftHealthDetails.score >= 80 ? 'var(--accent-green)' : draftHealthDetails.score >= 60 ? 'var(--accent-gold)' : 'var(--accent-red)',
                      background: 'rgba(255,255,255,0.03)',
                      padding: '0.05rem 0.25rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-light)'
                    }}>{draftHealthDetails.score}</span>
                    
                    <button 
                      onClick={() => setHealthCollapsed(!healthCollapsed)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-blue)',
                        fontSize: '0.45rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        padding: 0
                      }}
                    >
                      {healthCollapsed ? '▼ Show Analysis' : '▲ Hide Analysis'}
                    </button>
                  </div>
                </div>

                {!healthCollapsed && (
                  <div className="health-expanded-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
                    <div className="health-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      
                      {/* Strengths Column */}
                      <div className="health-column strengths" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span className="column-header" style={{ fontSize: '0.48rem', fontWeight: 800, color: 'var(--accent-green)', display: 'block', marginBottom: '0.1rem' }}>✓ Strengths</span>
                        {draftHealthDetails.strengths.length === 0 ? (
                          <span style={{ fontSize: '0.42rem', color: 'var(--text-muted)' }}>No notable strengths yet</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            {draftHealthDetails.strengths.map(item => (
                              <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.44rem', color: 'var(--text-secondary)' }}>
                                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>✓</span>
                                <span>{item.name} Balanced</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Weaknesses Column */}
                      <div className="health-column weaknesses" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span className="column-header" style={{ fontSize: '0.48rem', fontWeight: 800, color: 'var(--accent-gold)', display: 'block', marginBottom: '0.1rem' }}>⚠ Weaknesses</span>
                        {draftHealthDetails.weaknesses.length === 0 ? (
                          <span style={{ fontSize: '0.42rem', color: 'var(--accent-green)' }}>✓ All systems balanced!</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {draftHealthDetails.weaknesses.map(item => (
                              <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.44rem', color: 'var(--text-secondary)' }}>
                                  <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>⚠</span>
                                  <span>{item.name} Missing</span>
                                </div>
                                {/* Actionable Suggestions Tags */}
                                <div style={{ display: 'flex', gap: '0.15rem', flexWrap: 'wrap', marginTop: '0.05rem' }}>
                                  {item.heroSuggestions.map(hName => (
                                    <button
                                      key={hName}
                                      onClick={() => handleSuggestionTagClick(hName)}
                                      className="actionable-suggest-pill"
                                      style={{
                                        padding: '0.08rem 0.2rem',
                                        fontSize: '0.38rem',
                                        fontWeight: 700,
                                        borderRadius: '4px',
                                        background: 'var(--accent-gold-soft)',
                                        border: '1px solid rgba(251, 191, 36, 0.2)',
                                        color: 'var(--accent-gold)',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      +{hName}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Reset Actions Row inside Health Card */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '0.2rem' }}>
                      <button 
                        onClick={clearAllDrafts}
                        className="btn btn-secondary"
                        style={{ padding: '0.15rem 0.45rem', fontSize: '0.46rem', fontWeight: 800, height: '20px', borderRadius: '6px', cursor: 'pointer', color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.2)', background: 'transparent' }}
                      >
                        Reset Draft
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky bottom sheet picker */}
              <div 
                className={`sticky-hero-picker ${pickerExpanded ? 'expanded' : 'collapsed'}`}
                onClick={() => !pickerExpanded && setPickerExpanded(true)}
                onTouchStart={handleSheetTouchStart}
                onTouchEnd={handleSheetTouchEnd}
              >
                <div className="mobile-sheet-drag-handle" />
                <div className="picker-collapsed-bar">
                  <span>🔍 Select Hero</span>
                </div>
                
                <div className="picker-sheet-header">
                  <span className="picker-sheet-title">
                    <Search size={12} className="text-accent-blue" />
                    Browse Hero Pool
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPickerExpanded(false);
                    }}
                    className="picker-sheet-toggle-btn"
                  >
                    Collapse ✕
                  </button>
                </div>
                
                <div className="picker-expanded-content" onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    
                    {/* Search bar */}
                    <div className="rankings-search-wrapper" style={{ width: '100%' }}>
                      <Search size={14} className="rankings-search-icon" />
                      <input 
                        ref={searchInputRef}
                        type="text" 
                        value={draftSearch}
                        onChange={(e) => setDraftSearch(e.target.value)}
                        placeholder="Search hero by name or role..."
                        className="rankings-search-input"
                        style={{ padding: '0.35rem 0.5rem 0.35rem 1.85rem', fontSize: '0.62rem' }}
                      />
                    </div>

                    {/* Role filter pills */}
                    <div className="rankings-role-pills" style={{ margin: 0, paddingBottom: '0.1rem' }}>
                      {['All', 'Marksman', 'Tank', 'Assassin', 'Fighter', 'Mage', 'Support'].map(role => (
                        <button 
                          key={role}
                          onClick={() => setDraftRoleFilter(role)}
                          className={`rankings-role-pill ${draftRoleFilter === role ? 'active' : ''}`}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.52rem' }}
                        >
                          {role}
                        </button>
                      ))}
                    </div>

                  </div>

                  {/* Recent Picks Row */}
                  {recentPicks && recentPicks.length > 0 && (
                    <div className="picker-recent-picks-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.45rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Picks</span>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '0.1rem' }}>
                        {recentPicks.map(id => {
                          const hero = heroes ? heroes.find(h => h.id === id) : null;
                          if (!hero) return null;
                          const isDrafted = isHeroDrafted(hero.id);
                          return (
                            <div
                              key={hero.id}
                              onClick={() => {
                                if (!isDrafted) {
                                  selectHeroForActiveSlot(hero);
                                  setDraftSearch('');
                                  const newAllyDraft = [...allyDraft];
                                  const newEnemyDraft = [...enemyDraft];
                                  if (activeDraftSlot.team === 'ally') {
                                    newAllyDraft[activeDraftSlot.index] = hero;
                                  } else {
                                    newEnemyDraft[activeDraftSlot.index] = hero;
                                  }
                                  const hasEmptySlots = newAllyDraft.includes(null) || newEnemyDraft.includes(null);
                                  if (!hasEmptySlots) {
                                    setPickerExpanded(false);
                                  }
                                }
                              }}
                              className={`picker-recent-pick-avatar-wrapper ${isDrafted ? 'drafted' : ''}`}
                              style={{
                                position: 'relative',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                opacity: isDrafted ? 0.45 : 1,
                                pointerEvents: isDrafted ? 'none' : 'auto',
                                border: '1.5px solid var(--border-light)',
                                boxSizing: 'border-box'
                              }}
                            >
                              <SmartImage
                                src={hero.avatar_url}
                                alt={hero.name}
                                fallbackType="hero"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Compact Roster Grid */}
                  <div className="dense-hero-pool-grid" style={{ maxHeight: '160px', overflowY: 'auto', paddingRight: '0.1rem' }}>
                    {filteredDraftHeroes.map(hero => {
                      const isDrafted = isHeroDrafted(hero.id);
                      return (
                        <div 
                          key={hero.id}
                          onClick={() => {
                            if (!isDrafted) {
                              selectHeroForActiveSlot(hero);
                              setDraftSearch(''); // clear search input!
                              // If there are still empty slots, do NOT collapse sheet!
                              const newAllyDraft = [...allyDraft];
                              const newEnemyDraft = [...enemyDraft];
                              if (activeDraftSlot.team === 'ally') {
                                newAllyDraft[activeDraftSlot.index] = hero;
                              } else {
                                newEnemyDraft[activeDraftSlot.index] = hero;
                              }
                              const hasEmptySlots = newAllyDraft.includes(null) || newEnemyDraft.includes(null);
                              if (!hasEmptySlots) {
                                setPickerExpanded(false);
                              }
                            }
                          }}
                          className={`dense-hero-tile ${isDrafted ? 'drafted' : ''}`}
                          style={{
                            opacity: isDrafted ? 0.45 : 1,
                            pointerEvents: isDrafted ? 'none' : 'auto'
                          }}
                        >
                           <SmartImage 
                             src={hero.avatar_url} 
                             alt={hero.name} 
                             fallbackType="hero" 
                             className="dense-hero-tile-avatar" 
                           />
                          <span className="dense-hero-tile-name">{hero.name}</span>
                          {isDrafted ? (
                            <span className="dense-hero-tile-lane-badge picked" style={{ background: 'var(--text-muted)' }}>PICKED</span>
                          ) : (
                            <>
                              <span className="dense-hero-tile-role">{hero.role.substring(0, 3)}</span>
                              {hero.lane && <span className="dense-hero-tile-lane-badge">{hero.lane.substring(0, 3)}</span>}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          );
        })()}
        {!loading && activeTab === 'builds' && (
          <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            

            <div className="pro-items-list-container">

              

              {/* Category tabs */}

              <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>

                {['All', 'Attack', 'Magic', 'Defense', 'Movement'].map(cat => (

                  <button 

                    key={cat}

                    onClick={() => setBuildTabFilter(cat)}

                    className={`btn ${buildTabFilter === cat ? 'btn-primary' : 'btn-secondary'}`}

                    style={{ borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.65rem' }}

                  >

                    {cat}

                  </button>

                ))}

              </div>



              {/* Items Search input */}

              <div className="input-field-wrapper">

                <Search className="input-field-icon" size={16} />

                <input 

                  type="text" 

                  value={buildSearchQuery}

                  onChange={(e) => setBuildSearchQuery(e.target.value)}

                  placeholder="Search equipment by name or passive..."

                  className="input-field"

                />

              </div>



              {/* Grid lists */}

              <div className="pro-items-directory-grid">

                {filteredEquipment.map(item => (

                  <div 

                    key={item.id} 

                    onClick={() => setSelectedEquipment(item)}

                    className="directory-item-card animate-fadeIn"

                    style={{

                      display: 'flex',

                      gap: '0.75rem',

                      alignItems: 'start',

                      padding: '0.85rem',

                      background: 'var(--bg-card)',

                      border: '1px solid var(--border-light)',

                      borderRadius: '12px',

                      overflow: 'hidden',

                      cursor: 'pointer',

                      transition: 'transform 0.2s ease, border-color 0.2s ease'

                    }}

                  >

                    {/* Item Icon */}

                    <div style={{ flexShrink: 0 }}>

                      <SmartImage src={item.icon} alt={item.name} className="directory-item-icon" fallbackType="item" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />

                    </div>



                    {/* Item Info */}

                    <div className="directory-item-info" style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', width: '100%' }}>

                        <h4 className="directory-item-name" style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{item.name}</h4>

                        {(() => {

                          const cat = item.category;

                          let color = '#ef4444';

                          let bg = 'rgba(239, 68, 68, 0.08)';

                          if (cat === 'Magic') { color = '#3b82f6'; bg = 'rgba(37, 99, 235, 0.08)'; }

                          if (cat === 'Defense') { color = '#10b981'; bg = 'rgba(16, 185, 129, 0.08)'; }

                          if (cat === 'Movement') { color = '#a855f7'; bg = 'rgba(168, 85, 247, 0.08)'; }

                          

                          return (

                            <span 

                              style={{ 

                                fontSize: '0.52rem', 

                                fontWeight: 900, 

                                color: color, 

                                background: bg,

                                padding: '0.15rem 0.35rem',

                                borderRadius: '6px',

                                textTransform: 'uppercase',

                                letterSpacing: '0.5px',

                                flexShrink: 0

                              }}

                            >

                              {cat}

                            </span>

                          );

                        })()}

                      </div>



                      {/* Formatted Stats Capsules List */}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>

                        {item.stats.split(',').map((stat, sIdx) => {

                          const trimmed = stat.trim();

                          if (!trimmed) return null;

                          

                          // Highlight color selection based on text

                          let dotColor = '#fbbf24'; // Gold default

                          if (trimmed.toLowerCase().includes('attack')) dotColor = '#f87171'; // Red for Attack

                          if (trimmed.toLowerCase().includes('magic') || trimmed.toLowerCase().includes('mana')) dotColor = '#60a5fa'; // Blue for Magic

                          if (trimmed.toLowerCase().includes('defense') || trimmed.toLowerCase().includes('hp')) dotColor = '#34d399'; // Green for Defense

                          if (trimmed.toLowerCase().includes('speed') || trimmed.toLowerCase().includes('cd') || trimmed.toLowerCase().includes('movement')) dotColor = '#c084fc'; // Purple for Speed

                          

                          return (

                            <span 

                              key={sIdx} 

                              style={{ 

                                fontSize: '0.55rem', 

                                fontWeight: 800, 

                                color: 'var(--text-secondary)', 

                                background: 'rgba(255,255,255,0.03)',

                                border: '1px solid var(--border-light)',

                                padding: '0.15rem 0.4rem',

                                borderRadius: '6px',

                                display: 'flex',

                                alignItems: 'center',

                                gap: '0.25rem',

                                whiteSpace: 'normal'

                              }}

                            >

                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: dotColor }} />

                              {trimmed}

                            </span>

                          );

                        })}

                      </div>



                      {/* Item Passive */}

                      <p className="directory-item-passive" style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0.25rem 0 0 0' }}>

                        {item.passive}

                      </p>

                    </div>

                  </div>

                ))}

              </div>



            </div>

          </div>

        )}



        {/* TAB 5: HERO RANKINGS PAGE */}

        {!loading && activeTab === 'rankings' && (() => {
          const RANK_OPTIONS = [
            { value: "101", label: "All Ranks" },
            { value: "9", label: "Mythical Glory+" },
            { value: "8", label: "Mythical Honor" },
            { value: "7", label: "Mythic" },
            { value: "6", label: "Legend" },
            { value: "5", label: "Epic" }
          ];

          // Build merged stats lookup from hero_meta_stats
          const metaLookup = {};

          HERO_META_STATS.forEach(h => {

            metaLookup[h.name.toLowerCase()] = h;

          });



          const mergedHeroes = heroes.map(hero => {
            const meta = metaLookup[hero.name.toLowerCase()];
            let winRate = 50.0;
            let pickRate = 0.0;
            let banRate = 0.0;

            if (meta) {
              const history = meta.history || {};
              const periodStats = history[rankingsDaysFilter] || {};
              const rankStats = periodStats[rankingsRankFilter];
              if (rankStats) {
                winRate = rankStats.win_rate;
                pickRate = rankStats.pick_rate;
                banRate = rankStats.ban_rate;
              } else {
                const stats = meta.rank_stats?.[rankingsRankFilter] ?? {
                  win_rate: meta.win_rate != null ? meta.win_rate : 50,
                  pick_rate: meta.pick_rate != null ? meta.pick_rate : 0,
                  ban_rate: meta.ban_rate != null ? meta.ban_rate : 0
                };
                winRate = stats.win_rate;
                pickRate = stats.pick_rate;
                banRate = stats.ban_rate;
              }
            } else {
              const stats = hero.rank_stats?.[rankingsRankFilter] ?? {
                win_rate: hero.win_rate != null ? hero.win_rate : 50,
                pick_rate: hero.pick_rate != null ? hero.pick_rate : 0,
                ban_rate: hero.ban_rate != null ? hero.ban_rate : 0
              };
              winRate = stats.win_rate;
              pickRate = stats.pick_rate;
              banRate = stats.ban_rate;
            }

            return {
              ...hero,
              win_rate: winRate,
              pick_rate: pickRate,
              ban_rate: banRate,
              tier: hero.tier || (meta ? meta.tier : 'B'),
              lane: hero.lane || (meta ? meta.lane : ''),
              roles: hero.roles || (meta ? meta.roles : [hero.role])
            };
          });



          // Also include heroes from meta stats that aren't in the heroes state

          HERO_META_STATS.forEach(metaHero => {

            const exists = mergedHeroes.some(h => h.name.toLowerCase() === metaHero.name.toLowerCase());

            if (!exists) {

              let winRate = 50.0;
              let pickRate = 0.0;
              let banRate = 0.0;

              const history = metaHero.history || {};
              const periodStats = history[rankingsDaysFilter] || {};
              const rankStats = periodStats[rankingsRankFilter];
              if (rankStats) {
                winRate = rankStats.win_rate;
                pickRate = rankStats.pick_rate;
                banRate = rankStats.ban_rate;
              } else {
                const stats = metaHero.rank_stats?.[rankingsRankFilter] ?? {
                  win_rate: metaHero.win_rate != null ? metaHero.win_rate : 50,
                  pick_rate: metaHero.pick_rate != null ? metaHero.pick_rate : 0,
                  ban_rate: metaHero.ban_rate != null ? metaHero.ban_rate : 0
                };
                winRate = stats.win_rate;
                pickRate = stats.pick_rate;
                banRate = stats.ban_rate;
              }

              mergedHeroes.push({

                id: metaHero.slug,

                name: metaHero.name,

                role: metaHero.role,

                avatar_url: metaHero.avatar_url,

                cover_thumb: metaHero.cover_thumb,

                win_rate: winRate,

                pick_rate: pickRate,

                ban_rate: banRate,

                tier: metaHero.tier,

                lane: metaHero.lane,

                roles: metaHero.roles

              });

            }

          });



          // Filter by search and role

          const filtered = mergedHeroes.filter(hero => {

            const matchSearch = hero.name.toLowerCase().includes(rankingsSearch.toLowerCase()) ||

              hero.role.toLowerCase().includes(rankingsSearch.toLowerCase());

            const matchRole = rankingsRoleFilter === 'All' || hero.role === rankingsRoleFilter;

            return matchSearch && matchRole;

          });



          // Sort based on active sub-tab

          const sorted = [...filtered].sort((a, b) => {

            if (rankingsSubTab === 'ban') return b.ban_rate - a.ban_rate;

            if (rankingsSubTab === 'win') return b.win_rate - a.win_rate;

            return b.pick_rate - a.pick_rate;

          });



          // Compute max values for bar scaling

          const maxBan = Math.max(...mergedHeroes.map(h => h.ban_rate), 1);

          const maxWin = Math.max(...mergedHeroes.map(h => h.win_rate), 1);

          const maxPick = Math.max(...mergedHeroes.map(h => h.pick_rate), 1);



          // Top stat heroes

          const topBanned = [...mergedHeroes].sort((a, b) => b.ban_rate - a.ban_rate)[0];

          const topWinRate = [...mergedHeroes].sort((a, b) => b.win_rate - a.win_rate)[0];

          const topPicked = [...mergedHeroes].sort((a, b) => b.pick_rate - a.pick_rate)[0];



          const getRoleDotColor = (role) => {

            const colors = {

              'Marksman': '#ef4444', 'Assassin': '#8b5cf6', 'Fighter': '#f59e0b',

              'Mage': '#3b82f6', 'Tank': '#10b981', 'Support': '#ec4899'

            };

            return colors[role] || '#94a3b8';

          };



          const getRankBadgeClass = (idx) => {

            if (idx === 0) return 'gold';

            if (idx === 1) return 'silver';

            if (idx === 2) return 'bronze';

            return 'default';

          };



          const getTierBadgeClass = (tier) => {

            if (tier === 'S+') return 's-plus';

            if (tier === 'S') return 's';

            if (tier === 'A') return 'a';

            if (tier === 'B') return 'b';

            return 'c';

          };



          const getBanClass = (rate) => rate >= 20 ? 'high-ban' : rate >= 5 ? 'mid-ban' : 'low-ban';

          const getWinClass = (rate) => rate >= 53 ? 'high-win' : rate >= 50 ? 'mid-win' : 'low-win';

          const getPickClass = (rate) => rate >= 3 ? 'high-pick' : rate >= 1 ? 'mid-pick' : 'low-pick';



          const rateLabel = rankingsSubTab === 'ban' ? 'Ban Rate' : rankingsSubTab === 'win' ? 'Win Rate' : 'Pick Rate';

          const rateKey = rankingsSubTab === 'ban' ? 'ban_rate' : rankingsSubTab === 'win' ? 'win_rate' : 'pick_rate';

          const maxRate = rankingsSubTab === 'ban' ? maxBan : rankingsSubTab === 'win' ? maxWin : maxPick;

          const rateClassFn = rankingsSubTab === 'ban' ? getBanClass : rankingsSubTab === 'win' ? getWinClass : getPickClass;

          const barType = rankingsSubTab;



          return (

            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>



              {/* Page Header */}

              <div className="rankings-page-header">

                <h2 className="rankings-page-title">

                  <Trophy size={20} className="text-accent-blue" />

                  Hero Rankings

                </h2>

                <p className="rankings-page-sub">

                  Comprehensive hero tier rankings compiled from Mythic+ ranked data — sorted by ban rate, win rate, and pick rate.

                </p>

              </div>



              {/* Stats Summary Cards */}

              <div className="rankings-stats-summary">

                 <div 
                  className="rankings-stat-card" 
                  onClick={() => setRankingsSubTab('ban')} 
                  style={{ 
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundImage: topBanned?.id ? `var(--rankings-card-overlay), url(/assets/banners/hero_${topBanned.id}.webp?v=3)` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >

                  <div className="rankings-stat-icon red">

                    <ShieldAlert size={14} />

                  </div>

                  <span className="rankings-stat-label">Most Banned</span>

                  <span className="rankings-stat-value" style={{ color: 'var(--accent-red)', fontSize: '0.82rem' }}>

                    {topBanned ? topBanned.name : '—'}

                  </span>

                  <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--accent-red)' }}>

                    {topBanned ? `${topBanned.ban_rate.toFixed(1)}%` : ''}

                  </span>

                </div>

                <div 
                  className="rankings-stat-card" 
                  onClick={() => setRankingsSubTab('win')} 
                  style={{ 
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundImage: topWinRate?.id ? `var(--rankings-card-overlay), url(/assets/banners/hero_${topWinRate.id}.webp?v=3)` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >

                  <div className="rankings-stat-icon green">

                    <TrendingUp size={14} />

                  </div>

                  <span className="rankings-stat-label">Highest Win</span>

                  <span className="rankings-stat-value" style={{ color: 'var(--accent-green)', fontSize: '0.82rem' }}>

                    {topWinRate ? topWinRate.name : '—'}

                  </span>

                  <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--accent-green)' }}>

                    {topWinRate ? `${topWinRate.win_rate.toFixed(1)}%` : ''}

                  </span>

                </div>

                <div 
                  className="rankings-stat-card" 
                  onClick={() => setRankingsSubTab('pick')} 
                  style={{ 
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundImage: topPicked?.id ? `var(--rankings-card-overlay), url(/assets/banners/hero_${topPicked.id}.webp?v=3)` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >

                  <div className="rankings-stat-icon blue">

                    <Eye size={14} />

                  </div>

                  <span className="rankings-stat-label">Most Picked</span>

                  <span className="rankings-stat-value" style={{ color: 'var(--accent-blue)', fontSize: '0.82rem' }}>

                    {topPicked ? topPicked.name : '—'}

                  </span>

                  <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--accent-blue)' }}>

                    {topPicked ? `${topPicked.pick_rate.toFixed(1)}%` : ''}

                  </span>

                </div>

              </div>



              {/* Sub-Tabs */}

              <div className="rankings-subtabs">

                <button

                  className={`rankings-subtab-btn ${rankingsSubTab === 'ban' ? 'active' : ''}`}

                  onClick={() => setRankingsSubTab('ban')}

                >

                  <ShieldAlert size={13} /> Ban Rate

                </button>

                <button

                  className={`rankings-subtab-btn ${rankingsSubTab === 'win' ? 'active' : ''}`}

                  onClick={() => setRankingsSubTab('win')}

                >

                  <TrendingUp size={13} /> Win Rate

                </button>

                <button

                  className={`rankings-subtab-btn ${rankingsSubTab === 'pick' ? 'active' : ''}`}

                  onClick={() => setRankingsSubTab('pick')}

                >

                  <Eye size={13} /> Pick Rate

                </button>

              </div>

              {/* Rank & Days Filters */}
              <div className="rankings-filters-row" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', width: '100%', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: '140px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Rank Tier</label>
                  <select 
                    value={rankingsRankFilter} 
                    onChange={(e) => setRankingsRankFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {RANK_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} style={{ backgroundColor: '#111827' }}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: '140px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Time Period</label>
                  <select 
                    value={rankingsDaysFilter} 
                    onChange={(e) => setRankingsDaysFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="1d" style={{ backgroundColor: '#111827' }}>Last 1 Day</option>
                    <option value="7d" style={{ backgroundColor: '#111827' }}>Last 7 Days</option>
                    <option value="30d" style={{ backgroundColor: '#111827' }}>Last 30 Days</option>
                  </select>
                </div>
              </div>



              {/* Search Bar */}

              <div className="rankings-search-wrapper">

                <Search size={14} className="rankings-search-icon" />

                <input

                  type="text"

                  className="rankings-search-input"

                  placeholder="Search hero by name or role..."

                  value={rankingsSearch}

                  onChange={(e) => setRankingsSearch(e.target.value)}

                />

              </div>



              {/* Role Filter Pills */}

              <div className="rankings-role-pills">

                {['All', 'Fighter', 'Marksman', 'Mage', 'Assassin', 'Tank', 'Support'].map(role => (

                  <button

                    key={role}

                    className={`rankings-role-pill ${rankingsRoleFilter === role ? 'active' : ''}`}

                    onClick={() => setRankingsRoleFilter(role)}

                  >

                    {role}

                  </button>

                ))}

              </div>



              {/* Rankings Table */}

              <div className="rankings-table-container">

                {/* Table Header */}

                <div className={`rankings-table-header rankings-table-header-${rankingsSubTab}`}>

                  <span className="rankings-th">#</span>

                  <span className="rankings-th">Hero</span>

                  <span className="rankings-th rankings-th-right">{rateLabel}</span>

                  <span className="rankings-th rankings-th-right">Tier</span>

                </div>



                {/* Table Rows */}

                {sorted.length > 0 ? sorted.map((hero, idx) => {

                  const rate = hero[rateKey] || 0;

                  const barWidth = Math.min(100, (rate / maxRate) * 100);



                  return (

                    <div

                      key={hero.id || hero.slug || idx}

                      className={`rankings-table-row rankings-table-row-${rankingsSubTab}`}

                      onClick={() => {

                        const matchHero = heroes.find(h => h.name.toLowerCase() === hero.name.toLowerCase());

                        if (matchHero) handleHeroClick(matchHero);

                      }}

                    >

                      {/* Rank Badge */}

                      <div className={`rankings-rank-badge ${getRankBadgeClass(idx)}`}>

                        {idx + 1}

                      </div>



                      {/* Hero Info */}

                      <div className="rankings-hero-info">

                        <SmartImage

                          src={hero.avatar_url}

                          alt={hero.name}

                          className="rankings-hero-avatar"

                          fallbackType="hero"

                        />

                        <div className="rankings-hero-text">

                          <span className="rankings-hero-name">{hero.name}</span>

                          <span className="rankings-hero-role">

                            <span className="rankings-role-dot" style={{ background: getRoleDotColor(hero.role) }} />

                            {hero.role} {hero.lane ? `· ${hero.lane}` : ''}

                          </span>

                        </div>

                      </div>



                      {/* Rate Cell */}

                      <div className="rankings-rate-cell">

                        <span className={`rankings-rate-value ${rateClassFn(rate)}`}>

                          {rate.toFixed(2)}%

                        </span>

                        <div className="rankings-rate-bar-track">

                          <div

                            className={`rankings-rate-bar-fill ${barType}`}

                            style={{ width: `${barWidth}%` }}

                          />

                        </div>

                      </div>



                      {/* Tier Badge */}

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>

                        <span className={`rankings-tier-badge ${getTierBadgeClass(hero.tier)}`}>

                          {hero.tier || '—'}

                        </span>

                      </div>

                    </div>

                  );

                }) : (

                  <div className="rankings-empty">

                    <div className="rankings-empty-icon">

                      <Search size={18} />

                    </div>

                    <span className="rankings-empty-text">No heroes found matching your filters.</span>

                  </div>

                )}



                {/* Table Footer */}

                {sorted.length > 0 && (

                  <div className="rankings-table-footer">
                    <span className="rankings-footer-text">
                      Ranked by {rateLabel} · {RANK_OPTIONS.find(o => o.value === rankingsRankFilter)?.label || 'Unknown'} ({rankingsDaysFilter === '1d' ? 'Last 1 Day' : rankingsDaysFilter === '7d' ? 'Last 7 Days' : 'Last 30 Days'})
                    </span>

                    <span className="rankings-footer-count">

                      {sorted.length} heroes

                    </span>

                  </div>

                )}

              </div>

            </div>

          );

        })()}



        {/* TAB 6: MORE / SETTINGS PERSONALIZATION TAB */}

        {!loading && activeTab === 'more' && (

          <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            

            {/* User credentials settings */}

            <div className="guide-panel-card">

              <h4 className="panel-card-title">Personalize Esports Badge</h4>

              

              <div className="profile-edit-body" style={{ marginTop: '0.85rem' }}>

                <div className="profile-edit-section">

                  <label className="profile-edit-label">Local Display Nickname</label>

                  <input 

                    id="local-display-nickname-settings"

                    name="nickname"

                    autocomplete="off"

                    type="text" 

                    value={playerProfile.username} 

                    onChange={(e) => setPlayerProfile({...playerProfile, username: e.target.value})}

                    className="profile-edit-input"

                  />

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="profile-edit-section">
                    <label className="profile-edit-label">Total Matches</label>
                    <input 
                      type="number" 
                      value={playerProfile.matches !== undefined ? playerProfile.matches : 1245} 
                      onChange={(e) => setPlayerProfile({...playerProfile, matches: parseInt(e.target.value) || 0})}
                      className="profile-edit-input"
                    />
                  </div>
                  <div className="profile-edit-section">
                    <label className="profile-edit-label">Win Rate (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={playerProfile.winRate !== undefined ? playerProfile.winRate : 58.7} 
                      onChange={(e) => setPlayerProfile({...playerProfile, winRate: parseFloat(e.target.value) || 0.0})}
                      className="profile-edit-input"
                    />
                  </div>
                </div>

                <div className="profile-edit-section">
                  <label className="profile-edit-label">MVP Count</label>
                  <input 
                    type="number" 
                    value={playerProfile.mvpCount !== undefined ? playerProfile.mvpCount : 284} 
                    onChange={(e) => setPlayerProfile({...playerProfile, mvpCount: parseInt(e.target.value) || 0})}
                    className="profile-edit-input"
                  />
                </div>



                <div className="profile-edit-section">

                  <label className="profile-edit-label">Select Division Crest</label>

                  <div className="badge-selector-row">

                    {RANK_TIERS.map((tier, idx) => (

                      <button

                        key={idx}

                        onClick={() => setPlayerProfile({...playerProfile, badgeIndex: idx, rank: tier.name})}

                        className={`badge-select-btn ${playerProfile.badgeIndex === idx ? 'active' : ''}`}

                      >

                        <SmartImage src={tier.icon} alt="badge" className="badge-select-img" fallbackType="item" style={{ width: '24px', height: '24px' }} />

                        <span className="badge-select-lbl">{tier.name}</span>

                      </button>

                    ))}

                  </div>

                </div>



                <div className="profile-edit-section">

                  <label className="profile-edit-label">Division Stars</label>

                  <div className="stepper-row">

                    <button 

                      onClick={() => setPlayerProfile({...playerProfile, stars: Math.max(0, playerProfile.stars - 1)})}

                      className="stepper-btn"

                    >

                      -

                    </button>

                    <span className="stepper-val">{playerProfile.stars} Stars</span>

                    <button 

                      onClick={() => setPlayerProfile({...playerProfile, stars: playerProfile.stars + 1})}

                      className="stepper-btn"

                    >

                      +

                    </button>

                  </div>

                </div>

              </div>

            </div>



            {/* Platform Language settings */}
            <div className="guide-panel-card">
              <h4 className="panel-card-title">Select App Language</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.85rem' }}>
                {LANGUAGES_LIST.map(l => (
                  <button
                    key={l.code}
                    disabled={l.disabled}
                    onClick={() => !l.disabled && setLang(l.code)}
                    className={`btn ${lang === l.code ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ 
                      padding: '0.65rem', 
                      borderRadius: '12px', 
                      fontSize: '0.68rem', 
                      fontWeight: 700,
                      opacity: l.disabled ? 0.5 : 1,
                      cursor: l.disabled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Theme settings */}
            <div className="guide-panel-card">
              <h4 className="panel-card-title">Select App Theme</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', marginTop: '0.85rem' }}>
                <button
                  onClick={() => setTheme('system')}
                  className={`btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.65rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Monitor size={14} /> System
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.65rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Sun size={14} /> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.65rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Moon size={14} /> Dark
                </button>
              </div>
            </div>



            {/* Developer credentials */}

            <div className="guide-panel-card">

              <h4 className="panel-card-title">Quick Navigation</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.85rem' }}>

                <button

                  onClick={() => setActiveTab('builds')}

                  className="btn btn-secondary"

                  style={{ padding: '0.75rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}

                >

                  <Zap size={14} /> Pro Builds

                </button>

                <button

                  onClick={() => setShowSpellsModal(true)}

                  className="btn btn-secondary"

                  style={{ padding: '0.75rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}

                >

                  <Shield size={14} /> Spells Guide

                </button>

              </div>

            </div>



            {/* Developer credentials */}

            <div className="guide-panel-card">

              <h4 className="panel-card-title">MythicIQ Specifications</h4>

              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: '0.75rem' }}>

                MythicIQ is an independent static PWA utility. It utilizes compile-time Python scraping and CDN hotlinks to present real-time esports guide metadata under a 100% serverless, zero-cost architecture.

              </p>

            </div>



          </div>

        )}



        {!loading && activeTab === 'battle' && (

          <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '90px' }}>

            {/* Header */}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexShrink: 0 }}>

              <h3 className="modal-hero-name" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 0, color: 'var(--text-primary)' }}>

                <ShieldAlert size={18} className="text-accent-blue animate-pulse" />

                Battle Status Analyzer

              </h3>

            </div>



            {/* Search and Hero Selector */}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', flexShrink: 0, position: 'relative' }}>

              <div style={{ position: 'relative' }}>

                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />

                <input 

                  type="text" 

                  className="search-input" 

                  placeholder="Type to search heroes..." 

                  value={battleSearchQuery} 

                  onChange={(e) => setBattleSearchQuery(e.target.value)} 

                  style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.72rem', background: 'var(--bg-input)', color: 'var(--text-primary)' }}

                />

                {battleSearchQuery && (

                  <button onClick={() => setBattleSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>

                    <X size={12} />

                  </button>

                )}

              </div>



              {/* Dynamic search results list or fallback selector scrollbar */}

              {battleSearchQuery ? (

                <div style={{ position: 'absolute', top: '38px', left: '0', right: '0', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>

                  {(() => {

                    const matched = heroes.filter(h => h.name.toLowerCase().includes(battleSearchQuery.toLowerCase()));

                    if (matched.length === 0) {

                      return <div style={{ padding: '0.5rem', fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>No heroes found</div>;

                    }

                    return matched.map(h => (

                      <button

                        key={h.id}

                        onClick={() => {

                          setBattleStatusHeroId(h.id);

                          setBattleSearchQuery('');

                        }}

                        style={{ width: '100%', padding: '0.5rem 0.75rem', border: 'none', background: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}

                        className="battle-search-result-row"

                      >

                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden' }}>

                          <SmartImage src={h.avatar_url} alt={h.name} fallbackType="hero" />

                        </div>

                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{h.name}</span>

                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{h.role}</span>

                      </button>

                    ));

                  })()}

                </div>

              ) : (

                /* Compact Horizontal Scroller */

                <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="hero-compact-scroller">

                  {heroes.map(h => {

                    const isSelected = h.id === battleStatusHeroId;

                    return (

                      <button

                        key={h.id}

                        onClick={() => setBattleStatusHeroId(h.id)}

                        style={{ flexShrink: 0, border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', cursor: 'pointer', padding: '0.15rem' }}

                      >

                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--border-light)', boxShadow: isSelected ? '0 0 6px var(--accent-blue-glow)' : 'none', transition: 'all 0.2s ease' }}>

                          <SmartImage src={h.avatar_url} alt={h.name} fallbackType="hero" />

                        </div>

                        <span style={{ fontSize: '0.5rem', fontWeight: isSelected ? 800 : 500, color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)', maxWidth: '40px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>

                      </button>

                    );

                  })}

                </div>

              )}

            </div>



            {/* Active Selected Hero Detail Banner Card */}

            {(() => {

              const activeHero = heroes.find(h => h.id === battleStatusHeroId) || heroes[0];

              if (!activeHero) return null;

              const activeHeroMeta = HERO_META_STATS.find(m => m.name.toLowerCase() === activeHero.name.toLowerCase()) || {};

              const { counters, weakAgainst, synergy, leastSynergy, rawSynergy, rawCounters } = resolveMatchupsForHero(activeHero.id);



              return (

                <React.Fragment>

                  {/* Hero Summary Card */}

                  <div className="battle-hero-profile-card animate-fadeIn" style={{ flexShrink: 0, overflow: 'visible' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 5 }}>

                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border-light)', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>

                        <SmartImage src={activeHero.avatar_url} alt={activeHero.name} fallbackType="hero" />

                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>

                        <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>

                           {activeHero.name}

                          <span style={{ fontSize: '0.55rem', background: 'var(--accent-blue)', color: '#ffffff', padding: '0.05rem 0.3rem', borderRadius: '4px', letterSpacing: '0.05em' }}>

                            TIER {activeHeroMeta.tier || 'A'}

                          </span>

                        </h4>

                        <span style={{ fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600 }}>

                          {activeHero.role} · {activeHero.lane || activeHeroMeta.lane || 'Roam Lane'}

                        </span>

                      </div>

                    </div>



                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.85rem', position: 'relative', zIndex: 5, background: 'rgba(255,255,255,0.08)', padding: '0.45rem 0.6rem', borderRadius: '8px' }}>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                        <span style={{ fontSize: '0.5rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700, textTransform: 'uppercase' }}>Win Rate</span>

                        <strong style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 900 }}>{activeHero.win_rate || activeHeroMeta.win_rate || 50.0}%</strong>

                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>

                        <span style={{ fontSize: '0.5rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700, textTransform: 'uppercase' }}>Pick Rate</span>

                        <strong style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 900 }}>{activeHero.pick_rate || activeHeroMeta.pick_rate || 1.2}%</strong>

                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                        <span style={{ fontSize: '0.5rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700, textTransform: 'uppercase' }}>Ban Rate</span>

                        <strong style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 900 }}>{activeHero.ban_rate || activeHeroMeta.ban_rate || 5.0}%</strong>

                      </div>

                    </div>



                    <div className="profile-header-bg-art" style={{ zIndex: 2, pointerEvents: 'none', right: '-15px', top: '-40px' }}>
                      <img 
                        src={activeHero.id ? `/assets/banners/hero_${activeHero.id}_transparent.webp?v=3` : (activeHero.cover_transparent && activeHero.cover_transparent.includes('_transparent.webp') ? `${activeHero.cover_transparent}?v=3` : (activeHero.cover_transparent || activeHero.cover_thumb || activeHero.avatar_url))} 
                        alt="Hero Character" 
                        onError={(e) => {
                          e.target.src = activeHero.avatar_url || '';
                        }}
                      />
                    </div>
                  </div>



                  {/* Sub Tab Navigation inside screen */}

                  <div className="battle-subtabs-row" style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid var(--border-light)', margin: '0.75rem 0 0.5rem 0', paddingBottom: '0.35rem' }}>

                    {[

                      { key: 'counters', label: "Best Counters" },

                      { key: 'teammates', label: "Best Teammate" }

                    ].map(tab => (

                      <button

                        key={tab.key}

                        onClick={() => {

                          setBattleStatusSubTab(tab.key);

                          setShowAllMatchups(false);

                        }}

                        style={{ border: 'none', background: 'none', flex: 1, padding: '0.4rem 0', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}

                      >

                        <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: battleStatusSubTab === tab.key || (battleStatusSubTab === 'weak_against' && tab.key === 'counters') ? 'var(--text-primary)' : 'var(--text-muted)' }}>

                          {tab.label}

                        </span>

                        {(battleStatusSubTab === tab.key || (battleStatusSubTab === 'weak_against' && tab.key === 'counters')) && (

                          <div style={{ position: 'absolute', bottom: '-6px', width: '60px', height: '2.5px', backgroundColor: 'var(--accent-blue)', borderRadius: '2px' }} />

                        )}

                      </button>

                    ))}

                  </div>



                  {/* Dynamic View: Spectrum or Expanded List */}

                  {!showAllMatchups ? (

                    /* 1. Official Moonton Horizontal Spectrum View */

                    <div className="battle-spectrum-container animate-fadeIn" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem', padding: '0.5rem 0' }}>

                      <div className="battle-spectrum-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.2rem', position: 'relative', background: 'rgba(15, 23, 42, 0.05)', padding: '0.75rem 0.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>

                        {(() => {

                          const leftList = battleStatusSubTab === 'teammates' 

                            ? leastSynergy.slice(0, 3).reverse()

                            : counters.slice(0, 3).reverse();

                          

                          const rightList = battleStatusSubTab === 'teammates' 

                            ? synergy.slice(0, 3) 

                            : weakAgainst.slice(0, 3);

                          

                          return (

                            <React.Fragment>

                              {/* Left Side */}

                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end', justifyContent: 'space-around', flexGrow: 1, maxWidth: '40%' }}>

                                {leftList.map((item, idx) => {

                                  const displayScore = item.score < 0 ? item.score.toFixed(2) : `-${item.score.toFixed(2)}`;

                                  return (

                                    <div 

                                      key={`left-${item.name}-${idx}`} 

                                      onClick={() => {

                                        const h = heroes.find(x => x.name.toLowerCase() === item.name.toLowerCase() || x.id === item.id);

                                        if (h) handleHeroClick(h);

                                      }}

                                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', position: 'relative', width: '32px' }}

                                    >

                                      <span style={{ fontSize: '0.52rem', fontWeight: 800, color: 'var(--text-muted)' }}>{displayScore}</span>

                                      <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>

                                        <SmartImage src={item.avatar_url} alt={item.name} fallbackType="hero" />

                                      </div>

                                      <div style={{ width: '100%', height: '3px', background: 'rgba(239, 68, 68, 0.75)', borderRadius: '1.5px', marginTop: '0.1rem' }} />

                                    </div>

                                  );

                                })}

                              </div>



                              {/* Center */}

                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', zIndex: 10, width: '64px', margin: '0 0.5rem' }}>

                                <div style={{ width: '52px', height: '52px', borderRadius: '8px', overflow: 'hidden', border: '3px solid var(--accent-blue)', boxShadow: '0 0 10px var(--accent-blue-glow)' }}>

                                  <SmartImage src={activeHero.avatar_url} alt={activeHero.name} fallbackType="hero" />

                                </div>

                                <button 

                                  onClick={() => setShowAllMatchups(true)} 

                                  style={{ border: 'none', background: 'none', color: 'var(--accent-blue)', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}

                                  type="button"

                                >

                                  Show All &gt;

                                </button>

                              </div>



                              {/* Right Side */}

                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end', justifyContent: 'space-around', flexGrow: 1, maxWidth: '40%' }}>

                                {rightList.map((item, idx) => {

                                  const displayScore = item.score > 0 ? `+${item.score.toFixed(2)}` : item.score.toFixed(2);

                                  return (

                                    <div 

                                      key={`right-${item.name}-${idx}`} 

                                      onClick={() => {

                                        const h = heroes.find(x => x.name.toLowerCase() === item.name.toLowerCase() || x.id === item.id);

                                        if (h) handleHeroClick(h);

                                      }}

                                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', position: 'relative', width: '32px' }}

                                    >

                                      <span style={{ fontSize: '0.52rem', fontWeight: 800, color: 'var(--text-muted)' }}>{displayScore}</span>

                                      <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>

                                        <SmartImage src={item.avatar_url} alt={item.name} fallbackType="hero" />

                                      </div>

                                      <div style={{ width: '100%', height: '3px', background: 'rgba(16, 185, 129, 0.75)', borderRadius: '1.5px', marginTop: '0.1rem' }} />

                                    </div>

                                  );

                                })}

                              </div>

                            </React.Fragment>

                          );

                        })()}

                      </div>



                      {/* Spectrum Labels Indicator */}

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem', flexShrink: 0 }}>

                        <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase' }}>

                          {battleStatusSubTab === 'teammates' ? "Least Synergy" : "Strong Against"}

                        </span>

                        <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase' }}>

                          {battleStatusSubTab === 'teammates' ? "Best Teammate" : "Weak Against"}

                        </span>

                      </div>

                    </div>

                  ) : (

                    /* 2. Expanded Vertical Detailed Lists View */

                    <React.Fragment>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0.5rem', flexShrink: 0 }}>

                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 800 }}>Showing all matchup calculations</span>

                        <button 

                          onClick={() => setShowAllMatchups(false)} 

                          style={{ border: 'none', background: 'none', color: 'var(--accent-blue)', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}

                          type="button"

                        >

                          &lt; Show Spectrum

                        </button>

                      </div>



                      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.2rem' }}>

                        {(() => {

                          const baseList = battleStatusSubTab === 'teammates' ? rawSynergy : rawCounters;
                          const existingIds = new Set(baseList.map(item => Number(item.id)).filter(Boolean));
                          const missingItems = heroes
                            .filter(h => h.id !== activeHero.id && !existingIds.has(Number(h.id)))
                            .map(h => {
                              const meta = HERO_META_STATS.find(m => m.name.toLowerCase() === h.name.toLowerCase()) || {};
                              return {
                                id: h.id,
                                name: h.name,
                                avatar_url: h.avatar_url,
                                role: h.role,
                                lane: h.lane || meta.lane || 'Lane',
                                tier: meta.tier || 'A',
                                win_rate: h.win_rate || 50,
                                reason: battleStatusSubTab === 'teammates' 
                                  ? `Neutral synergy partner for ${activeHero.name}.`
                                  : `Neutral matchup dynamic with ${activeHero.name}.`,
                                score: 0.0
                              };
                            });

                          const verticalList = [...baseList, ...missingItems]

                            .sort((a, b) => b.score - a.score);



                          return verticalList.map((item, idx) => {

                            const isPositive = item.score > 0;

                            const scoreVal = item.score;

                            const displayScore = scoreVal > 0 ? `+${scoreVal.toFixed(2)}` : scoreVal.toFixed(2);

                            const barPercent = Math.min(100, Math.max(10, (Math.abs(scoreVal) / 4.0) * 100));

                            

                            const barColor = isPositive 

                              ? (battleStatusSubTab === 'teammates' ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : 'linear-gradient(90deg, #10b981, #059669)')

                              : 'linear-gradient(90deg, #ef4444, #dc2626)';



                            return (

                              <div 

                                key={`${item.id}-${item.name}-${idx}`} 

                                className="battle-row-card animate-fadeIn"

                                onClick={() => {

                                  const nextHero = heroes.find(h => h.id === item.id || h.name.toLowerCase() === item.name.toLowerCase());

                                  if (nextHero) handleHeroClick(nextHero);

                                }}

                                style={{ cursor: 'pointer' }}

                              >

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>

                                  <div className={`battle-rank-badge rank-${idx + 1}`} style={{ fontSize: '0.62rem', fontWeight: 900, width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>

                                    #{idx + 1}

                                  </div>

                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-light)' }}>

                                    <SmartImage src={item.avatar_url} alt={item.name} fallbackType="hero" />

                                  </div>

                                </div>



                                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.1rem', maxWidth: '58%' }}>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>

                                    <strong style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>{item.name}</strong>

                                    <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{item.role}</span>

                                  </div>

                                  <span style={{ fontSize: '0.55rem', color: 'var(--accent-blue)', fontWeight: 600 }}>{item.lane}</span>

                                </div>



                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', minWidth: '70px' }}>

                                  <strong style={{ fontSize: '0.68rem', color: isPositive ? (battleStatusSubTab === 'teammates' ? '#3b82f6' : '#10b981') : '#ef4444', fontWeight: 800 }}>

                                    {displayScore}

                                  </strong>

                                  <div style={{ width: '60px', height: '5px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>

                                    <div style={{ width: `${barPercent}%`, height: '100%', background: barColor, borderRadius: '3px' }} />

                                  </div>

                                  <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>WR: {(item.win_rate || 50).toFixed(1)}%</span>

                                </div>

                              </div>

                            );

                          });

                        })()}

                      </div>

                    </React.Fragment>

                  )}



                  {/* Footnote Explanation */}

                  <div style={{ flexShrink: 0, marginTop: '0.55rem', textAlign: 'center', padding: '0.35rem 0.5rem', background: 'rgba(15, 23, 42, 0.03)', borderRadius: '6px' }}>

                    <p style={{ fontSize: '0.52rem', color: 'var(--text-muted)', lineHeight: 1.3, margin: 0 }}>

                      Counter and synergy data are from Epic rank and above matches. The further to the right, the more the selected hero counters/synergizes with the other hero.

                    </p>

                  </div>

                </React.Fragment>

              );

            })()}

          </div>

        )}



      </main>

      {/* ======================================================== */}
      {/* 2. TABBED ASYNCHRONOUS HERO DETAILS MODAL OVERLAYS       */}
      {/* ======================================================== */}
      {selectedHero && (
        <div className="modal-backdrop" onClick={closeHeroDetails}>
          <div className="modal-content premium-gaming-modal" onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Fixed Hero Painting - Bottom Right Corner */}
            <img
              src={`/assets/paintings/hero_${selectedHero.id}.webp?v=3`}
              alt=""
              className="modal-fixed-hero-art"
            />
            

            {/* Float Action Header for Modal */}
            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10 }}>
              <button 
                onClick={closeHeroDetails}
                className="modal-close-btn-round"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content Container (Scrollable) */}
            <div className="modal-scrollable-body" style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* IIFE wrapper for calculating variables and rendering tabs */}
              {(() => {
                const tier = selectedHero.tier || detailHeroData?.tier || "A";
                const role = selectedHero.role || detailHeroData?.role || "Fighter";
                const lane = selectedHero.lane || detailHeroData?.lane || "EXP Lane";
                const winRate = selectedHero.win_rate || detailHeroData?.win_rate || 50;
                const pickRate = selectedHero.pick_rate || detailHeroData?.pick_rate || 1;
                const banRate = selectedHero.ban_rate || detailHeroData?.ban_rate || 0;
                const difficulty = detailHeroData?.difficulty || 40;
                const difficultyStars = Math.max(1, Math.min(5, Math.round(difficulty / 20)));

                // Map standard short names from minified JS for Overview UI compatibility:
                const g = tier;
                const x = role;
                const D = lane;
                const O = winRate;
                const C = pickRate;
                const re = banRate;
                const ue = difficulty;
                const ne = difficultyStars;

                const renderStars = (stars, maxStars = 5) => (
                  <span style={{ color: 'var(--accent-gold)', letterSpacing: '0.05rem', fontSize: '0.72rem' }}>
                    {"★".repeat(stars)}{"☆".repeat(maxStars - stars)}
                  </span>
                );

                const renderPowerBar = (val) => {
                  return "█".repeat(val) + "░".repeat(10 - val);
                };

                const getSituationalReplacements = (roleVal, itemsVal) => {
                  const roleLower = String(roleVal).toLowerCase();
                  const isMageOrMagic = roleLower.includes("mage") || detailHeroData?.magic && detailHeroData.magic > 40;
                  const itemAntiHeal = isMageOrMagic ? "Holy Crystal" : (roleLower.includes("tank") || roleLower.includes("support") ? "Dominance Ice" : "Demon Hunter Sword");
                  const itemArmorPen = isMageOrMagic ? "Divine Glaive" : "Malefic Roar";
                  const itemShield = roleLower.includes("marksman") ? "Rose Gold Meteor" : "Athena's Shield";
                  const itemSnowball = isMageOrMagic ? "Holy Crystal" : "Hunter Strike";
                  const itemLate = "Immortality";

                  return [
                    { label: "Enemy Has Estes / Heavy Healing", item: itemAntiHeal, replaceIdx: 5, desc: `Replace Core Item 5 with ${itemAntiHeal} to cut enemy HP recovery by 50%.` },
                    { label: "Enemy Has 3 Tanks / Heavy Armor", item: itemArmorPen, replaceIdx: 4, desc: `Replace Core Item 4 with ${itemArmorPen} to shred tank defenses.` },
                    { label: "Enemy Has Burst Assassin focus", item: itemShield, replaceIdx: 6, desc: `Replace Core Item 6 with ${itemShield} to survive burst setup.` },
                    { label: "Snowballing Advantage", item: itemSnowball, replaceIdx: 3, desc: `Replace Core Item 3 with ${itemSnowball} to accelerate your damage lead.` },
                    { label: "Late Game Survival", item: itemLate, replaceIdx: 6, desc: `Replace Core Item 6 with ${itemLate} to gain a second life trigger.` }
                  ];
                };

                const getSkillTipsAndMistakes = (heroObj) => {
                  if (!heroObj) return null;
                  const roleLower = (heroObj.role || "").toLowerCase();
                  if (heroObj.name === "Miya") {
                    return {
                      mistakes: [
                        { bad: "Using Ultimate before marking target with moon arrows", good: "Build passive stacks first to maximize attack speed during ultimate activation" },
                        { bad: "Opening fights in front of team as standard DPS", good: "Conceal with ultimate and reposition behind tanks before firing" }
                      ],
                      tips: [
                        "Save Hidden Moonlight (Ultimate) strictly to cleanse crowd control or escape burst assassin focus.",
                        "Clear wave quickly with Moon Arrow S1 to gain lane priority for early Turtle fights."
                      ]
                    };
                  }
                  if (heroObj.name === "Tigreal") {
                    return {
                      mistakes: [
                        { bad: "Using Ultimate without Flicker setup when enemies have dashes", good: "Flicker-Ultimate combo catches mobile squishies off guard" },
                        { bad: "Pushing enemies away from your carry during teamfights", good: "Use Sacred Hammer S2 to push enemies toward allies or isolate the enemy carry" }
                      ],
                      tips: [
                        "Sacred Hammer S2 can interrupt channeled spells like Odette or Pharsa ultimates.",
                        "Always check bush with S1 wave before walking in blindly."
                      ]
                    };
                  }
                  if (heroObj.name === "Saber") {
                    return {
                      mistakes: [
                        { bad: "Initiating ultimate on tanky frontliners instead of backline squishies", good: "Wait in bush for enemy marksman/mage to step out, then engage" },
                        { bad: "Dashing into fight before activating Orbiting Swords S1", good: "Activate S1 first to apply armor reduction on impact before ultimate burst" }
                      ],
                      tips: [
                        "Save S2 dash to escape after executing a squishy targets.",
                        "S1 orbiting swords will continue to damage and shred armor while ultimate is active."
                      ]
                    };
                  }

                  if (roleLower.includes("assassin")) {
                    return {
                      mistakes: [
                        { bad: "Dashing into full health teams without knowing target cooldowns", good: "Wait for key CC spells to be wasted before engaging" },
                        { bad: "Neglecting jungle camps or lane farm for endless roaming", good: "Maintain high gold per minute; assassins fall off without item leads" }
                      ],
                      tips: [
                        "Use local bushes to ambush lone targets walking between lanes.",
                        "Always calculate escape paths before using your mobility spells to dive."
                      ]
                    };
                  } else if (roleLower.includes("marksman")) {
                    return {
                      mistakes: [
                        { bad: "Overextending in lane early without vision of enemy jungler", good: "Play defensively; focus on farm and tower safety for the first 8 minutes" },
                        { bad: "Using dash offensively into teamfights", good: "Save dash/escape tools to reposition away from dive assassins" }
                      ],
                      tips: [
                        "Position yourself behind your frontline at all times during team fights.",
                        "Red buff is highly useful in late game to apply slows and extra damage."
                      ]
                    };
                  } else if (roleLower.includes("mage")) {
                    return {
                      mistakes: [
                        { bad: "Face-checking dark bushes to clear waves", good: "Use ranged skills to scout bushes from a safe distance first" },
                        { bad: "Spamming all spells on CD without securing proper aim", good: "Chain spells sequentially after a crowd control trigger connects" }
                      ],
                      tips: [
                        "Roam with your roamer/jungler to secure ganks in side lanes.",
                        "Position near walls so you can flash or escape through them easily."
                      ]
                    };
                  } else if (roleLower.includes("tank")) {
                    return {
                      mistakes: [
                        { bad: "Chasing low-HP targets and leaving carry unprotected", good: "Prioritize peeling for your damage dealers over securing kills" },
                        { bad: "Engaging when allied damage dealers are out of range", good: "Always look at your mini-map to verify team follow-up before initiating" }
                      ],
                      tips: [
                        "Provide vision by checking strategic bushes around objective zones.",
                        "Buy equipment matching the main enemy damage type (physical/magical)."
                      ]
                    };
                  } else if (roleLower.includes("support")) {
                    return {
                      mistakes: [
                        { bad: "Frontlining and absorbing burst damage meant for tanks", good: "Stay slightly behind frontliners, offering healing and buffs" },
                        { bad: "Using healing/shield spells when allies are at full health", good: "Save key defense buffs for when enemy assassin starts their engage" }
                      ],
                      tips: [
                        "Prioritize supporting the ally with the highest gold or carry potential.",
                        "Buy active roaming equipment to protect squishy team members."
                      ]
                    };
                  }
                  
                  return {
                    mistakes: [
                      { bad: "Drafting as solo frontline and ignoring target backline", good: "Flank the enemy squishies from the side during main engagements" },
                      { bad: "Spamming abilities while neglecting basic attacks", good: "Weave basic attacks between spells to trigger passive lifesteal/damage" }
                    ],
                    tips: [
                      "Freeze lane early against weaker enemies to deny gold/EXP.",
                      "Use your high sustain to soak damage and buy time for your carry."
                    ]
                  };
                };

                const getMatchupConfidenceText = (scoreVal, isThreat = false, isSynergy = false) => {
                  const absVal = Math.abs(scoreVal);
                  let confidence = "Moderate Confidence";
                  if (absVal >= 1.5) confidence = "High Confidence";
                  else if (absVal < 0.6) confidence = "Low Confidence";
                  
                  const label = isSynergy ? "Synergy" : (isThreat ? "Threat" : "Advantage");
                  const prefix = scoreVal > 0 ? "+" : "";
                  
                  return {
                    scoreText: `${prefix}${scoreVal.toFixed(2)} ${label}`,
                    confidenceText: confidence
                  };
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Reverted Faded Background Cover Image Removed */}

                    <div className="gaming-header-container" style={{ position: 'relative', overflow: 'hidden', padding: '1rem 1.25rem' }}>
                      {/* Header Left Area: Avatar and Info */}
                      <div style={{ zIndex: 1, position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                        {/* Header Splash Identity (with inline avatar) */}
                        <div className="gaming-title-section" style={{ padding: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid var(--accent-blue)', overflow: 'hidden', boxShadow: '0 0 10px var(--accent-blue-glow)', background: 'var(--bg-main)', flexShrink: 0 }}>
                              <SmartImage src={selectedHero.avatar_url} alt={selectedHero.name} fallbackType="hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <h2 className="gaming-hero-name" style={{ fontSize: '1.8rem' }}>{selectedHero.name}</h2>
                          </div>
                          <div className="gaming-badges-row">
                            <span className="gaming-badge-pill">{selectedHero.role}</span>
                            <span className="gaming-badge-pill">{selectedHero.lane || 'EXP Lane'}</span>
                          </div>
                          <p className="gaming-hero-desc">{getHeroLore(selectedHero)}</p>
                        </div>
                      </div>

                      {/* Header Right Area: Quick Loadout & Stats */}
                      <div style={{ zIndex: 1, position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {/* Battle Spell, Emblem, & Builds Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '0.75rem' }}>
                          {/* Spell & Emblem Column */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            <div>
                              <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Battle Spell</span>
                              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                                {getHeroSpells(selectedHero, detailHeroData?.builds?.spells).slice(0, 2).map((spell, idx) => (
                                  <div key={idx} style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} title={spell.name}>
                                    <SmartImage src={spell.icon} alt={spell.name} fallbackType="spell" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Emblem Set</span>
                              {(() => {
                                const emblem = getHeroEmblem(selectedHero);
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                      <SmartImage src={emblem.icon} alt={emblem.name} fallbackType="hero" style={{ width: '16px', height: '16px' }} />
                                    </div>
                                    <span style={{ fontSize: '0.55rem', fontWeight: 800, color: emblem.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }} title={emblem.name}>{emblem.name}</span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Quick Build Items Column */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Core Build</span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', marginTop: '0.1rem' }}>
                              {detailHeroData?.builds?.items && detailHeroData.builds.items.slice(0, 6).map((item, idx) => {
                                const itemDetail = getProItemDetail(item);
                                return (
                                  <div key={idx} style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid var(--border-light)', overflow: 'hidden' }} title={itemDetail.name}>
                                    <SmartImage src={itemDetail.icon} alt={itemDetail.name} fallbackType="item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Stats / In-Use Statistics Section */}
                        <div className="gaming-stats-section" style={{ margin: 0, padding: '0.75rem' }}>
                          <h4 className="gaming-stats-title" style={{ margin: '0 0 0.5rem 0' }}>In-Use Statistics</h4>
                          
                          <div className="gaming-stat-row" style={{ marginBottom: '0.45rem' }}>
                            <div className="gaming-stat-label-row">
                              <span className="gaming-stat-label" style={{ fontSize: '0.6rem' }}>Durability</span>
                              <span className="gaming-stat-label" style={{ fontSize: '0.6rem' }}>{detailHeroData?.durability || 50}%</span>
                            </div>
                            <div className="gaming-stat-track" style={{ height: '4px' }}>
                              <div className="gaming-stat-fill" style={{ width: `${detailHeroData?.durability || 50}%` }}></div>
                            </div>
                          </div>

                          <div className="gaming-stat-row" style={{ marginBottom: '0.45rem' }}>
                            <div className="gaming-stat-label-row">
                              <span className="gaming-stat-label" style={{ fontSize: '0.6rem' }}>Offense</span>
                              <span className="gaming-stat-label" style={{ fontSize: '0.6rem' }}>{detailHeroData?.offense || 50}%</span>
                            </div>
                            <div className="gaming-stat-track" style={{ height: '4px' }}>
                              <div className="gaming-stat-fill" style={{ width: `${detailHeroData?.offense || 50}%` }}></div>
                            </div>
                          </div>

                          <div className="gaming-stat-row" style={{ marginBottom: '0.45rem' }}>
                            <div className="gaming-stat-label-row">
                              <span className="gaming-stat-label" style={{ fontSize: '0.6rem' }}>Control Effect</span>
                              <span className="gaming-stat-label" style={{ fontSize: '0.6rem' }}>{detailHeroData?.magic || 50}%</span>
                            </div>
                            <div className="gaming-stat-track" style={{ height: '4px' }}>
                              <div className="gaming-stat-fill" style={{ width: `${detailHeroData?.magic || 50}%` }}></div>
                            </div>
                          </div>

                          <div className="gaming-stat-row" style={{ marginBottom: 0 }}>
                            <div className="gaming-stat-label-row">
                              <span className="gaming-stat-label" style={{ fontSize: '0.6rem' }}>Difficulty</span>
                              <span className="gaming-stat-label" style={{ fontSize: '0.6rem' }}>{detailHeroData?.difficulty || 40}%</span>
                            </div>
                            <div className="gaming-stat-track" style={{ height: '4px' }}>
                              <div className="gaming-stat-fill" style={{ width: `${detailHeroData?.difficulty || 40}%` }}></div>
                            </div>
                          </div>
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
                                <div className="gaming-panel-card">
                                  <h4 className="gaming-panel-title">Skills Overview</h4>
                                  <div className="circular-bubbles-row">
                                    {detailHeroData.skills && detailHeroData.skills.map((skill, idx) => (
                                      <div key={idx} className="circular-bubble-item" onClick={() => { setHeroDetailTab('guide'); setActiveSkillIndex(idx); }}>
                                        <div className="circular-bubble-icon-wrap" style={{ width: '48px', height: '48px' }}>
                                          <div className="circular-bubble-num">{idx === 0 ? 'P' : idx}</div>
                                          <SmartImage src={skill.icon} alt={skill.name} fallbackType="skill" style={{ width: '100%', height: '100%' }} />
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
                                          <div className="circular-bubble-icon-wrap" style={{ width: '48px', height: '48px' }}>
                                            <SmartImage src={itemDetail.icon} alt={itemDetail.name} fallbackType="item" style={{ width: '100%', height: '100%' }} />
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

                              {/* gaming-bento-right removed: Default Painting, Battle Spell, Emblem Set */}
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

                          </div>
                        )}

                        {heroDetailTab === 'builds' && (
                          <div className="builds-tab-sheet animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.4rem' }}>
                                <h5 className="panel-card-title" style={{ margin: 0, border: 'none', padding: 0, fontSize: '0.72rem' }}>Full Core Build</h5>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap', paddingBottom: '0.25rem' }}>
                                {detailHeroData.builds?.items && detailHeroData.builds.items.slice(0, 6).map((rawItem, idx) => {
                                  const item = getProItemDetail(rawItem);
                                  return (
                                    <React.Fragment key={idx}>
                                      {idx > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 900, fontSize: '0.65rem' }}>&gt;</span>}
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '56px', flexShrink: 0 }}>
                                        <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '8px', border: '1.5px solid var(--border-light)', overflow: 'hidden' }}>
                                          <SmartImage src={item.icon} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} fallbackType="item" />
                                          <span style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.45rem', fontWeight: 900, padding: '0.05rem 0.15rem', borderTopLeftRadius: '4px' }}>
                                            {idx + 1}
                                          </span>
                                        </div>
                                        <span style={{ fontSize: '0.48rem', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'center', marginTop: '0.2rem', height: '24px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', width: '100%' }}>
                                          {item.name}
                                        </span>
                                      </div>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                              <p style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', lineHeight: 1.3 }}>
                                Build these core items to optimize early stats scaling and damage output in baseline matchups.
                              </p>
                            </div>

                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem' }}>Situational Replacements</h5>
                              
                              {(() => {
                                const replacements = getSituationalReplacements(role, detailHeroData.builds?.items);
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.75rem' }}>
                                    {replacements.map((repl, rIdx) => {
                                      const matchedItem = PRO_EQUIPMENT_DATABASE.find(x => x.name.toLowerCase().trim() === repl.item.toLowerCase().trim());
                                      const icon = matchedItem ? matchedItem.icon : "/assets/items/Dominance_Ice.webp";
                                      return (
                                        <div key={rIdx} style={{ display: 'flex', gap: '0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '0.55rem', borderRadius: '8px', alignItems: 'center' }}>
                                          <div style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--border-light)', overflow: 'hidden', flexShrink: 0 }}>
                                            <SmartImage src={icon} alt={repl.item} fallbackType="item" />
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                                            <span style={{ fontSize: '0.52rem', fontWeight: 900, color: 'var(--accent-red)', textTransform: 'uppercase' }}>
                                              {repl.label}
                                            </span>
                                            <strong style={{ fontSize: '0.65rem', color: 'var(--text-primary)', marginTop: '0.05rem' }}>
                                              → {repl.item} (Replace Item {repl.replaceIdx})
                                            </strong>
                                            <p style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', margin: 0, marginTop: '0.05rem', lineHeight: 1.25 }}>
                                              {repl.desc}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>

                            {validateEnglishText(detailHeroData.builds?.tips) && (
                              <div className="esports-commentary-box" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: '12px' }}>
                                <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--accent-gold)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>Tactical Gear Commentary</span>
                                <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                                  {validateEnglishText(detailHeroData.builds.tips)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* TAB 3: MATCHUPS */}
                        {heroDetailTab === 'matchups' && (
                          <div className="matchups-tab-sheet animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {(() => {
                              const { counters, weakAgainst, synergy } = resolveMatchupsForHero(selectedHero.id);

                              const itemsStrong = counters.slice(0, 3);
                              const itemsWeak = weakAgainst.slice(0, 3);
                              const itemsSynergy = synergy.slice(0, 3);

                              return (
                                <>
                                  <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                                    <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem', color: 'var(--accent-green)' }}>Strong Against (Counters)</h5>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                                      {itemsStrong.length === 0 ? (
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>No counter data registered.</div>
                                      ) : (
                                        itemsStrong.map((item, itemIdx) => {
                                          const conf = getMatchupConfidenceText(item.score, false);
                                          return (
                                            <button
                                              key={itemIdx}
                                              type="button"
                                              onClick={() => {
                                                const nextHero = heroes.find(h => h.id === item.id || h.name.toLowerCase() === item.name.toLowerCase());
                                                if (nextHero) handleHeroClick(nextHero);
                                              }}
                                              style={{ border: 'none', background: 'var(--bg-card)', padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                                            >
                                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-light)', flexShrink: 0 }}>
                                                <SmartImage src={item.avatar_url} alt={item.name} fallbackType="hero" />
                                              </div>
                                              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <strong style={{ fontSize: '0.68rem', color: 'var(--text-primary)' }}>{item.name}</strong>
                                                  <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--accent-green)' }}>{conf.scoreText} • <span style={{ fontSize: '0.48rem', color: 'var(--text-muted)' }}>{conf.confidenceText}</span></span>
                                                </div>
                                                <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{item.role} • {item.lane}</span>
                                              </div>
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>

                                  <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                                    <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem', color: 'var(--accent-red)' }}>Weak Against (Threats)</h5>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                                      {itemsWeak.length === 0 ? (
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>No vulnerability data registered.</div>
                                      ) : (
                                        itemsWeak.map((item, itemIdx) => {
                                          const conf = getMatchupConfidenceText(item.score, true);
                                          return (
                                            <button
                                              key={itemIdx}
                                              type="button"
                                              onClick={() => {
                                                const nextHero = heroes.find(h => h.id === item.id || h.name.toLowerCase() === item.name.toLowerCase());
                                                if (nextHero) handleHeroClick(nextHero);
                                              }}
                                              style={{ border: 'none', background: 'var(--bg-card)', padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                                            >
                                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-light)', flexShrink: 0 }}>
                                                <SmartImage src={item.avatar_url} alt={item.name} fallbackType="hero" />
                                              </div>
                                              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <strong style={{ fontSize: '0.68rem', color: 'var(--text-primary)' }}>{item.name}</strong>
                                                  <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--accent-red)' }}>{conf.scoreText} • <span style={{ fontSize: '0.48rem', color: 'var(--text-muted)' }}>{conf.confidenceText}</span></span>
                                                </div>
                                                <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{item.role} • {item.lane}</span>
                                              </div>
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>

                                  <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                                    <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem', color: 'var(--accent-blue)' }}>Best Synergy (Partners)</h5>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                                      {itemsSynergy.length === 0 ? (
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>No synergy data registered.</div>
                                      ) : (
                                        itemsSynergy.map((item, itemIdx) => (
                                          <button
                                            key={itemIdx}
                                            type="button"
                                            onClick={() => {
                                              const nextHero = heroes.find(h => h.id === item.id || h.name.toLowerCase() === item.name.toLowerCase());
                                              if (nextHero) handleHeroClick(nextHero);
                                            }}
                                            style={{ border: 'none', background: 'var(--bg-card)', padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                                          >
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-light)', flexShrink: 0 }}>
                                              <SmartImage src={item.avatar_url} alt={item.name} fallbackType="hero" />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong style={{ fontSize: '0.68rem', color: 'var(--text-primary)' }}>{item.name}</strong>
                                                {(() => {
                                                  const conf = getMatchupConfidenceText(item.score, false, true);
                                                  return (
                                                    <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                                                      {conf.scoreText} • <span style={{ fontSize: '0.48rem', color: 'var(--text-muted)' }}>{conf.confidenceText}</span>
                                                    </span>
                                                  );
                                                })()}
                                              </div>
                                              <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{item.role} • {item.lane}</span>
                                            </div>
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {/* TAB 4: GUIDE */}
                        {heroDetailTab === 'guide' && (
                          <div className="guide-tab-sheet animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            
                            {/* Skills Kit Details inside Guide tab */}
                            {detailHeroData.skills && (
                              <div className="skills-sequence-section" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                                <h4 className="esports-section-heading" style={{ margin: 0, fontSize: '0.72rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.4rem' }}>Skills Kit Details</h4>
                                
                                <div className="skills-sequence-row" style={{ marginTop: '0.75rem' }}>
                                  {detailHeroData.skills.map((skill, sIdx) => (
                                    <React.Fragment key={sIdx}>
                                      {sIdx > 0 && <span className="skills-chevron">&gt;</span>}
                                      <button
                                        onClick={() => setActiveSkillIndex(sIdx)}
                                        className={`skills-badge-btn ${activeSkillIndex === sIdx ? 'active' : ''}`}
                                      >
                                        <SmartImage 
                                          src={skill.icon} 
                                          alt={skill.name} 
                                          className="skills-badge-img"
                                          style={{ width: '40px', height: '40px' }}
                                          fallbackType="skill"
                                        />
                                      </button>
                                    </React.Fragment>
                                  ))}
                                </div>

                                {detailHeroData.skills[activeSkillIndex] && (
                                  <div className="skills-active-detail-card animate-fadeIn" style={{ marginTop: '0.75rem' }}>
                                    <div className="skills-card-header">
                                      <h5 className="skills-card-title">{detailHeroData.skills[activeSkillIndex].name}</h5>
                                      <span className="skills-card-type">
                                        {activeSkillIndex === 0 ? "Passive" : `Skill ${activeSkillIndex}`}
                                      </span>
                                    </div>
                                    <p 
                                      className="skills-card-description"
                                      dangerouslySetInnerHTML={{ __html: detailHeroData.skills[activeSkillIndex].description }}
                                    />
                                    {validateEnglishText(detailHeroData.skills[activeSkillIndex].tips) && (
                                      <div className="skills-card-tips-box">
                                        <span className="tips-box-label">Esports Tip:</span>
                                        <span className="tips-box-text">{validateEnglishText(detailHeroData.skills[activeSkillIndex].tips)}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Collapsible Mistakes & Pro Tips */}
                                {(() => {
                                  const advice = getSkillTipsAndMistakes(selectedHero);
                                  if (!advice) return null;
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                                      {/* Common Mistakes */}
                                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <button
                                          type="button"
                                          onClick={() => setMistakesExpanded(!mistakesExpanded)}
                                          style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
                                        >
                                          <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--accent-red)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <ShieldAlert size={12} />
                                            Common Mistakes
                                          </span>
                                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{mistakesExpanded ? 'Hide' : 'Show'}</span>
                                        </button>
                                        {mistakesExpanded && (
                                          <div style={{ padding: '0 0.75rem 0.75rem 0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            {advice.mistakes.map((m, mIdx) => (
                                              <div key={mIdx} style={{ fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                <div style={{ color: 'var(--accent-red)', fontWeight: 700 }}>❌ {m.bad}</div>
                                                <div style={{ color: 'var(--accent-green)', fontWeight: 700 }}>✅ {m.good}</div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Pro Tips */}
                                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <button
                                          type="button"
                                          onClick={() => setProTipsExpanded(!proTipsExpanded)}
                                          style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
                                        >
                                          <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--accent-gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Lightbulb size={12} />
                                            Pro Tips
                                          </span>
                                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{proTipsExpanded ? 'Hide' : 'Show'}</span>
                                        </button>
                                        {proTipsExpanded && (
                                          <div style={{ padding: '0 0.75rem 0.75rem 0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                                            {advice.tips.map((t, tIdx) => (
                                              <div key={tIdx} style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                                                💡 {t}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                            
                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem' }}>Skill Upgrade Priority</h5>
                              <div className="upgrade-priority-row" style={{ marginTop: '0.75rem' }}>
                                {getUpgradePriority(selectedHero).sequence.map((skillIdx, idx) => {
                                  const skill = detailHeroData.skills[skillIdx];
                                  return (
                                    <React.Fragment key={idx}>
                                      {idx > 0 && <span className="upgrade-chevron">&gt;</span>}
                                      <div className="upgrade-skill-icon-wrapper">
                                        {skill ? (
                                          <SmartImage src={skill.icon} alt="Priority Skill" className="upgrade-skill-icon" fallbackType="skill" />
                                        ) : (
                                          <span className="upgrade-skill-num">{skillIdx}</span>
                                        )}
                                        <span className="upgrade-skill-badge">
                                          {skillIdx === 3 ? "Ult" : `S${skillIdx}`}
                                        </span>
                                      </div>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                              <p className="upgrade-priority-text" style={{ marginTop: '0.5rem' }}>{getUpgradePriority(selectedHero).text}</p>
                            </div>

                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem' }}>Recommended Spells</h5>
                              <div className="recommended-spells-row" style={{ marginTop: '0.75rem' }}>
                                {getHeroSpells(selectedHero, detailHeroData.builds?.spells).map((spell, idx) => (
                                  <div key={idx} className="spell-item-card">
                                    <SmartImage src={spell.icon} alt={spell.name} className="spell-item-icon" fallbackType="spell" />
                                    <div className="spell-item-info">
                                      <h6 className="spell-item-name">{spell.name}</h6>
                                      <p className="spell-item-desc" style={{ fontSize: '0.52rem', lineHeight: 1.25 }}>{spell.des}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem' }}>Recommended Emblem & Talents</h5>
                              {(() => {
                                const emblem = getHeroEmblem(selectedHero);
                                return (
                                  <div className="emblem-container-row" style={{ marginTop: '0.75rem' }}>
                                    <div className="emblem-left-card">
                                      <div className="emblem-glow-circle" style={{ borderColor: emblem.color, boxShadow: `0 0 15px ${emblem.color}40` }}>
                                        <SmartImage src={emblem.icon} alt={emblem.name} className="emblem-big-icon" fallbackType="hero" />
                                      </div>
                                      <span className="emblem-label-title" style={{ color: emblem.color }}>{emblem.name}</span>
                                    </div>
                                    <div className="emblem-talents-stack">
                                      {emblem.talents.map((talent, tIdx) => (
                                        <div key={tIdx} className="emblem-talent-card">
                                          <div className="talent-icon-bubble">
                                            <SmartImage src={talent.icon} alt={talent.name} className="talent-small-icon" fallbackType="spell" />
                                            <span className="talent-tier-badge">Tier {talent.tier}</span>
                                          </div>
                                          <div className="talent-text-info">
                                            <h6 className="talent-name-heading">{talent.name}</h6>
                                            <p className="talent-desc-para" style={{ fontSize: '0.52rem', lineHeight: 1.25 }}>{talent.des}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem' }}>Esports Skill Combos</h5>
                              {(() => {
                                const comboData = HERO_COMBOS_DATABASE[selectedHero.id] || {
                                  heroId: selectedHero.id,
                                  name: selectedHero.name,
                                  avatar: selectedHero.avatar_url,
                                  combos: [
                                    {
                                      title: "Optimal Battle Rotation Combo",
                                      skills: (() => {
                                        const roleLower = role.toLowerCase();
                                        const sList = detailHeroData.skills || [];
                                        const spells = getHeroSpells(selectedHero, detailHeroData.builds?.spells);
                                        const spell = spells[0] || BATTLE_SPELLS_DATABASE.flicker;
                                        
                                        if (roleLower.includes('assassin')) {
                                          return [
                                            { name: sList[1]?.name || "Skill 1", icon: sList[1]?.icon, type: "Skill 1" },
                                            { name: sList[2]?.name || "Skill 2", icon: sList[2]?.icon, type: "Skill 2" },
                                            { name: sList[3]?.name || "Ultimate", icon: sList[3]?.icon, type: "Ult" }
                                          ];
                                        } else if (roleLower.includes('mage')) {
                                          return [
                                            { name: sList[2]?.name || "Skill 2", icon: sList[2]?.icon, type: "Skill 2" },
                                            { name: sList[3]?.name || "Ultimate", icon: sList[3]?.icon, type: "Ult" },
                                            { name: sList[1]?.name || "Skill 1", icon: sList[1]?.icon, type: "Skill 1" }
                                          ];
                                        } else if (roleLower.includes('marksman')) {
                                          return [
                                            { name: sList[2]?.name || "Skill 2", icon: sList[2]?.icon, type: "Skill 2" },
                                            { name: sList[1]?.name || "Skill 1", icon: sList[1]?.icon, type: "Skill 1" },
                                            { name: spell.name, icon: spell.icon, type: "Spell" }
                                          ];
                                        } else if (roleLower.includes('tank') || roleLower.includes('support')) {
                                          return [
                                            { name: spell.name, icon: spell.icon, type: "Spell" },
                                            { name: sList[2]?.name || "Skill 2", icon: sList[2]?.icon, type: "Skill 2" },
                                            { name: sList[1]?.name || "Skill 1", icon: sList[1]?.icon, type: "Skill 1" }
                                          ];
                                        } else { // Fighter
                                          return [
                                            { name: sList[1]?.name || "Skill 1", icon: sList[1]?.icon, type: "Skill 1" },
                                            { name: spell.name, icon: spell.icon, type: "Spell" },
                                            { name: sList[2]?.name || "Skill 2", icon: sList[2]?.icon, type: "Skill 2" }
                                          ];
                                        }
                                      })(),
                                      description: `Initiate execution by properly positioning. Apply control utility, chain core skills, and use your spell for optimal finish.`
                                    }
                                  ]
                                };
                                
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
                                    {comboData.combos.map((combo, cIdx) => (
                                      <div key={cIdx} className="card" style={{ padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                        <h6 style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--accent-blue)', margin: 0 }}>{combo.title}</h6>
                                        <div className="combo-sequence-row" style={{ margin: 0 }}>
                                          {combo.skills.map((skill, sIdx) => (
                                            <React.Fragment key={sIdx}>
                                              {sIdx > 0 && <span className="combo-chevron" style={{ color: 'var(--text-muted)' }}>&gt;</span>}
                                              <div className="combo-skill-bubble" title={skill.name}>
                                                <div className="combo-skill-bubble-icon" style={{ width: '28px', height: '28px' }}>
                                                  <SmartImage src={skill.icon} alt={skill.name} fallbackType={skill.type === 'Spell' ? 'spell' : 'skill'} />
                                                </div>
                                                <span className="combo-skill-label" style={{ fontSize: '0.45rem' }}>{skill.type}</span>
                                              </div>
                                            </React.Fragment>
                                          ))}
                                        </div>
                                        <p style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>{combo.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="guide-panel-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 className="panel-card-title" style={{ margin: 0, paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem' }}>Guide Videos</h5>
                              
                              {(() => {
                                const videoInfo = HERO_SPOTLIGHT_VIDEOS[String(selectedHero.id)] || {
                                  video_id: null,
                                  embed_url: `https://www.youtube.com/embed?listType=search&list=MLBB+${encodeURIComponent(selectedHero.name)}+Guide`,
                                  search_url: `https://www.youtube.com/results?search_query=MLBB+${encodeURIComponent(selectedHero.name)}+Guide`
                                };
                                
                                const embedUrl = videoInfo.video_id 
                                  ? `https://www.youtube.com/embed/${videoInfo.video_id}?autoplay=1` 
                                  : videoInfo.search_url;
                                
                                return (
                                  <div className="video-lite-card" style={{ marginTop: '0.75rem', position: 'relative' }}>
                                    {videoIframeLoading && (
                                      <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'var(--bg-card)',
                                        gap: '0.5rem',
                                        zIndex: 10
                                      }}>
                                        <div className="esports-pulse-skeleton" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                          <div className="shimmer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#475569', marginBottom: '0.5rem' }}></div>
                                          <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', fontWeight: 800 }}>LOADING SPOTLIGHT...</span>
                                        </div>
                                      </div>
                                    )}
                                    {!guideVideoLoaded ? (
                                      <>
                                        <div className="video-lite-thumb">
                                          <SmartImage src={selectedHero.cover_thumb || selectedHero.avatar_url} alt={`${selectedHero.name} guide`} fallbackType="hero" />
                                          <button 
                                            type="button" 
                                            className="video-play-btn" 
                                            onClick={() => {
                                              if (videoInfo.video_id) {
                                                setGuideVideoLoaded(true);
                                                setVideoIframeLoading(true);
                                              } else {
                                                window.open(videoInfo.search_url, '_blank');
                                              }
                                            }}
                                          >
                                            <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
                                          </button>
                                        </div>
                                        <div className="video-lite-copy" style={{ background: 'var(--bg-card)' }}>
                                          <strong>{selectedHero.name} Official Spotlight</strong>
                                          <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)' }}>
                                            {videoInfo.video_id 
                                              ? "Watch the official hero spotlight video directly inside the app." 
                                              : "No embedded video found. Tap to search on YouTube."}
                                          </span>
                                          <a 
                                            href={videoInfo.search_url} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            style={{ fontSize: '0.58rem', color: 'var(--accent-blue)', display: 'inline-block', marginTop: '0.2rem', fontWeight: 800 }}
                                          >
                                            Open YouTube Search →
                                          </a>
                                        </div>
                                      </>
                                    ) : (
                                      <iframe
                                        title={`${selectedHero.name} spotlight videos`}
                                        src={embedUrl}
                                        loading="lazy"
                                        onLoad={() => setVideoIframeLoading(false)}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                      />
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                          </div>
                        )}

                        {/* TAB 5: STATS */}
                        {heroDetailTab === 'stats' && (
                          <div className="stats-tab-sheet animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="guide-panel-card" style={{ background: 'rgba(15, 23, 42, 0.2)', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                              <h5 className="panel-card-title" style={{ marginBottom: '0.75rem' }}>Live Meta Ratios (Patch v{patchMeta.current_patch})</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {[
                                  { label: "Win Rate (WR)", val: selectedHero.win_rate || 50.0, color: 'var(--accent-green)' },
                                  { label: "Ban Rate (BR)", val: selectedHero.ban_rate || 1.0, color: 'var(--accent-red)' },
                                  { label: "Pick Rate (PR)", val: selectedHero.pick_rate || 10.0, color: 'var(--accent-blue)' }
                                ].map((stat, idx) => (
                                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{stat.label}</span>
                                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: stat.color }}>{stat.val.toFixed(1)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, stat.val))}%`, background: stat.color }}></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="guide-panel-card">
                              <h5 className="panel-card-title">Official Hero Attributes</h5>
                              
                              <div className="attributes-grid">
                                {[
                                  { label: "Durability", val: getHeroStats(selectedHero).durability },
                                  { label: "Offense", val: getHeroStats(selectedHero).offense },
                                  { label: "Control Effect", val: getHeroStats(selectedHero).control_effect },
                                  { label: "Difficulty", val: getHeroStats(selectedHero).difficulty }
                                ].map((attr, idx) => (
                                  <div key={idx} className="attribute-row">
                                    <span className="attribute-name">{attr.label}</span>
                                    <span className="attribute-value">{attr.val}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB 6: LORE */}
                        {heroDetailTab === 'lore' && (
                          <div className="lore-tab-sheet animate-fadeIn">
                            <div className="guide-panel-card">
                              <h5 className="panel-card-title">Hero Story Background</h5>
                              <p className="lore-story-paragraph">{getHeroLore(selectedHero)}</p>
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })()}

            </div>

          </div>

        </div>

      )}



      {/* ======================================================== */}

      {/* 3. INTERACTIVE EQUIPMENT DETAILS BOTTOM SHEET DRAWER      */}

      {/* ======================================================== */}

      {selectedEquipment && (

        <div className="modal-backdrop animate-fadeIn" onClick={() => setSelectedEquipment(null)}>

          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ borderTop: '2px solid rgba(255,255,255,0.05)' }}>

            

            {/* Banner Decor Backdrop */}

            {(() => {

              const cat = selectedEquipment.category;

              let radGlow = 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)';

              if (cat === 'Magic') { radGlow = 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)'; }

              if (cat === 'Defense') { radGlow = 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)'; }

              if (cat === 'Movement') { radGlow = 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)'; }



              return (

                <div style={{

                  position: 'absolute',

                  top: 0, left: 0, right: 0,

                  height: '140px',

                  background: radGlow,

                  zIndex: 0,

                  pointerEvents: 'none',

                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'

                }} />

              );

            })()}



            {/* Header section with Close button */}

            <div style={{ display: 'flex', justifyContent: 'flex-end', zIndex: 10, position: 'relative', marginBottom: '0.25rem' }}>

              <button 

                onClick={() => setSelectedEquipment(null)} 

                style={{ 

                  border: 'none', 

                  background: 'rgba(255,255,255,0.06)', 

                  color: 'var(--text-primary)', 

                  width: '28px', 

                  height: '28px', 

                  borderRadius: '50%', 

                  display: 'flex', 

                  alignItems: 'center', 

                  justifyContent: 'center', 

                  cursor: 'pointer',

                  boxShadow: 'var(--shadow-premium)'

                }}

              >

                <X size={14} style={{ margin: '0 auto' }} />

              </button>

            </div>



            {/* Content Body (Scrollable container) */}

            <div style={{ zIndex: 1, position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flexGrow: 1, paddingBottom: '1rem' }}>

              

              {/* Item Info row */}

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>

                <div style={{

                  padding: '3px',

                  background: 'rgba(255, 255, 255, 0.08)',

                  borderRadius: '12px',

                  border: '1px solid rgba(255, 255, 255, 0.1)',

                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.05)',

                  flexShrink: 0

                }}>

                  <SmartImage src={selectedEquipment.icon} alt={selectedEquipment.name} fallbackType="item" style={{ width: '56px', height: '56px', borderRadius: '10px' }} />

                </div>

                

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

                    <h3 className="modal-hero-title" style={{ fontSize: '1.1rem', margin: 0, letterSpacing: '-0.3px', fontWeight: 900 }}>{selectedEquipment.name}</h3>

                    {(() => {

                      const cat = selectedEquipment.category;

                      let color = '#ef4444';

                      let bg = 'rgba(239, 68, 68, 0.08)';

                      if (cat === 'Magic') { color = '#3b82f6'; bg = 'rgba(37, 99, 235, 0.08)'; }

                      if (cat === 'Defense') { color = '#10b981'; bg = 'rgba(16, 185, 129, 0.08)'; }

                      if (cat === 'Movement') { color = '#a855f7'; bg = 'rgba(168, 85, 247, 0.08)'; }

                      

                      return (

                        <span style={{ fontSize: '0.55rem', fontWeight: 900, color: color, background: bg, padding: '0.15rem 0.4rem', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>

                          {cat}

                        </span>

                      );

                    })()}

                  </div>



                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent-gold)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>

                    <Zap size={10} style={{ fill: 'currentColor' }} /> Gold Cost: {getItemPrice(selectedEquipment)} Gold

                  </span>

                </div>

              </div>



              {/* Attributes Section */}

              {selectedEquipment.stats && (

                <div className="guide-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.85rem', background: 'rgba(255,255,255,0.02)' }}>

                  <h5 className="panel-card-title" style={{ fontSize: '0.68rem', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>Equipment Attributes</h5>

                  

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

                    {selectedEquipment.stats.split(',').map((stat, idx) => {

                      const trimmed = stat.trim();

                      if (!trimmed) return null;



                      const { valStr, pct } = parseStatVal(trimmed);

                      let themeColor = '#fbbf24'; // Gold default

                      if (trimmed.toLowerCase().includes('attack')) themeColor = '#f87171'; // Red for Attack

                      if (trimmed.toLowerCase().includes('magic') || trimmed.toLowerCase().includes('mana')) themeColor = '#60a5fa'; // Blue for Magic

                      if (trimmed.toLowerCase().includes('defense') || trimmed.toLowerCase().includes('hp')) themeColor = '#34d399'; // Green for Defense

                      if (trimmed.toLowerCase().includes('speed') || trimmed.toLowerCase().includes('cd') || trimmed.toLowerCase().includes('movement')) themeColor = '#c084fc'; // Purple for Speed



                      return (

                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 800 }}>{trimmed}</span>

                            <span style={{ fontSize: '0.58rem', color: themeColor, fontWeight: 900 }}>{valStr}</span>

                          </div>

                          {/* Linear Potency Progress Gauge */}

                          <div style={{ width: '100%', height: '5px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>

                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: themeColor, boxShadow: `0 0 8px ${themeColor}cc` }} />

                          </div>

                        </div>

                      );

                    })}

                  </div>

                </div>

              )}



              {/* Unique Passive Section */}

              {selectedEquipment.passive && (

                <div className="esports-commentary-box" style={{ margin: 0, padding: '0.85rem', borderLeftColor: 'var(--accent-blue)' }}>

                  <span className="commentary-label" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-blue)', display: 'block', marginBottom: '0.25rem' }}>

                    Unique Passive Abilities

                  </span>

                  <p className="commentary-text" style={{ fontSize: '0.68rem', lineHeight: 1.4, color: 'var(--text-primary)', margin: 0 }}>

                    {selectedEquipment.passive}

                  </p>

                </div>

              )}



              {/* Synergized Champions list (INTERCONNECTED roster feature) */}

              {(() => {

                const synergized = getSynergizedHeroes(selectedEquipment);

                if (synergized.length === 0) return null;



                return (

                  <div className="guide-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0.85rem', background: 'rgba(255,255,255,0.02)' }}>

                    <h5 className="panel-card-title" style={{ fontSize: '0.68rem', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>Pro Build Synergy</h5>

                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block', marginTop: '-0.3rem' }}>Click a hero to view their comprehensive esport strategy guide:</span>

                    

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>

                      {synergized.map(hero => (

                        <div 

                          key={hero.id} 

                          onClick={() => {

                            setSelectedEquipment(null);

                            handleHeroClick(hero);

                          }}

                          style={{

                            display: 'flex',

                            alignItems: 'center',

                            gap: '0.45rem',

                            padding: '0.35rem 0.6rem',

                            background: 'rgba(255,255,255,0.03)',

                            border: '1px solid var(--border-light)',

                            borderRadius: '8px',

                            cursor: 'pointer',

                            transition: 'transform 0.2s ease, border-color 0.2s ease'

                          }}

                          className="directory-item-card"

                        >

                          <SmartImage src={hero.avatar_url} alt={hero.name} fallbackType="hero" style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.1)' }} />

                          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{hero.name}</span>

                        </div>

                      ))}

                    </div>

                  </div>

                );

              })()}



            </div>

          </div>

        </div>

      )}



      {/* Profile Personalization Modal Dialog */}

      {showProfileEdit && (
        <div className="drawer-backdrop" onClick={() => setShowProfileEdit(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <img src="/logo.png" alt="MythicIQ Logo" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mythic<span style={{ color: '#D4AF37' }}>IQ</span>
                </h3>
              </div>
              <button onClick={() => setShowProfileEdit(false)} className="modal-close-btn" aria-label="Close menu">
                <X size={14} style={{ margin: '0 auto' }} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Profile Customization Accordion */}
              <div className={`drawer-accordion ${activeDrawerTab === 'profile' ? 'active' : ''}`}>
                <div 
                  className="drawer-accordion-summary"
                  onClick={() => handleDrawerTabClick('profile')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={13} style={{ color: '#D4AF37' }} />
                    Personalize Profile
                  </span>
                </div>
                <div className="drawer-accordion-content-wrapper">
                  <div className="drawer-accordion-content">
                    <div className="profile-edit-section">
                      <label className="profile-edit-label">Local Display Nickname</label>
                      <input 
                        id="local-display-nickname-drawer"
                        name="nickname"
                        autocomplete="off"
                        type="text" 
                        value={playerProfile.username} 
                        onChange={(e) => setPlayerProfile({...playerProfile, username: e.target.value})}
                        className="profile-edit-input"
                      />
                    </div>
                    <div className="profile-edit-section">
                      <label className="profile-edit-label">Select Division Crest</label>
                      <div className="badge-selector-row">
                        {RANK_TIERS.map((tier, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPlayerProfile({...playerProfile, badgeIndex: idx, rank: tier.name})}
                            className={`badge-select-btn ${finalProfile.badgeIndex === idx ? 'active' : ''}`}
                          >
                            <SmartImage src={tier.icon} alt="badge" className="badge-select-img" fallbackType="item" style={{ width: '20px', height: '20px' }} />
                            <span className="badge-select-lbl" style={{ fontSize: '0.48rem' }}>{tier.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="profile-edit-section">
                      <label className="profile-edit-label">Choose Avatar Hero</label>
                      <div className="picker-role-tabs" style={{ gap: '0.15rem', padding: '0.15rem' }}>
                        {['All', 'Marksman', 'Assassin', 'Fighter', 'Mage', 'Tank', 'Support'].map(role => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setProfileAvatarFilter(role)}
                            className={`picker-tab-btn ${profileAvatarFilter === role ? 'active' : ''}`}
                            style={{ fontSize: '0.52rem', padding: '0.2rem 0.35rem' }}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                      <div className="picker-hero-grid" style={{ maxHeight: '150px', gap: '0.35rem' }}>
                        {heroes.filter(h => profileAvatarFilter === 'All' || h.role === profileAvatarFilter).map(hero => (
                          <button
                            key={hero.id}
                            type="button"
                            onClick={() => setPlayerProfile({...playerProfile, profileHeroId: hero.id})}
                            className={`picker-grid-card ${finalProfile.profileHeroId === hero.id ? 'active' : ''}`}
                            style={{ padding: '0.25rem' }}
                          >
                            <div className="picker-card-avatar-wrapper" style={{ width: '28px', height: '28px' }}>
                              <SmartImage src={hero.avatar_url} alt={hero.name} className="picker-card-avatar" fallbackType="hero" />
                            </div>
                            <span className="picker-card-name" style={{ fontSize: '0.48rem' }}>{hero.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        localStorage.setItem('mldraft_player_profile', JSON.stringify(playerProfile));
                        setShowProfileEdit(false);
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', borderRadius: '8px', fontSize: '0.62rem', fontWeight: 800 }}
                    >
                      Confirm & Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings & Preferences Accordion */}
              <div className={`drawer-accordion ${activeDrawerTab === 'settings' ? 'active' : ''}`}>
                <div 
                  className="drawer-accordion-summary"
                  onClick={() => handleDrawerTabClick('settings')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Settings size={13} style={{ color: '#3B82F6' }} />
                    Settings & Preferences
                  </span>
                </div>
                <div className="drawer-accordion-content-wrapper">
                  <div className="drawer-accordion-content" style={{ gap: '0.95rem' }}>
                    {/* Language Selection */}
                    <div className="profile-edit-section">
                      <label className="profile-edit-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Languages size={11} />
                        Language Selection
                      </label>
                      <select
                        value="en"
                        disabled
                        className="profile-edit-input"
                        style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', cursor: 'not-allowed', opacity: 0.8 }}
                      >
                        <option value="en">English (More coming soon!)</option>
                      </select>
                    </div>

                    {/* Light/Dark/System Toggle */}
                    <div className="profile-edit-section">
                      <label className="profile-edit-label">Theme Mode</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                        <button
                          onClick={() => {
                            document.documentElement.setAttribute('data-theme', 'light');
                            setTheme('light');
                          }}
                          className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.45rem 0.25rem', borderRadius: '8px', fontSize: '0.58rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
                        >
                          <Sun size={11} /> Light
                        </button>
                        <button
                          onClick={() => {
                            document.documentElement.setAttribute('data-theme', 'dark');
                            setTheme('dark');
                          }}
                          className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.45rem 0.25rem', borderRadius: '8px', fontSize: '0.58rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
                        >
                          <Moon size={11} /> Dark
                        </button>
                        <button
                          onClick={() => {
                            setTheme('system');
                          }}
                          className={`btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.45rem 0.25rem', borderRadius: '8px', fontSize: '0.58rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
                        >
                          <Monitor size={11} /> System
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Support Accordion */}
              <div className={`drawer-accordion ${activeDrawerTab === 'support' ? 'active' : ''}`}>
                <div 
                  className="drawer-accordion-summary"
                  onClick={() => handleDrawerTabClick('support')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <HelpCircle size={13} style={{ color: '#10B981' }} />
                    Customer Support
                  </span>
                </div>
                <div className="drawer-accordion-content-wrapper">
                  <div className="drawer-accordion-content" style={{ gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', fontSize: '0.58rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <strong>Help Center:</strong> Need assistance? Reach our support team at <a href="mailto:roshjam121@gmail.com" style={{ color: '#10B981', fontWeight: 700 }}>roshjam121@gmail.com</a> or check our website help desk.
                    </div>

                    <div className="faq-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.50rem' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Frequently Asked Questions</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <details style={{ fontSize: '0.58rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.35rem' }}>
                          <summary style={{ fontWeight: 700, cursor: 'pointer', outline: 'none' }}>How does the Draft Assistant work?</summary>
                          <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0', lineHeight: 1.35 }}>It analyzes enemy compositions and recommends the optimal counters aligned with your tier list and meta statistics.</p>
                        </details>
                        <details style={{ fontSize: '0.58rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.35rem' }}>
                          <summary style={{ fontWeight: 700, cursor: 'pointer', outline: 'none' }}>Are hero stats up-to-date?</summary>
                          <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0', lineHeight: 1.35 }}>Yes! Hero meta rankings, win rates, and counter lists sync continuously to reflect the latest live game patch metrics.</p>
                        </details>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal & Company Info Accordion */}
              <div className={`drawer-accordion ${activeDrawerTab === 'legal' ? 'active' : ''}`}>
                <div 
                  className="drawer-accordion-summary"
                  onClick={() => handleDrawerTabClick('legal')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={13} style={{ color: '#EF4444' }} />
                    Legal & Company Info
                  </span>
                </div>
                <div className="drawer-accordion-content-wrapper">
                  <div className="drawer-accordion-content" style={{ gap: '0.75rem', fontSize: '0.58rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <div>
                      <h5 style={{ margin: '0 0 0.2rem 0', fontWeight: 800, color: 'var(--text-primary)' }}>About Us</h5>
                      <p style={{ margin: 0 }}>MythicIQ is a premier analytics platform built by gaming enthusiasts to provide live statistics, counter drafting guides, and meta breakdowns for Mobile Legends: Bang Bang players.</p>
                    </div>
                    <div>
                      <h5 style={{ margin: '0 0 0.2rem 0', fontWeight: 800, color: 'var(--text-primary)' }}>Terms of Service</h5>
                      <p style={{ margin: 0 }}>By using our app, you agree to our terms of service. The platform statistics and analytics are provided for informational and non-commercial personal use.</p>
                    </div>
                    <div>
                      <h5 style={{ margin: '0 0 0.2rem 0', fontWeight: 800, color: 'var(--text-primary)' }}>Privacy Policy</h5>
                      <p style={{ margin: 0 }}>We value your privacy. Your profile personalization and app settings are saved locally on your device storage and are never uploaded or shared with third parties.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Screen 8: Dynamic Skill Combo Guide Overlay */}

      {showCombosModal && (

        <div className="modal-backdrop" onClick={() => setShowCombosModal(false)}>

          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ borderRadius: '16px', padding: '1.25rem', height: 'auto', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>

              <h3 className="modal-hero-name" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 0, color: 'var(--text-primary)' }}>

                <Play size={16} className="text-accent-blue" />

                Skill Combo Guides (Esports Spec)

              </h3>

              <button onClick={() => setShowCombosModal(false)} className="modal-close-btn">

                <X size={12} style={{ margin: '0 auto' }} />

              </button>

            </div>



            {/* Hero selection horizontal buttons tabs */}

            <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '1rem' }}>

              {Object.keys(HERO_COMBOS_DATABASE).map((key) => {

                const heroCombo = HERO_COMBOS_DATABASE[key];

                return (

                  <button

                    key={key}

                    onClick={() => setComboHeroId(parseInt(key))}

                    className={`btn ${comboHeroId === parseInt(key) ? 'btn-primary' : 'btn-secondary'}`}

                    style={{ borderRadius: '20px', padding: '0.3rem 0.65rem', fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}

                  >

                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>

                      <SmartImage src={heroCombo.avatar} alt={heroCombo.name} fallbackType="hero" />

                    </div>

                    {heroCombo.name}

                  </button>

                );

              })}

            </div>

            

            {/* Combos list for selected hero */}

            {(() => {

              const activeHeroCombo = HERO_COMBOS_DATABASE[comboHeroId] || HERO_COMBOS_DATABASE[1];

              return (

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  <div className="profile-card" style={{ padding: '1rem', minHeight: '85px', marginBottom: '0.25rem' }}>

                    <div className="profile-left">

                      <div className="profile-text-group">

                        <span className="profile-welcome-text" style={{ letterSpacing: '0.05em' }}>ESPORTS COMBO GUIDE</span>

                        <h4 className="profile-title" style={{ fontSize: '1.15rem', margin: 0 }}>{activeHeroCombo.name}</h4>

                        <span style={{ fontSize: '0.58rem', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 600 }}>

                          v{patchMeta.current_patch} Execution Rotation

                        </span>

                      </div>

                    </div>

                    

                    {/* Ambient Blurred Background Cover Layer */}

                    <div className="profile-banner-ambient-bg">

                      <SmartImage 

                        src={activeHeroCombo.avatar} 

                        alt="Ambient Aura" 

                        fallbackType="hero" 

                      />

                    </div>



                    {/* High-Fidelity Un-cropped Hero Medallion (Right Side) */}

                    <div className="profile-banner-showcase">

                      <SmartImage 

                        src={activeHeroCombo.avatar} 

                        alt={activeHeroCombo.name} 

                        className="profile-showcase-circle"

                        fallbackType="hero"

                      />

                      <span className="profile-showcase-label">{activeHeroCombo.name}</span>

                    </div>

                  </div>



                  {activeHeroCombo.combos.map((combo, idx) => (

                    <div key={idx} className="card" style={{ padding: '1rem', background: 'var(--color-bg)', border: '1px solid var(--border-light)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                      <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-blue)', margin: 0 }}>{combo.title}</h4>

                      

                      {/* Dynamic Skill Icon Sequence row */}

                      <div className="combo-sequence-row">

                        {combo.skills.map((skill, sIdx) => (

                          <React.Fragment key={sIdx}>

                            {sIdx > 0 && <span className="combo-chevron">&gt;</span>}

                            <div className="combo-skill-bubble" title={skill.name}>

                              <div className="combo-skill-bubble-icon">

                                <SmartImage src={skill.icon} alt={skill.name} fallbackType={skill.type === 'Spell' ? 'spell' : 'skill'} />

                              </div>

                              <span className="combo-skill-label">{skill.type}</span>

                            </div>

                          </React.Fragment>

                        ))}

                      </div>

                      

                      <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>

                        {combo.description}

                      </p>

                    </div>

                  ))}

                </div>

              );

            })()}

          </div>

        </div>

      )}



      {/* Screen 8.5: Matchup Spotlight Educational Overlay */}

      {showMatchupModal && matchupSpotlight && (

        <div className="modal-backdrop" onClick={() => setShowMatchupModal(false)}>

          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ borderRadius: '16px', padding: '1.25rem', height: 'auto', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>

              <h3 className="modal-hero-name" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 0, color: 'var(--text-primary)' }}>

                <Swords size={16} className="text-accent-red" />

                Matchup Counter Strategy

              </h3>

              <button onClick={() => setShowMatchupModal(false)} className="modal-close-btn">

                <X size={12} style={{ margin: '0 auto' }} />

              </button>

            </div>



            {/* Combatants Showcase Header Row */}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>

              {/* Left Hero (Counter) */}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', zIndex: 5 }}>

                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--accent-blue)', overflow: 'hidden', boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' }}>

                  <SmartImage src={matchupSpotlight.hero.avatar_url} alt={matchupSpotlight.hero.name} fallbackType="hero" />

                </div>

                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)' }}>{matchupSpotlight.hero.name}</span>

                <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--accent-blue)', background: 'var(--accent-blue-soft)', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>Counter</span>

              </div>



              {/* Clash Swords Icon */}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5 }}>

                <Swords size={22} className="text-accent-red" style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.2))' }} />

              </div>



              {/* Right Hero (Target) */}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', zIndex: 5 }}>

                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--text-muted)', overflow: 'hidden' }}>

                  <SmartImage src={matchupSpotlight.target.avatar_url} alt={matchupSpotlight.target.name} fallbackType="hero" />

                </div>

                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)' }}>{matchupSpotlight.target.name}</span>

                <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--text-muted)', background: '#f1f5f9', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>Target</span>

              </div>

            </div>



            {/* Educational Section 1: Why it works */}

            <div className="card" style={{ padding: '1rem', background: 'var(--color-bg)', border: '1px solid var(--border-light)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.85rem' }}>

              <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-red)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>

                <Lightbulb size={14} className="text-accent-red" /> Why It Works (Counter Strategy)

              </h4>

              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>

                {matchupSpotlight.reason}

              </p>

            </div>



            {/* Educational Section 2: How to execute inside the game */}

            <div className="card" style={{ padding: '1rem', background: 'var(--color-bg)', border: '1px solid var(--border-light)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

              <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-blue)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>

                <Gamepad2 size={14} className="text-accent-blue" /> In-Game Counter Execution (How to Play)

              </h4>

              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>

                {matchupSpotlight.hero.name === 'Saber' ? (

                  `1. Keep an eye on the minimap for ${matchupSpotlight.target.name}'s position. Hide in a bush near where she is farming.\n2. Apply Orbiting Swords (Skill 1) to send flying daggers out, reducing her physical defense.\n3. Close the gap using Charge (Skill 2) or use your ultimate directly if she is within range.\n4. Execute Triple Sweep (Ultimate) instantly. The combined Armor Shred and massive airborne burst will delete ${matchupSpotlight.target.name} before she can react with her ultimate or escape.`

                ) : (

                  `1. When playing as ${matchupSpotlight.hero.name}, do not waste your crowd control or burst skills on their tanks; save them specifically for ${matchupSpotlight.target.name}.\n2. Wait for ${matchupSpotlight.target.name} to enter a team fight or step out of position before initiating.\n3. Use your mobility or CC skills to close the distance and lock them down.\n4. Complete your skill chain instantly to burst them down before they can receive support from their roamers.`

                )}

              </p>

            </div>



            <button 

              onClick={() => setShowMatchupModal(false)}

              className="btn btn-primary"

              style={{ width: '100%', padding: '0.65rem', marginTop: '1.25rem', borderRadius: '10px' }}

            >

              Back to Esports Dashboard

            </button>

          </div>

        </div>

      )}



      {/* Screen 9: Spells Reference Guide Overlay */}

      {showSpellsModal && (

        <div className="modal-backdrop" onClick={() => setShowSpellsModal(false)}>

          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ borderRadius: '16px', padding: '1.25rem', height: 'auto', maxHeight: '90vh' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>

              <h3 className="modal-hero-name" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 0, color: 'var(--text-primary)' }}>

                <Shield size={16} className="text-accent-blue" />

                Battle Spells Reference Guide

              </h3>

              <button onClick={() => setShowSpellsModal(false)} className="modal-close-btn">

                <X size={12} style={{ margin: '0 auto' }} />

              </button>

            </div>

            

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.25rem' }}>

              {Object.keys(BATTLE_SPELLS_DATABASE).map((key) => {

                const spell = BATTLE_SPELLS_DATABASE[key];

                return (

                  <div key={key} className="card" style={{ padding: '0.65rem', display: 'flex', gap: '0.65rem', alignItems: 'center', background: 'var(--color-bg)', border: '1px solid var(--border-light)', borderRadius: '10px' }}>

                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-light)', flexShrink: 0 }}>

                      <SmartImage src={spell.icon} alt={spell.name} fallbackType="spell" />

                    </div>

                    <div>

                      <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{spell.name}</h4>

                      <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '0.15rem', margin: 0 }}>{spell.des}</p>

                    </div>

                  </div>

                );

              })}

            </div>

          </div>

        </div>

      )}



      {/* Screen 10: Multilingual Selection Overlay */}

      {showLangMenu && (

        <div className="modal-backdrop" onClick={() => setShowLangMenu(false)}>

          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ borderRadius: '16px', padding: '1.25rem', height: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>

              <h3 className="modal-hero-name" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 0, color: 'var(--text-primary)' }}>

                <Languages size={16} className="text-accent-blue" />

                Select Platform Language

              </h3>

              <button onClick={() => setShowLangMenu(false)} className="modal-close-btn">

                <X size={12} style={{ margin: '0 auto' }} />

              </button>

            </div>

            

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>

              {LANGUAGES_LIST.map(l => (

                <button

                  key={l.code}

                  disabled={l.disabled}

                  onClick={() => { if (!l.disabled) { setLang(l.code); setShowLangMenu(false); } }}

                  className={`btn ${lang === l.code ? 'btn-primary' : 'btn-secondary'}`}

                  style={{ 
                    padding: '0.75rem', 
                    borderRadius: '12px', 
                    fontSize: '0.7rem', 
                    fontWeight: 700,
                    opacity: l.disabled ? 0.5 : 1,
                    cursor: l.disabled ? 'not-allowed' : 'pointer'
                  }}

                >

                  {l.label}

                </button>

              ))}

            </div>

          </div>

        </div>

      )}



      {showShareToast && (

        <div className="esports-toast-notification">

          <span>Hero link copied</span>

        </div>

      )}



      {showBuildToast && (

        <div className="esports-toast-notification">

          <span>Build copied to clipboard</span>

        </div>

      )}



      {backToast && (

        <div className="esports-toast-notification">

          <span>{backToast}</span>

        </div>

      )}

      {errorToast && (
        <div className="esports-toast-notification" style={{ borderLeft: '3px solid var(--accent-red)' }}>
          <span>{errorToast}</span>
        </div>
      )}

      {replaceConfirmation && (
        <div className="modal-backdrop" onClick={() => setReplaceConfirmation(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ borderRadius: '16px', padding: '1.25rem', height: 'auto', maxWidth: '320px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Replace Hero?</h3>
            <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              Replace <strong>{replaceConfirmation.targetHero.name}</strong> with <strong>{replaceConfirmation.newHero.name}</strong> in the {['Jungle', 'EXP', 'Gold', 'Mid', 'Roam'][replaceConfirmation.targetIndex].toUpperCase()} slot?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setReplaceConfirmation(null)}
                style={{ height: '28px', fontSize: '0.55rem', fontWeight: 800, borderRadius: '6px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const newDraft = [...allyDraft];
                  newDraft[replaceConfirmation.targetIndex] = replaceConfirmation.newHero;
                  setAllyDraft(newDraft);
                  setRecentPicks(prev => {
                    const filtered = prev.filter(id => id !== replaceConfirmation.newHero.id);
                    return [replaceConfirmation.newHero.id, ...filtered].slice(0, 5);
                  });
                  setReplaceConfirmation(null);
                }}
                style={{ height: '28px', fontSize: '0.55rem', fontWeight: 800, borderRadius: '6px', cursor: 'pointer', background: 'var(--accent-blue)', border: 'none', color: 'white' }}
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}



      {!selectedHero && (
        <nav className="bottom-nav-bar" style={{ flexShrink: 0 }}>

          {[

            { tab: 'home', icon: Gamepad2, label: "Home" },

            { tab: 'heroes', icon: Search, label: "Heroes" },

            { tab: 'assistant', icon: Swords, label: "Draft" },

            { tab: 'battle', icon: ShieldAlert, label: "Battle" },

            { tab: 'rankings', icon: BarChart3, label: "Meta" }

          ].map(item => {

            const Icon = item.icon;

            return (

              <button 

                key={item.tab}

                onClick={() => {
                  if (item.tab !== 'heroes') setShowBuffedOnly(false);
                  setActiveTab(item.tab);
                }}

                className={`nav-tab ${activeTab === item.tab ? 'active' : ''}`}

              >

                <Icon size={18} />

                <span className="nav-tab-label">{item.label}</span>

              </button>

            );

          })}

        </nav>
      )}

      </div>

    </div>

  );

}

