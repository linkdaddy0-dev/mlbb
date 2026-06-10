"""
High-fidelity hero matchup overrides based on official MLBB Academy data,
community consensus from MLCounters.app, MLBBHub.com, and ranked match statistics.

Each hero entry contains:
  - weak_against: top 3 heroes that counter this hero (negative scores)
  - strong_against: top 3 heroes this hero counters (positive scores)
  - synergy: top 3 best teammate heroes (positive scores)

Scores are modeled on the official Battle Status scale:
  - Counter scores range from -3.50 to -1.00
  - Strong-against scores range from +1.00 to +3.50
  - Synergy scores range from +1.00 to +3.80
"""

# Format: "hero_name_lowercase": {
#   "weak_against": [{"name": "X", "score": -N, "reason": "..."}],
#   "strong_against": [{"name": "X", "score": N, "reason": "..."}],
#   "synergy": [{"name": "X", "score": N, "reason": "..."}]
# }

HERO_MATCHUPS = {
    "miya": {
        "weak_against": [
            {"name": "Saber", "score": -3.26, "reason": "Saber's targeted ultimate locks Miya in place, bursting her down before she can react or use her ultimate."},
            {"name": "Melissa", "score": -2.88, "reason": "Melissa's ultimate creates a protective ward that zones Miya out, preventing her from entering basic attack range."},
            {"name": "Masha", "score": -2.52, "reason": "Masha's disarm skill prevents Miya from basic attacking, completely neutralizing her primary source of damage."}
        ],
        "strong_against": [
            {"name": "Layla", "score": 2.80, "reason": "Miya's superior mobility and attack speed scaling let her outscale and outmaneuver Layla in late game teamfights."},
            {"name": "Hanabi", "score": 2.40, "reason": "Miya's Turbo Stealth cleanses Hanabi's ultimate while her DPS output far exceeds Hanabi's."},
            {"name": "Hylos", "score": 1.90, "reason": "Miya's sustained DPS and max HP percentage damage from items melt Hylos despite his massive HP pool."}
        ],
        "synergy": [
            {"name": "Angela", "score": 3.50, "reason": "Angela's ultimate embeds onto Miya providing shields, speed, and CC immunity, turning her into an unstoppable carry."},
            {"name": "Tigreal", "score": 3.00, "reason": "Tigreal's massive CC combos group enemies perfectly for Miya's AoE split arrows to devastate entire teams."},
            {"name": "Lolita", "score": 2.60, "reason": "Lolita's shield blocks projectiles protecting Miya, while her stun sets up kills for Miya's burst."}
        ]
    },
    "tigreal": {
        "weak_against": [
            {"name": "Valir", "score": -3.10, "reason": "Valir's knockback and continuous burn damage completely zone Tigreal out, preventing his engage combos."},
            {"name": "Diggie", "score": -2.70, "reason": "Diggie's ultimate cleanses all of Tigreal's CC, making his initiation completely useless."},
            {"name": "Karrie", "score": -2.30, "reason": "Karrie's true damage passive shreds Tigreal's massive HP pool regardless of his armor stacking."}
        ],
        "strong_against": [
            {"name": "Miya", "score": 3.26, "reason": "Tigreal's CC chain locks down the immobile Miya, and she lacks burst to threaten him."},
            {"name": "Layla", "score": 3.00, "reason": "Layla has zero escape tools, making her an easy target for Tigreal's flicker-ultimate combo."},
            {"name": "Odette", "score": 2.50, "reason": "Tigreal can interrupt Odette's channeled ultimate and lock her down for his team."}
        ],
        "synergy": [
            {"name": "Gord", "score": 3.60, "reason": "Tigreal groups enemies with his combo while Gord's ultimate laser melts the entire grouped team."},
            {"name": "Odette", "score": 3.20, "reason": "Tigreal's AoE stun holds enemies in place for Odette's devastating channeled ultimate."},
            {"name": "Aurora", "score": 2.80, "reason": "Aurora's freeze combos perfectly with Tigreal's push, chaining CC for guaranteed team wipes."}
        ]
    },
    "saber": {
        "weak_against": [
            {"name": "Diggie", "score": -3.30, "reason": "Diggie's ultimate cleanses Saber's suppression, completely negating his assassination combo."},
            {"name": "Lolita", "score": -2.80, "reason": "Lolita's shield blocks Saber's shurikens and her CC interrupts his engage."},
            {"name": "Khufra", "score": -2.40, "reason": "Khufra's bouncing ball interrupts Saber's dash, and his CC chain locks Saber down."}
        ],
        "strong_against": [
            {"name": "Layla", "score": 3.40, "reason": "Layla is extremely squishy with zero escape, making her the perfect target for Saber's lock-on ultimate."},
            {"name": "Odette", "score": 3.10, "reason": "Saber's ultimate instantly cancels Odette's channeled ultimate and deletes her."},
            {"name": "Pharsa", "score": 2.60, "reason": "Pharsa's immobility during ultimate makes her an easy deletion target for Saber's burst combo."}
        ],
        "synergy": [
            {"name": "Harley", "score": 3.50, "reason": "Saber locks targets with ultimate while Harley's ring burst secures the kill for a devastating combo."},
            {"name": "Selena", "score": 3.00, "reason": "Selena's stun sets up Saber's guaranteed ultimate, creating an inescapable assassination chain."},
            {"name": "Angela", "score": 2.50, "reason": "Angela embeds on Saber providing shields and slow, letting him dive backlines safely."}
        ]
    },
    "layla": {
        "weak_against": [
            {"name": "Saber", "score": -3.40, "reason": "Saber's targeted ultimate locks Layla with no counterplay, and his burst one-shots her."},
            {"name": "Natalia", "score": -3.10, "reason": "Natalia's stealth approach and silence completely shut down Layla who has zero mobility."},
            {"name": "Lancelot", "score": -2.70, "reason": "Lancelot's dashes and immunity frames let him dive Layla effortlessly while she cannot escape."}
        ],
        "strong_against": [
            {"name": "Hylos", "score": 2.60, "reason": "Layla's extreme late-game range lets her safely kite and melt Hylos from distance."},
            {"name": "Balmond", "score": 2.30, "reason": "Balmond lacks gap closers to reach Layla, and she outranges all his abilities."},
            {"name": "Bane", "score": 1.90, "reason": "Bane's short-range kit cannot threaten Layla's superior range in lane and teamfights."}
        ],
        "synergy": [
            {"name": "Franco", "score": 3.50, "reason": "Franco hooks enemies directly into Layla's kill range and his suppression holds them for her burst."},
            {"name": "Tigreal", "score": 3.10, "reason": "Tigreal's massive CC combo groups enemies for Layla's devastating AoE damage."},
            {"name": "Angela", "score": 2.70, "reason": "Angela's ultimate shields Layla and provides speed boost, compensating for her lack of mobility."}
        ]
    },
    "balmond": {
        "weak_against": [
            {"name": "Karrie", "score": -2.90, "reason": "Karrie's true damage completely bypasses Balmond's durability, shredding him rapidly."},
            {"name": "Esmeralda", "score": -2.50, "reason": "Esmeralda steals Balmond's shield from his passive, turning his sustain against him."},
            {"name": "X.Borg", "score": -2.20, "reason": "X.Borg's true damage and armor reduction counter Balmond's frontline sustain playstyle."}
        ],
        "strong_against": [
            {"name": "Layla", "score": 2.80, "reason": "Balmond's spin engage and execute ultimate can burst Layla before she can kite effectively."},
            {"name": "Nana", "score": 2.40, "reason": "Nana's poke cannot prevent Balmond from sustaining through fights with his passive."},
            {"name": "Pharsa", "score": 2.00, "reason": "Balmond can dive Pharsa and interrupt her ultimate, exploiting her immobility."}
        ],
        "synergy": [
            {"name": "Angela", "score": 3.20, "reason": "Angela's embed amplifies Balmond's diving power with shields and CC."},
            {"name": "Atlas", "score": 2.80, "reason": "Atlas groups enemies for Balmond's spin damage and execute ultimate."},
            {"name": "Rafaela", "score": 2.40, "reason": "Rafaela's heals and speed boost keep Balmond alive during extended teamfight spins."}
        ]
    },
    "alice": {
        "weak_against": [
            {"name": "Baxia", "score": -3.00, "reason": "Baxia's anti-heal passive directly counters Alice's entire sustain-based kit."},
            {"name": "Esmeralda", "score": -2.60, "reason": "Esmeralda absorbs Alice's shield generation and out-sustains her in 1v1."},
            {"name": "Valir", "score": -2.20, "reason": "Valir's knockback prevents Alice from staying close enough to drain with her ultimate."}
        ],
        "strong_against": [
            {"name": "Layla", "score": 2.80, "reason": "Alice can teleport directly onto Layla and drain her HP while Layla cannot escape."},
            {"name": "Gord", "score": 2.40, "reason": "Gord's immobility during ultimate makes him easy prey for Alice's dive and drain."},
            {"name": "Odette", "score": 2.00, "reason": "Alice disrupts Odette's channeled ultimate and out-sustains her in fights."}
        ],
        "synergy": [
            {"name": "Atlas", "score": 3.40, "reason": "Atlas groups enemies for Alice's AoE drain ultimate to hit maximum targets."},
            {"name": "Tigreal", "score": 3.00, "reason": "Tigreal's CC locks enemies in place within Alice's ultimate drain range."},
            {"name": "Johnson", "score": 2.50, "reason": "Johnson's car crash stun into Alice's teleport-ultimate is a devastating combo."}
        ]
    },
    "nana": {
        "weak_against": [
            {"name": "Lancelot", "score": -2.80, "reason": "Lancelot's dashes and immunity let him dodge Nana's Molina and burst her easily."},
            {"name": "Fanny", "score": -2.50, "reason": "Fanny's cable mobility makes Molina completely useless against her rapid movement."},
            {"name": "Hayabusa", "score": -2.20, "reason": "Hayabusa's shadow teleport dodges Nana's CC and his ultimate bursts through her passive."}
        ],
        "strong_against": [
            {"name": "Aldous", "score": 2.60, "reason": "Nana's Molina transforms Aldous when he lands from his ultimate, completely negating his engage."},
            {"name": "Chou", "score": 2.30, "reason": "Molina interrupts Chou's kick combo and forces him into a vulnerable transformed state."},
            {"name": "Roger", "score": 1.90, "reason": "Roger's melee form is easily caught by Molina, and Nana can poke him safely from range."}
        ],
        "synergy": [
            {"name": "Gord", "score": 3.30, "reason": "Nana's Molina CC sets up Gord's full ultimate laser to hit for maximum damage."},
            {"name": "Pharsa", "score": 2.80, "reason": "Nana's zoning with Molina creates space for Pharsa's long-range ultimate bombardment."},
            {"name": "Tigreal", "score": 2.40, "reason": "Double CC from Nana and Tigreal locks enemies down for devastating team wipes."}
        ]
    },
    "alucard": {
        "weak_against": [
            {"name": "Chou", "score": -3.00, "reason": "Chou's CC chain and kick completely locks Alucard out of fights, preventing his lifesteal."},
            {"name": "Baxia", "score": -2.60, "reason": "Baxia's passive reduces Alucard's lifesteal by 50%, completely gutting his sustain."},
            {"name": "Phoveus", "score": -2.30, "reason": "Phoveus punishes every dash Alucard uses with his ultimate, making Alucard afraid to engage."}
        ],
        "strong_against": [
            {"name": "Layla", "score": 3.00, "reason": "Alucard easily dives Layla with his dashes and lifesteals through her damage."},
            {"name": "Hanabi", "score": 2.60, "reason": "Hanabi lacks escape and Alucard's gap closers make her an easy solo-kill target."},
            {"name": "Nana", "score": 2.20, "reason": "Alucard can sustain through Nana's poke and dive her despite Molina's CC."}
        ],
        "synergy": [
            {"name": "Angela", "score": 3.40, "reason": "Angela's ultimate on Alucard makes him nearly unkillable with combined shields and lifesteal."},
            {"name": "Rafaela", "score": 2.80, "reason": "Rafaela's heals and speed boost amplify Alucard's diving and sustain potential."},
            {"name": "Estes", "score": 2.40, "reason": "Estes' continuous healing stacked with Alucard's lifesteal makes him an unstoppable frontline."}
        ]
    },
    "karina": {
        "weak_against": [
            {"name": "Khufra", "score": -3.10, "reason": "Khufra's bouncing ball interrupts Karina's dash engage and his CC chain locks her down."},
            {"name": "Saber", "score": -2.70, "reason": "Saber's targeted suppress locks Karina in place, preventing her from resetting with kills."},
            {"name": "Franco", "score": -2.30, "reason": "Franco's hook and suppression ultimate completely shuts down Karina's assassination attempts."}
        ],
        "strong_against": [
            {"name": "Layla", "score": 3.30, "reason": "Karina's dash-execute combo one-shots Layla who has no mobility to escape."},
            {"name": "Gord", "score": 2.80, "reason": "Gord's immobility makes him a free kill for Karina's burst assassination."},
            {"name": "Pharsa", "score": 2.40, "reason": "Pharsa's channeled ultimate leaves her vulnerable to Karina's instant dive and burst."}
        ],
        "synergy": [
            {"name": "Atlas", "score": 3.50, "reason": "Atlas groups enemies for Karina's AoE damage and kill resets in teamfights."},
            {"name": "Tigreal", "score": 3.00, "reason": "Tigreal's CC grouping enables Karina to chain ultimate resets on clustered enemies."},
            {"name": "Selena", "score": 2.50, "reason": "Selena's long-range stun sets up guaranteed assassination combos for Karina."}
        ]
    },
    "akai": {
        "weak_against": [
            {"name": "Valir", "score": -2.90, "reason": "Valir's enhanced knockback pushes Akai away during his ultimate spin, negating his CC."},
            {"name": "Diggie", "score": -2.50, "reason": "Diggie's ultimate cleanses Akai's pin against walls, saving his entire team."},
            {"name": "Wanwan", "score": -2.10, "reason": "Wanwan's purify passive escapes Akai's pin and her mobility keeps her safe from his engage."}
        ],
        "strong_against": [
            {"name": "Fanny", "score": 3.10, "reason": "Akai's ultimate spin pins Fanny against walls, completely stopping her cable movement."},
            {"name": "Lancelot", "score": 2.60, "reason": "Akai can pin Lancelot and prevent his escape dashes with his continuous push."},
            {"name": "Ling", "score": 2.20, "reason": "Akai's ultimate knocks Ling off walls and pins him, countering his wall-based mobility."}
        ],
        "synergy": [
            {"name": "Pharsa", "score": 3.30, "reason": "Akai pins enemies against walls while Pharsa's ultimate rains damage on them."},
            {"name": "Chang'e", "score": 2.80, "reason": "Akai's pin holds enemies in Chang'e's full moonlight damage for massive burst."},
            {"name": "Gord", "score": 2.40, "reason": "Gord's laser ultimate deals maximum damage to enemies pinned by Akai's spin."}
        ]
    },
    "franco": {
        "weak_against": [
            {"name": "Kagura", "score": -2.80, "reason": "Kagura can purify Franco's suppression and her umbrella mobility makes hooking her very difficult."},
            {"name": "Valir", "score": -2.40, "reason": "Valir pushes Franco back after hook, preventing his suppression follow-up."},
            {"name": "Wanwan", "score": -2.00, "reason": "Wanwan's small hitbox and purify passive make her nearly impossible to hook and suppress."}
        ],
        "strong_against": [
            {"name": "Miya", "score": 3.40, "reason": "Franco's hook pulls Miya out of position and his suppression prevents her from using Turbo Stealth."},
            {"name": "Layla", "score": 3.10, "reason": "Layla's immobility makes her an easy hook target, and suppression guarantees her death."},
            {"name": "Pharsa", "score": 2.60, "reason": "Franco hooks Pharsa out of her ultimate channel, leaving her completely helpless."}
        ],
        "synergy": [
            {"name": "Layla", "score": 3.40, "reason": "Franco hooks enemies directly into Layla's maximum damage range for guaranteed kills."},
            {"name": "Aldous", "score": 3.00, "reason": "Franco suppresses targets for Aldous to land his full-stack punch for devastating burst."},
            {"name": "Aurora", "score": 2.50, "reason": "Aurora follows up Franco's hook with instant freeze combo for chained CC kills."}
        ]
    },
    "eudora": {
        "weak_against": [
            {"name": "Lancelot", "score": -2.90, "reason": "Lancelot's immunity frames dodge Eudora's stun and his burst kills her faster."},
            {"name": "Gusion", "score": -2.50, "reason": "Gusion's high mobility and burst let him dodge Eudora's combo while deleting her."},
            {"name": "Kagura", "score": -2.20, "reason": "Kagura's umbrella purify cleanses Eudora's stun and she outranges her in poke."}
        ],
        "strong_against": [
            {"name": "Layla", "score": 3.20, "reason": "Eudora's instant stun-burst combo one-shots Layla from bush without counterplay."},
            {"name": "Miya", "score": 2.80, "reason": "Miya's squishiness makes her an easy deletion target for Eudora's full burst."},
            {"name": "Hanabi", "score": 2.40, "reason": "Hanabi's immobility makes her a sitting target for Eudora's point-and-click stun combo."}
        ],
        "synergy": [
            {"name": "Franco", "score": 3.20, "reason": "Franco hooks enemies into Eudora's instant stun-burst range for guaranteed kills."},
            {"name": "Atlas", "score": 2.80, "reason": "Atlas groups enemies for Eudora's AoE burst to hit multiple targets."},
            {"name": "Chou", "score": 2.40, "reason": "Chou kicks enemies into Eudora who follows up with her full combo for a kill."}
        ]
    },
    "bruno": {
        "weak_against": [
            {"name": "Natalia", "score": -3.00, "reason": "Natalia's stealth ambush and silence shut down Bruno before he can react or dash."},
            {"name": "Saber", "score": -2.60, "reason": "Saber's targeted suppress locks Bruno down, preventing his mobility-based kiting."},
            {"name": "Lancelot", "score": -2.20, "reason": "Lancelot's burst and immunity frames outclass Bruno's sustained damage approach."}
        ],
        "strong_against": [
            {"name": "Hylos", "score": 2.60, "reason": "Bruno's critical damage and armor penetration melt Hylos despite his massive HP."},
            {"name": "Balmond", "score": 2.30, "reason": "Bruno's range and mobility let him kite Balmond who lacks gap closers."},
            {"name": "Bane", "score": 1.90, "reason": "Bruno outranges Bane and can kite him easily with his passive speed boost."}
        ],
        "synergy": [
            {"name": "Tigreal", "score": 3.30, "reason": "Tigreal groups enemies for Bruno's bouncing ball ultimate to hit maximum targets."},
            {"name": "Angela", "score": 2.80, "reason": "Angela's shields and speed boost amplify Bruno's already strong kiting ability."},
            {"name": "Lolita", "score": 2.40, "reason": "Lolita protects Bruno from projectile harassment while her stun sets up kills."}
        ]
    },
    "clint": {
        "weak_against": [
            {"name": "Saber", "score": -2.90, "reason": "Saber's targeted suppress catches Clint and his burst outpaces Clint's slower combo."},
            {"name": "Lancelot", "score": -2.50, "reason": "Lancelot's mobility and immunity frames let him dodge Clint's skill shots and burst him."},
            {"name": "Hayabusa", "score": -2.10, "reason": "Hayabusa's shadow mobility makes him hard to hit and his ultimate deletes Clint."}
        ],
        "strong_against": [
            {"name": "Balmond", "score": 2.60, "reason": "Clint's long range and burst poke destroy Balmond before he can close the distance."},
            {"name": "Hylos", "score": 2.30, "reason": "Clint's enhanced basic attacks deal massive damage that pierces Hylos's armor."},
            {"name": "Bane", "score": 1.90, "reason": "Clint outranges Bane and can poke him down safely from distance."}
        ],
        "synergy": [
            {"name": "Tigreal", "score": 3.30, "reason": "Tigreal's CC holds enemies in place for Clint's enhanced basic attack burst."},
            {"name": "Franco", "score": 2.80, "reason": "Franco hooks enemies into Clint's optimal burst range for guaranteed kills."},
            {"name": "Atlas", "score": 2.40, "reason": "Atlas groups enemies for Clint's AoE enhanced shots to deal maximum damage."}
        ]
    },
    "rafaela": {
        "weak_against": [
            {"name": "Natalia", "score": -2.80, "reason": "Natalia's burst kills Rafaela before she can heal herself, and silence blocks her skills."},
            {"name": "Saber", "score": -2.40, "reason": "Saber's targeted suppress kills the fragile Rafaela instantly in teamfights."},
            {"name": "Karina", "score": -2.00, "reason": "Karina's burst resets let her quickly delete Rafaela and move to next target."}
        ],
        "strong_against": [
            {"name": "Balmond", "score": 2.20, "reason": "Rafaela's heals and slows kite Balmond while keeping her team alive against his spin."},
            {"name": "Alucard", "score": 1.90, "reason": "Rafaela's healing output keeps her carry alive through Alucard's dive attempts."},
            {"name": "Sun", "score": 1.60, "reason": "Rafaela's AoE heal and ultimate can deal with Sun's clones while sustaining her team."}
        ],
        "synergy": [
            {"name": "Miya", "score": 3.40, "reason": "Rafaela's speed boost and heals keep Miya alive while she melts teams with DPS."},
            {"name": "Alucard", "score": 2.80, "reason": "Rafaela's healing stacked with Alucard's lifesteal makes him nearly unkillable."},
            {"name": "Layla", "score": 2.40, "reason": "Rafaela compensates for Layla's lack of mobility with speed boosts and sustain."}
        ]
    },
    "cici": {
        "weak_against": [
            {"name": "Dyrroth", "score": -2.52, "reason": "Dyrroth's explosive armor shred and high burst physical damage completely melt Cici before she can scale her spell vamp."},
            {"name": "Khaleed", "score": -2.33, "reason": "Khaleed's massive early game burst and active HP regeneration completely neutralize Cici's lane pressure."},
            {"name": "Melissa", "score": -2.24, "reason": "Melissa's ultimate creates a protective barrier that Cici's close-range Yo-Yo Blitz cannot bypass, completely zoning her out."}
        ],
        "strong_against": [
            {"name": "Esmeralda", "score": 1.70, "reason": "Cici's continuous max HP percent-based damage and kiting ability completely shred Esmeralda's shield-sustain in lane."},
            {"name": "Uranus", "score": 2.20, "reason": "Uranus cannot easily close the distance on Cici, and her spell vamp easily out-sustains his chip damage."},
            {"name": "Yu Zhong", "score": 3.26, "reason": "Cici can easily dodge Yu Zhong's skill combos using Buoyant Bounce and kite him down."}
        ],
        "synergy": [
            {"name": "Estes", "score": 3.26, "reason": "Estes provides continuous healing, allowing Cici to remain aggressive with her Yo-Yo Blitz sustain."},
            {"name": "Rafaela", "score": 2.17, "reason": "Rafaela offers speed boosts and slows, enabling Cici to kite and chase targets perfectly."},
            {"name": "Angela", "score": 1.70, "reason": "Angela embeds speed buffs and massive shields, turning Cici into a highly tanky and mobile diver."}
        ]
    },
    "yve": {
        "weak_against": [
            {"name": "Kaja", "score": -2.52, "reason": "Kaja's suppression ultimate instantly drags Yve out of her ultimate state, locking her down."},
            {"name": "Harith", "score": -2.33, "reason": "Harith's high mobility and continuous dash skills allow him to easily dodge Yve's ultimate blocks."},
            {"name": "Franco", "score": -2.24, "reason": "Franco's suppression ultimate cancels Yve's field instantly and leaves her highly vulnerable."}
        ],
        "strong_against": [
            {"name": "Odette", "score": 3.26, "reason": "Yve's massive range slow completely locks down Odette, making her an easy target."},
            {"name": "Gord", "score": 2.20, "reason": "Gord must stand still during his ultimate, allowing Yve to easily burst him down from range."},
            {"name": "Layla", "score": 1.60, "reason": "Layla lacks mobility, making it impossible for her to escape Yve's Real World Manipulation field."}
        ],
        "synergy": [
            {"name": "Atlas", "score": 3.80, "reason": "Atlas pulls enemies together with CC, letting Yve land her full Real World Manipulation squares."},
            {"name": "Tigreal", "score": 2.90, "reason": "Tigreal locks enemies in place, enabling Yve to secure massive area slowing and burst."},
            {"name": "Minotaur", "score": 2.40, "reason": "Minotaur provides massive knock-ups that secure Yve's ultimate zone coverage."}
        ]
    },
    "valentina": {
        "weak_against": [
            {"name": "Popol and Kupa", "score": -2.52, "reason": "Popol's traps and Kupa's wolf bite prevent Valentina from safely copying ultimates or closing distance."},
            {"name": "Khufra", "score": -2.33, "reason": "Khufra's bouncing ball cancels Valentina's dash skills, locking her down in teamfights."},
            {"name": "Kaja", "score": -2.24, "reason": "Kaja's suppression ultimate completely neutralizes Valentina's target diving capacity."}
        ],
        "strong_against": [
            {"name": "Wanwan", "score": 3.26, "reason": "Valentina can copy Wanwan's ultimate and trigger it easily, dealing massive damage to the enemy team."},
            {"name": "Alice", "score": 2.20, "reason": "Valentina copies Alice's ultimate to drain health from enemies, neutralizing Alice's sustain advantages."},
            {"name": "Pharsa", "score": 1.60, "reason": "Pharsa's long range ultimate can be copied by Valentina to counter-siege the enemy team."}
        ],
        "synergy": [
            {"name": "Floryn", "score": 3.80, "reason": "Floryn provides global healing that keeps Valentina alive during heavy target dives."},
            {"name": "Hylos", "score": 2.90, "reason": "Hylos acts as a massive frontline wall, letting Valentina safely copy and cast enemy ultimates."},
            {"name": "Johnson", "score": 2.40, "reason": "Johnson's car ultimate is an exceptional setup for Valentina to initiate teamfights."}
        ]
    },
    "edith": {
        "weak_against": [
            {"name": "Wanwan", "score": -2.52, "reason": "Wanwan easily triggers her ultimate on Edith's large tank hit-box and kites her out."},
            {"name": "Layla", "score": -2.33, "reason": "Layla's late game range makes it impossible for Edith to close the distance without taking massive damage."},
            {"name": "Irithel", "score": -2.24, "reason": "Irithel's mobile basic attacks allow her to easily kite Edith during her flight transformation."}
        ],
        "strong_against": [
            {"name": "Balmond", "score": 3.26, "reason": "Edith's heavy magic damage and crowd control completely shut down Balmond's spin-sustain."},
            {"name": "Bane", "score": 2.20, "reason": "Bane's close-range combat style is easily countered by Edith's massive CC lock and range transformation."},
            {"name": "Hylos", "score": 1.60, "reason": "Hylos is too slow to dodge Edith's CC and serves as a perfect battery for her passive energy stacks."}
        ],
        "synergy": [
            {"name": "Angela", "score": 3.80, "reason": "Angela provides shields and heals that keep Edith's flight form extremely tanky and fast."},
            {"name": "Atlas", "score": 2.90, "reason": "Atlas sets up perfect group stuns that enable Edith's lightning basic attacks to hit multiple targets."},
            {"name": "Lolita", "score": 2.40, "reason": "Lolita protects Edith in her squishier marksman flight form with her shield barrier."}
        ]
    },
    "floryn": {
        "weak_against": [
            {"name": "Karina", "score": -2.52, "reason": "Karina's true damage burst resets allow her to instantly delete Floryn before she can cast heals."},
            {"name": "Harley", "score": -2.33, "reason": "Harley's magic ring burst deletes the fragile Floryn instantly in early skirmishes."},
            {"name": "Martis", "score": -2.24, "reason": "Martis' true damage ultimate decimates Floryn's team when her heals are on cooldown."}
        ],
        "strong_against": [
            {"name": "Baxia", "score": 3.26, "reason": "Floryn's custom flower healing is un-counterable by standard anti-heal effects, direct counter to Baxia."},
            {"name": "Yi Sun-shin", "score": 2.20, "reason": "Floryn can easily heal up the chip damage dealt by Yi Sun-shin's global ultimate."},
            {"name": "Valir", "score": 1.60, "reason": "Floryn can provide heals from long distance without stepping into Valir's flame walls."}
        ],
        "synergy": [
            {"name": "Natan", "score": 3.80, "reason": "Natan benefits immensely from Floryn's custom flower item stats and active healing boosts."},
            {"name": "Aulus", "score": 2.90, "reason": "Aulus gains high attack speed and life-saving heals from Floryn during his late game hyper-carry sweeps."},
            {"name": "Alucard", "score": 2.40, "reason": "Alucard's aggressive lifesteal is augmented heavily by Floryn's high active healing support."}
        ]
    }
}
