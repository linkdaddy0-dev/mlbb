-- MLDraft Database Schema (Turso / SQLite Compatible)

-- Drop tables if they exist to allow clean seeding
DROP TABLE IF EXISTS translations;
DROP TABLE IF EXISTS matchups;
DROP TABLE IF EXISTS hero_builds;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS heroes;

-- 1. Heroes Table (Stores base numeric ratings and CDN media links)
CREATE TABLE heroes (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,          -- Marksman, Assassin, Fighter, Mage, Tank, Support
    durability INTEGER NOT NULL,  -- base alive rating (1-10 or 1-100)
    offense INTEGER NOT NULL,     -- base phy rating
    magic INTEGER NOT NULL,       -- base mag rating
    difficulty INTEGER NOT NULL,  -- base diff rating
    avatar_url TEXT,              -- CDN absolute avatar path
    cover_url TEXT,               -- CDN absolute background splash path
    gallery_url TEXT              -- CDN gallery picture path
);

-- 2. Skills Table (Stores skill order, active modifiers, and static icons)
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hero_id INTEGER NOT NULL,
    skill_index INTEGER NOT NULL, -- 0 for passive, 1-3/4 for active skills
    name_default TEXT NOT NULL,   -- Default English name
    icon_url TEXT NOT NULL,       -- CDN skill icon path
    FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE
);

-- 3. Equipment Table (Global database of all items in recommended guides)
CREATE TABLE equipment (
    id INTEGER PRIMARY KEY,
    name_default TEXT NOT NULL,   -- Default English name
    icon_url TEXT NOT NULL        -- CDN equipment icon path
);

-- 4. Hero Builds Table (Link table between heroes, recommended equipment, and spells)
CREATE TABLE hero_builds (
    hero_id INTEGER PRIMARY KEY,
    spell_1_icon TEXT,            -- CDN battle spell 1 path
    spell_2_icon TEXT,            -- CDN battle spell 2 path
    item_1_id INTEGER,
    item_2_id INTEGER,
    item_3_id INTEGER,
    item_4_id INTEGER,
    item_5_id INTEGER,
    item_6_id INTEGER,
    FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE,
    FOREIGN KEY (item_1_id) REFERENCES equipment(id),
    FOREIGN KEY (item_2_id) REFERENCES equipment(id),
    FOREIGN KEY (item_3_id) REFERENCES equipment(id),
    FOREIGN KEY (item_4_id) REFERENCES equipment(id),
    FOREIGN KEY (item_5_id) REFERENCES equipment(id),
    FOREIGN KEY (item_6_id) REFERENCES equipment(id)
);

-- 5. Matchups Table (Stores counter, countered-by, and synergy matrix data)
CREATE TABLE matchups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hero_id INTEGER NOT NULL,
    target_hero_name TEXT NOT NULL, -- Matchup hero name
    target_hero_icon TEXT,          -- CDN icon path
    matchup_type TEXT NOT NULL,     -- 'counter' (hero counters target), 'countered_by' (target counters hero), 'synergy' (best teammate)
    FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE
);

-- 6. Translations Table (The localization engine)
-- Supports English ('en'), Indonesian ('id'), Spanish ('es'), Tagalog ('tl'), etc.
CREATE TABLE translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    locale TEXT NOT NULL,           -- 'en', 'id', 'es', etc.
    table_name TEXT NOT NULL,       -- 'heroes', 'skills', 'equipment', 'hero_builds', 'matchups'
    record_id INTEGER NOT NULL,     -- The foreign key ID of the record in the target table
    column_name TEXT NOT NULL,     -- The column name being translated (e.g. 'description', 'tips')
    translated_text TEXT NOT NULL,
    UNIQUE(locale, table_name, record_id, column_name)
);

-- Indexing for lightning-fast edge performance
CREATE INDEX idx_skills_hero_id ON skills(hero_id);
CREATE INDEX idx_matchups_hero_id ON matchups(hero_id);
CREATE INDEX idx_translations_lookup ON translations(locale, table_name, record_id);
