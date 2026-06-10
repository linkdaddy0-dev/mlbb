# MLBB Draft Assistant - High-Fidelity Esports Matchup Overrides
# Integrated directly during static compilation to align GMS data with pro-tier tournament picks.

HERO_MATCHUPS = {
    "Miya": {
        "counters": [
            {"heroid": 70, "score": -5.50},  # Belerick (Hard Counter -3.45 in raw stats, pushed to -5.50)
            {"heroid": 41, "score": -4.80},  # Gatotkaca
            {"heroid": 99, "score": -4.20},  # Barats
            {"heroid": 20, "score": -3.80},  # Lolita
            {"heroid": 93, "score": -3.50},  # Atlas
            {"heroid": 6, "score": -3.20}    # Tigreal
        ]
    },
    "Hanabi": {
        "counters": [
            {"heroid": 20, "score": -5.80},  # Lolita (Hard projectile block shield counter)
            {"heroid": 70, "score": -4.20},  # Belerick
            {"heroid": 3, "score": -3.80},   # Saber
            {"heroid": 24, "score": -3.50}   # Natalia
        ]
    },
    "Fanny": {
        "counters": [
            {"heroid": 78, "score": -5.90},  # Khufra (Grounded bounce ball hard counter)
            {"heroid": 72, "score": -5.60},  # Minsitthar (Grounding control arena counter)
            {"heroid": 70, "score": -4.20},  # Belerick (Taunt control)
            {"heroid": 10, "score": -4.00},  # Franco (Suppress hook)
            {"heroid": 12, "score": -3.80},  # Bruno
            {"heroid": 3, "score": -3.50}    # Saber
        ]
    },
    "Ling": {
        "counters": [
            {"heroid": 72, "score": -5.80},  # Minsitthar (Grounding dome arena blocks Ling wall dive)
            {"heroid": 78, "score": -4.50},  # Khufra (Wall jump bounce intercept)
            {"heroid": 24, "score": -4.20},  # Natalia
            {"heroid": 3, "score": -3.90}    # Saber (Targeted aerial burst)
        ]
    },
    "Moskov": {
        "counters": [
            {"heroid": 70, "score": -5.60},  # Belerick (Hard taunt counter to attack-speed marksmen)
            {"heroid": 20, "score": -4.20},  # Lolita (Shield projectile block)
            {"heroid": 41, "score": -3.80},  # Gatotkaca (Armor taunt)
            {"heroid": 3, "score": -3.50}    # Saber
        ]
    }
}
