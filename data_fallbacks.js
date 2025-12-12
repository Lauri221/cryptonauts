(function initCryptonautFallbacks() {
  const root = typeof window !== 'undefined' ? window : globalThis;

  const charactersFallback = {
    "characters": [
      {
        "id": "monk",
        "class": "Monk",
        "base_stats": {
          "hp": 30,
          "sanity": 20,
          "basic_attack": { "dice": 2, "sides": 4 },
          "defense": 1,
          "speed": 3,
          "ability1": { "id": "calm", "name": "Calm", "description": "Restore party sanity." },
          "ability2": { "id": "hypnotise", "name": "Hypnotize", "description": "Charm an enemy to fight for you." },
          "resistance": "Sanity",
          "weakness": "Natural"
        },
        "gender_variants": {
          "m": {
            "portrait": "assets/img/ally_portrait/monk_male.png",
            "audio": {
              "voice_hurt": "cryptonaut_male_hurt_sounds",
              "voice_death": "cryptonaut_male_death_sounds",
              "voice_win": "cryptonaut_male_win_sounds",
              "voice_combat_start": "cryptonaut_male_combat_start_sounds",
              "voice_party_death": "party_death_male_sound"
            }
          },
          "f": {
            "portrait": "assets/img/ally_portrait/monk_female.png",
            "audio": {
              "voice_hurt": "cryptonaut_female_hurt_sounds",
              "voice_death": "cryptonaut_female_death_sounds",
              "voice_win": "cryptonaut_female_win_sounds",
              "voice_combat_start": "cryptonaut_female_combat_start_sounds",
              "voice_party_death": "party_death_female_sound"
            }
          }
        },
        "starting_inventory": ["herbal_tonic"]
      },
      {
        "id": "warrior",
        "class": "Warrior",
        "base_stats": {
          "hp": 30,
          "sanity": 20,
          "basic_attack": { "dice": 2, "sides": 6 },
          "defense": 2,
          "speed": 2,
          "ability1": {
            "id": "parry",
            "name": "Parry",
            "description": "Brace for impact; when hit this round, immediately retaliate with a basic attack."
          },
          "ability2": {
            "id": "shield_bash",
            "name": "Shield Bash",
            "description": "Strike the enemy with a heavy blow, with a chance to stun them for one turn."
          },
          "resistance": "Natural",
          "weakness": "Sanity"
        },
        "gender_variants": {
          "m": {
            "portrait": "assets/img/ally_portrait/warrior_male.png",
            "audio": {
              "voice_hurt": "cryptonaut_male_hurt_sounds",
              "voice_death": "cryptonaut_male_death_sounds",
              "voice_win": "cryptonaut_male_win_sounds",
              "voice_combat_start": "cryptonaut_male_combat_start_sounds",
              "voice_party_death": "party_death_male_sound"
            }
          },
          "f": {
            "portrait": "assets/img/ally_portrait/warrior_female.png",
            "audio": {
              "voice_hurt": "cryptonaut_female_hurt_sounds",
              "voice_death": "cryptonaut_female_death_sounds",
              "voice_win": "cryptonaut_female_win_sounds",
              "voice_combat_start": "cryptonaut_female_combat_start_sounds",
              "voice_party_death": "party_death_female_sound"
            }
          }
        },
        "starting_inventory": ["herbal_tonic"]
      },
      {
        "id": "alchemist",
        "class": "Alchemist",
        "base_stats": {
          "hp": 24,
          "sanity": 20,
          "basic_attack": { "dice": 1, "sides": 8 },
          "defense": 1,
          "speed": 2,
          "ability1": {
            "id": "brew_potion",
            "name": "Brew Potion",
            "description": "Concoct a restorative draught, adding a healing or soothing potion to the party's inventory."
          },
          "ability2": {
            "id": "poison_cloud",
            "name": "Poison Cloud",
            "description": "Release a toxic cloud that damages and poisons all enemies for several rounds."
          },
          "resistance": "Poison",
          "weakness": "Natural"
        },
        "gender_variants": {
          "m": {
            "portrait": "assets/img/ally_portrait/alchemist_male.png",
            "audio": {
              "voice_hurt": "cryptonaut_male_hurt_sounds",
              "voice_death": "cryptonaut_male_death_sounds",
              "voice_win": "cryptonaut_male_win_sounds",
              "voice_combat_start": "cryptonaut_male_combat_start_sounds",
              "voice_party_death": "party_death_male_sound"
            }
          },
          "f": {
            "portrait": "assets/img/ally_portrait/alchemist_female.png",
            "audio": {
              "voice_hurt": "cryptonaut_female_hurt_sounds",
              "voice_death": "cryptonaut_female_death_sounds",
              "voice_win": "cryptonaut_female_win_sounds",
              "voice_combat_start": "cryptonaut_female_combat_start_sounds",
              "voice_party_death": "party_death_female_sound"
            }
          }
        },
        "starting_inventory": ["herbal_tonic"]
      },
      {
        "id": "cleric",
        "class": "Cleric",
        "base_stats": {
          "hp": 24,
          "sanity": 28,
          "basic_attack": { "dice": 2, "sides": 4 },
          "defense": 1,
          "speed": 2,
          "ability1": {
            "id": "heal",
            "name": "Heal",
            "description": "Channel sacred power to restore HP to a single ally during combat."
          },
          "ability2": {
            "id": "fireblast",
            "name": "Fireblast",
            "description": "Unleash a blast of searing holy fire that damages all enemies."
          },
          "resistance": "Fire",
          "weakness": "Poison"
        },
        "gender_variants": {
          "m": {
            "portrait": "assets/img/ally_portrait/cleric_male.png",
            "audio": {
              "voice_hurt": "cryptonaut_male_hurt_sounds",
              "voice_death": "cryptonaut_male_death_sounds",
              "voice_win": "cryptonaut_male_win_sounds",
              "voice_combat_start": "cryptonaut_male_combat_start_sounds",
              "voice_party_death": "party_death_male_sound"
            }
          },
          "f": {
            "portrait": "assets/img/ally_portrait/cleric_female.png",
            "audio": {
              "voice_hurt": "cryptonaut_female_hurt_sounds",
              "voice_death": "cryptonaut_female_death_sounds",
              "voice_win": "cryptonaut_female_win_sounds",
              "voice_combat_start": "cryptonaut_female_combat_start_sounds",
              "voice_party_death": "party_death_female_sound"
            }
          }
        },
        "starting_inventory": ["herbal_tonic"]
      },
      {
        "id": "aberration",
        "class": "Aberration",
        "base_stats": {
          "hp": 28,
          "sanity": 14,
          "basic_attack": { "dice": 2, "sides": 8 },
          "defense": 1,
          "speed": 2,
          "ability1": { "id": "savage", "name": "Savage", "description": "Unleash a brutal strike that deals very high damage to a single target." },
          "ability2": { "id": "roar", "name": "Roar", "description": "Emit a horrifying roar that may paralyze all enemies with fear." },
          "resistance": "Natural",
          "weakness": "Fire"
        },
        "gender_variants": {
          "m": {
            "portrait": "assets/img/ally_portrait/monster_male.png",
            "audio": {
              "voice_hurt": "cryptonaut_male_hurt_sounds",
              "voice_death": "cryptonaut_male_death_sounds",
              "voice_win": "cryptonaut_male_win_sounds",
              "voice_combat_start": "cryptonaut_male_combat_start_sounds",
              "voice_party_death": "party_death_male_sound"
            }
          }
        },
        "starting_inventory": []
      }
    ],
    "companions": [
      {
        "id": "eleanor",
        "name": "Dr. Eleanor Marsh",
        "class": "Alchemist",
        "gender": "f",
        "backstory": "A disgraced professor of chemistry who delved too deep into forbidden formulas. Her knowledge of compounds may save your life—or end it.",
        "portrait": "assets/img/ally_portrait/alchemist_female.png",
        "base_stats": {
          "hp": 24,
          "sanity": 20,
          "basic_attack": { "dice": 1, "sides": 8 },
          "defense": 1,
          "speed": 2,
          "ability1": {
            "id": "brew_potion",
            "name": "Brew Potion",
            "description": "Concoct a restorative draught, adding a healing potion to inventory."
          },
          "ability2": {
            "id": "poison_cloud",
            "name": "Poison Cloud",
            "description": "Release a toxic cloud that damages and poisons all enemies."
          },
          "resistance": "Poison",
          "weakness": "Natural"
        },
        "audio": {
          "voice_hurt": "cryptonaut_female_hurt_sounds",
          "voice_death": "cryptonaut_female_death_sounds",
          "voice_win": "cryptonaut_female_win_sounds",
          "voice_combat_start": "cryptonaut_female_combat_start_sounds",
          "voice_party_death": "party_death_female_sound"
        },
        "starting_inventory": ["herbal_tonic"]
      },
      {
        "id": "marcus",
        "name": "Marcus Vale",
        "class": "Warrior",
        "gender": "m",
        "backstory": "A veteran soldier haunted by what he witnessed in the trenches. His blade arm is steady, but his nightmares never cease.",
        "portrait": "assets/img/ally_portrait/warrior_male.png",
        "base_stats": {
          "hp": 30,
          "sanity": 20,
          "basic_attack": { "dice": 2, "sides": 6 },
          "defense": 2,
          "speed": 2,
          "ability1": {
            "id": "parry",
            "name": "Parry",
            "description": "Brace for impact; when hit, immediately retaliate."
          },
          "ability2": {
            "id": "shield_bash",
            "name": "Shield Bash",
            "description": "A heavy blow with a chance to stun."
          },
          "resistance": "Natural",
          "weakness": "Sanity"
        },
        "audio": {
          "voice_hurt": "cryptonaut_male_hurt_sounds",
          "voice_death": "cryptonaut_male_death_sounds",
          "voice_win": "cryptonaut_male_win_sounds",
          "voice_combat_start": "cryptonaut_male_combat_start_sounds",
          "voice_party_death": "party_death_male_sound"
        },
        "starting_inventory": ["herbal_tonic"]
      },
      {
        "id": "agatha",
        "name": "Sister Agatha",
        "class": "Cleric",
        "gender": "f",
        "backstory": "A nun who lost her faith after witnessing an exorcism gone wrong. She still channels divine power—but questions its source.",
        "portrait": "assets/img/ally_portrait/cleric_female.png",
        "base_stats": {
          "hp": 24,
          "sanity": 28,
          "basic_attack": { "dice": 2, "sides": 4 },
          "defense": 1,
          "speed": 2,
          "ability1": {
            "id": "heal",
            "name": "Heal",
            "description": "Channel sacred power to restore HP to an ally."
          },
          "ability2": {
            "id": "fireblast",
            "name": "Fireblast",
            "description": "A blast of holy fire that damages all enemies."
          },
          "resistance": "Fire",
          "weakness": "Poison"
        },
        "audio": {
          "voice_hurt": "cryptonaut_female_hurt_sounds",
          "voice_death": "cryptonaut_female_death_sounds",
          "voice_win": "cryptonaut_female_win_sounds",
          "voice_combat_start": "cryptonaut_female_combat_start_sounds",
          "voice_party_death": "party_death_female_sound"
        },
        "starting_inventory": ["herbal_tonic"]
      },
      {
        "id": "chen",
        "name": "Master Chen",
        "class": "Monk",
        "gender": "m",
        "backstory": "A wandering mystic from distant lands who seeks to understand the cosmic truths hidden in madness. His calm is unsettling.",
        "portrait": "assets/img/ally_portrait/monk_male.png",
        "base_stats": {
          "hp": 30,
          "sanity": 20,
          "basic_attack": { "dice": 2, "sides": 4 },
          "defense": 1,
          "speed": 3,
          "ability1": {
            "id": "calm",
            "name": "Calm",
            "description": "Restore sanity to the entire party."
          },
          "ability2": {
            "id": "hypnotise",
            "name": "Hypnotize",
            "description": "Charm an enemy to fight for you."
          },
          "resistance": "Sanity",
          "weakness": "Natural"
        },
        "audio": {
          "voice_hurt": "cryptonaut_male_hurt_sounds",
          "voice_death": "cryptonaut_male_death_sounds",
          "voice_win": "cryptonaut_male_win_sounds",
          "voice_combat_start": "cryptonaut_male_combat_start_sounds",
          "voice_party_death": "party_death_male_sound"
        },
        "starting_inventory": ["herbal_tonic"]
      },
      {
        "id": "aberrant_thrall",
        "name": "Bound Aberration",
        "class": "Aberration",
        "gender": "m",
        "backstory": "A chained horror, shackled by sigils to obey your commands—for now.",
        "portrait": "assets/img/ally_portrait/monster_male.png",
        "base_stats": {
          "hp": 28,
          "sanity": 14,
          "basic_attack": { "dice": 2, "sides": 8 },
          "defense": 1,
          "speed": 2,
          "ability1": {
            "id": "savage",
            "name": "Savage",
            "description": "Unleash a brutal strike that deals very high damage to a single target."
          },
          "ability2": {
            "id": "roar",
            "name": "Roar",
            "description": "Emit a horrifying roar that may paralyze all enemies with fear."
          },
          "resistance": "Natural",
          "weakness": "Fire"
        },
        "audio": {
          "voice_hurt": "cryptonaut_monster_hurt_sounds",
          "voice_death": "cryptonaut_monster_death_sounds",
          "voice_win": "cryptonaut_monster_win_sounds",
          "voice_combat_start": "cryptonaut_monster_combat_start_sounds",
          "voice_party_death": "party_death_monster_sound"
        },
        "starting_inventory": []
      }
    ]
  };

  const roomsFallback = {
    "rooms": [
      {
        "id": "room_01_entrance",
        "name": "Crypt Threshold",
        "depth": 1,
        "type": "entrance",
        "nextRooms": ["room_02_gallery"],
        "tags": ["intro", "low_threat", "safe_rest", "stone", "stairs"],
        "baseDescription": "A narrow stairway descends from the chapel into the crypt below. Stale air rolls up from the dark, carrying the faint smell of old incense and damp stone.",
        "environmentFeatures": [
          "narrow stairway",
          "rusted iron gate",
          "faded warding sigils on the arch",
          "broken offering bowl"
        ],
        "image": "assets/img/environment/room_01_entrance.png",
        "maxThreatLevel": 1,
        "allowRest": true,
        "guaranteedEvents": [
          "first_torch_pickup"
        ],
        "optionalEvents": [
          "strange_draft_whispers",
          "old_offering_coin",
          "fading_holy_symbol"
        ]
      },
      {
        "id": "room_02_gallery",
        "name": "Gallery of Faceless Saints",
        "depth": 2,
        "type": "hall",
        "nextRooms": ["room_03_ossuary", "room_02a_side_cellar"],
        "tags": ["mid_threat", "statues", "uncanny", "cult"],
        "baseDescription": "Rows of hooded statues stand in alcoves along both walls, their faces chiseled smooth. Melted candles cling to their feet like pale, waxen roots.",
        "environmentFeatures": [
          "hooded statues with erased faces",
          "melted candle stumps",
          "dust-laden stone benches",
          "cracked frescoes of forgotten saints"
        ],
        "image": "assets/img/environment/room_02_gallery.png",
        "maxThreatLevel": 2,
        "allowRest": false,
        "guaranteedEvents": [
          "first_sanity_check_from_statues"
        ],
        "optionalEvents": [
          "hidden_relic_behind_statue",
          "waxen_footprints_leading_aside",
          "whispering_crowd_hallucination"
        ]
      },
      {
        "id": "room_02a_side_cellar",
        "name": "Side Cellar of Spoiled Offerings",
        "depth": 2,
        "type": "side_room",
        "nextRooms": ["room_03_ossuary"],
        "tags": ["loot_focus", "low_mid_threat", "rot", "vermin"],
        "baseDescription": "A low stone door leads into a cramped cellar. Shelves sag under the weight of cracked jars and mold-eaten offerings, their contents long since curdled into black sludge.",
        "environmentFeatures": [
          "cramped ceiling and narrow aisles",
          "shelves of decayed offerings",
          "scuttling vermin in the darkness",
          "faint smell of sour wine and rot"
        ],
        "image": "assets/img/environment/room_02a_side_cellar.png",
        "maxThreatLevel": 2,
        "allowRest": false,
        "guaranteedEvents": [
          "chance_for_minor_loot",
          "risk_of_poison_or_disease"
        ],
        "optionalEvents": [
          "cursed_wine_flask",
          "rat_swarm_scare",
          "hidden_compartment_with_talisman"
        ]
      },
      {
        "id": "room_03_ossuary",
        "name": "Bone-Bound Ossuary",
        "depth": 3,
        "type": "chamber",
        "nextRooms": ["room_04_flooded_stair"],
        "tags": ["mid_threat", "bones", "restless_dead", "claustrophobic"],
        "baseDescription": "The walls of this chamber are mortared with skulls and longbones. The hollow eye sockets seem to follow every flicker of your torch.",
        "environmentFeatures": [
          "walls entirely lined with bones",
          "loose skulls stacked in the center",
          "narrow walkways between bone stacks",
          "lingering cold that seeps into the marrow"
        ],
        "image": "assets/img/environment/room_03_ossuary.png",
        "maxThreatLevel": 2,
        "allowRest": false,
        "guaranteedEvents": [
          "first_undead_or_restless_bones_encounter"
        ],
        "optionalEvents": [
          "bone_charm_loot",
          "collapsing_bone_stack_trap",
          "whispering_from_single_skull"
        ]
      },
      {
        "id": "room_04_flooded_stair",
        "name": "Flooded Stairwell",
        "depth": 4,
        "type": "corridor",
        "nextRooms": ["room_05_chanting_hall"],
        "tags": ["mid_threat", "environmental_hazard", "water", "darkness"],
        "baseDescription": "A spiraling stairwell descends into black water. Each step is slick with slime, and the surface of the flood reflects your torchlight like a trembling, fractured mirror.",
        "environmentFeatures": [
          "waist-deep stagnant water",
          "slick moss-covered steps",
          "floating scraps of parchment and wax",
          "distant ripples with no clear source"
        ],
        "image": "assets/img/environment/room_04_flooded_stair.png",
        "maxThreatLevel": 2,
        "allowRest": false,
        "guaranteedEvents": [
          "environmental_test_slip_or_drown",
          "chance_to_soak_or_ruin_gear"
        ],
        "optionalEvents": [
          "lurking_watery_shape_attack",
          "sunken_chest_with_rusted_relic",
          "sanity_drain_from_reflections"
        ]
      },
      {
        "id": "room_05_chanting_hall",
        "name": "Hall of Drowned Chants",
        "depth": 5,
        "type": "ritual_hall",
        "nextRooms": ["room_06_dreaming_vault"],
        "tags": ["high_threat", "cultists", "ritual", "sound"],
        "baseDescription": "Long stone pews face a cracked altar. The walls are carved with overlapping runes, blackened by soot. Faint echoes of chanting hang in the air, though the hall stands empty.",
        "environmentFeatures": [
          "stone pews slick with candle wax",
          "cracked black altar",
          "walls covered in overlapping runes",
          "lingering echo of impossible chanting"
        ],
        "image": "assets/img/environment/room_05_chanting_hall.png",
        "maxThreatLevel": 3,
        "allowRest": false,
        "guaranteedEvents": [
          "major_cultist_or_spirit_encounter"
        ],
        "optionalEvents": [
          "ritual_circle_buff_or_curse",
          "hidden_switch_to_secret_compartment",
          "vision_of_past_sacrifice_sanity_hit"
        ]
      },
      {
        "id": "room_06_dreaming_vault",
        "name": "Dreaming Vault",
        "depth": 6,
        "type": "antechamber",
        "nextRooms": ["room_boss_sanctum"],
        "tags": ["high_threat", "dreams", "eldritch", "pre_boss"],
        "baseDescription": "This low, domed chamber hums with a pressure you feel more in your thoughts than in your ears. Symbols of the Old Ones spiral across the floor, converging on a sealed stone door.",
        "environmentFeatures": [
          "domed ceiling of interlocking stones",
          "spiraling eldritch sigils on the floor",
          "sealed stone door marked with a many-eyed sigil",
          "air thick with the taste of metal and sleep"
        ],
        "image": "assets/img/environment/room_06_dreaming_vault.png",
        "maxThreatLevel": 3,
        "allowRest": true,
        "guaranteedEvents": [
          "final_rest_or_sanity_test_before_boss",
          "vision_of_boss_and_future_doom"
        ],
        "optionalEvents": [
          "dream_bargain_with_entity",
          "temporary_buff_or_curse",
          "memory_fragment_from_previous_expedition"
        ]
      },
      {
        "id": "room_boss_sanctum",
        "name": "Sanctum of the Old One",
        "depth": 7,
        "type": "boss",
        "nextRooms": [],
        "tags": ["boss", "eldritch", "high_threat", "endgame"],
        "baseDescription": "The sanctum opens like a stone maw around a pit of midnight. Tendrils of black ichor cling to the walls, pulsing in time with a heartbeat that is not your own.",
        "environmentFeatures": [
          "central abyssal pit",
          "pulsing black ichor on the walls",
          "ceiling lost in darkness speckled with false stars",
          "ritual pillars carved with impossible geometries"
        ],
        "image": "assets/img/environment/room_boss_sanctum.png",
        "maxThreatLevel": 3,
        "allowRest": false,
        "guaranteedEvents": [
          "final_boss_encounter"
        ],
        "optionalEvents": [
          "pre_boss_dialogue_or_vision",
          "desperate_sacrifice_option",
          "alternate_ending_trigger"
        ]
      }
    ],
    "validItemIds": [
      "vial_vital_humours",
      "tincture_of_lucidity",
      "coagulant_seal_bandages",
      "berserker_blood",
      "nightshade_resin",
      "black_tar_pitch",
      "chillwater_vapours_phial",
      "purging_bitter_tincture",
      "coagulant_seal_tonic",
      "dreamless_incense",
      "sigil_of_warding",
      "chains_of_old",
      "eldritch_discord",
      "herbal_tonic",
      "scroll_spirit_guardian",
      "scroll_shadow_familiar",
      "scroll_healing_wisp"
    ],
    "validEnemyIds": [
      "priestess",
      "mossleech",
      "cultist",
      "aberrant_beast",
      "rat_man",
      "sewer_centipede",
      "male_grave_robber",
      "corpse_eater",
      "female_grave_robber",
      "flesh_eating_vines",
      "drowned_acolyte",
      "leech_swarm",
      "flesh_golem",
      "pit_butcher",
      "dream_eater"
    ],
    "enemyByRoom": {
      "room_01_entrance": ["rat_man", "mossleech"],
      "room_02_gallery": ["cultist", "female_grave_robber", "male_grave_robber"],
      "room_02a_side_cellar": ["rat_man", "mossleech", "sewer_centipede"],
      "room_03_ossuary": ["corpse_eater", "aberrant_beast", "flesh_eating_vines"],
      "room_04_flooded_stair": ["mossleech", "leech_swarm", "drowned_acolyte"],
      "room_05_chanting_hall": ["cultist", "priestess", "drowned_acolyte"],
      "room_06_dreaming_vault": ["dream_eater", "flesh_golem"],
      "room_boss_sanctum": ["astral_summoner"]
    }
  };

  const enemiesFallback = {
    "enemies": [
      {
        "id": "priestess",
        "name": "Priestess",
        "gender": "f",
        "threat_level": 2,
        "portrait": "assets/img/enemy_portrait/priestess.png",
        "description": "A devoted leader to the cultists in service of the Old Ones. She wields forbidden knowledge and dark rituals to shatter the sanity of those who cross her.",
        "base_stats": {
          "hp": 14,
          "basic_attack": { "dice": 1, "sides": 12 },
          "sanity_damage": 6,
          "defense": 2,
          "init": 2,
          "effects": []
        },
        "audio": {
          "voice_hurt": "enemy_female_hurt",
          "voice_death": "enemy_female_death",
          "voice_combat_start": "enemy_female_combat_start"
        },
        "xp_reward": 20
      },
      {
        "id": "mossleech",
        "name": "Moss Leech",
        "gender": "i",
        "threat_level": 1,
        "portrait": "assets/img/enemy_portrait/moss_leech.png",
        "description": "A grotesque, slug-like creature covered in bioluminescent moss. It attaches itself to its prey, draining blood and vitality with ravenous appetite.",
        "base_stats": {
          "hp": 8,
          "basic_attack": { "dice": 1, "sides": 6 },
          "sanity_damage": 0,
          "defense": 3,
          "init": 7,
          "effects": ["bleeding", 0.25]
        },
        "audio": {
          "voice_hurt": "enemy_monster_hurt",
          "voice_death": "enemy_monster_death",
          "voice_combat_start": "enemy_monster_combat_start"
        },
        "xp_reward": 15
      },
      {
        "id": "cultist",
        "name": "Cultist",
        "gender": "f",
        "trhreat_level": 1,
        "portrait": "assets/img/enemy_portrait/cultist.png",
        "description": "A devoted cultist to the dark powers outside the dark borderlines of reality. A fanatic with more zeal than threat.",
        "base_stats": {
          "hp": 8,
          "basic_attack": { "dice": 1, "sides": 6 },
          "sanity_damage": 3,
          "defense": 0,
          "init": 2,
          "effects": []
        },
        "audio": {
          "voice_hurt": "enemy_female_hurt",
          "voice_death": "enemy_female_death",
          "voice_combat_start": "enemy_female_combat_start"
        },
        "xp_reward": 10
      },
      {
        "id": "aberrant_beast",
        "name": "Aberrant Beast",
        "gender": "o",
        "trhreat_level": 1,
        "portrait": "assets/img/enemy_portrait/aberrant_beast.png",
        "description": "There is no telling what this animal is now, or what it sees with its eyes.",
        "base_stats": {
          "hp": 12,
          "basic_attack": { "dice": 2, "sides": 4 },
          "sanity_damage": 2,
          "defense": 1,
          "init": 4,
          "effects": []
        },
        "audio": {
          "voice_hurt": "enemy_beast_hurt",
          "voice_death": "enemy_beast_death",
          "voice_combat_start": "enemy_beast_combat_start"
        },
        "xp_reward": 16
      },
      {
        "id": "rat_man",
        "name": "Rat Man",
        "gender": "o",
        "trhreat_level": 1,
        "portrait": "assets/img/enemy_portrait/rat_man.png",
        "description": "These nightmare hybrids stalk the dark crypts. Once human, they have been twisted by dark rituals into rat-like abominations.",
        "base_stats": {
          "hp": 8,
          "basic_attack": { "dice": 1, "sides": 6 },
          "sanity_damage": 0,
          "defense": 1,
          "init": 4,
          "effects": ["poisoned", 0.2]
        },
        "audio": {
          "voice_hurt": "enemy_monster_hurt",
          "voice_death": "enemy_monster_death",
          "voice_combat_start": "enemy_monster_combat_start"
        },
        "xp_reward": 10
      },
      {
        "id": "sewer_centipede",
        "name": "Sewer Centipede",
        "gender": "i",
        "trhreat_level": 1,
        "portrait": "assets/img/enemy_portrait/sewer_centipede.png",
        "description": "A mandibled horror grown to unnatural, aberrant size, its many legs scuttling with eerie speed.",
        "base_stats": {
          "hp": 12,
          "basic_attack": { "dice": 1, "sides": 10 },
          "sanity_damage": 0,
          "defense": 2,
          "init": 5,
          "effects": ["poisoned", 0.3]
        },
        "audio": {
          "voice_hurt": "enemy_insect_hurt",
          "voice_death": "enemy_insect_death",
          "voice_combat_start": "growl_combat_start"
        },
        "xp_reward": 10
      },
      {
        "id": "male_grave_robber",
        "name": "Male Grave Robber",
        "gender": "m",
        "trhreat_level": 1,
        "portrait": "assets/img/enemy_portrait/male_grave_robber.png",
        "description": "A male grave robber, skilled in stealth and desecration, prowls the crypts in search of valuable relics.",
        "base_stats": {
          "hp": 8,
          "basic_attack": { "dice": 1, "sides": 6 },
          "sanity_damage": 0,
          "defense": 2,
          "init": 3,
          "effects": []
        },
        "audio": {
          "voice_hurt": "enemy_male_hurt",
          "voice_death": "enemy_male_death",
          "voice_combat_start": "enemy_male_combat_start"
        },
        "xp_reward": 10
      },
      {
        "id": "corpse_eater",
        "name": "Corpse Eater",
        "gender": "o",
        "trhreat_level": 1,
        "portrait": "assets/img/enemy_portrait/corpse_eater.png",
        "description": "These crypts regularly fill with the dead, attracting scavengers that feast on the remains.",
        "base_stats": {
          "hp": 10,
          "basic_attack": { "dice": 1, "sides": 6 },
          "sanity_damage": 1,
          "defense": 0,
          "init": 2,
          "effects": []
        },
        "audio": {
          "voice_hurt": "enemy_male_hurt",
          "voice_death": "enemy_male_death",
          "voice_combat_start": "enemy_male_combat_start"
        },
        "xp_reward": 10
      },
      {
        "id": "female_grave_robber",
        "name": "Female Grave Robber",
        "gender": "f",
        "trhreat_level": 1,
        "portrait": "assets/img/enemy_portrait/female_grave_robber.png",
        "description": "A female grave robber, skilled in stealth and desecration, prowls the crypts in search of valuable relics.",
        "base_stats": {
          "hp": 8,
          "basic_attack": { "dice": 1, "sides": 6 },
          "sanity_damage": 0,
          "defense": 2,
          "init": 3,
          "effects": []
        },
        "audio": {
          "voice_hurt": "enemy_female_hurt",
          "voice_death": "enemy_female_death",
          "voice_combat_start": "enemy_female_combat_start"
        },
        "xp_reward": 10
      },
      {
        "id": "flesh_eating_vines",
        "name": "Flesh Eating Vines",
        "gender": "i",
        "trhreat_level": 1,
        "portrait": "assets/img/enemy_portrait/flesh_eating_vines.png",
        "description": "Apparition of writhing vines that consume flesh with a hunger that never abates.",
        "base_stats": {
          "hp": 12,
          "basic_attack": { "dice": 1, "sides": 6 },
          "sanity_damage": 1,
          "defense": 3,
          "init": 3,
          "effects": []
        },
        "audio": {
          "voice_hurt": "enemy_icnset_hurt",
          "voice_death": "enemy_insect_death",
          "voice_combat_start": "enemy_insect_combat_start"
        },
        "xp_reward": 10
      },
      {
        "id": "drowned_acolyte",
        "name": "Drowned Acolyte",
        "gender": "f",
        "trhreat_level": 2,
        "portrait": "assets/img/enemy_portrait/drowned_acolyte.png",
        "description": "Robe drips black water, lungs gurgling with each step, eyes fixed on a point behind you.",
        "base_stats": {
          "hp": 20,
          "basic_attack": { "dice": 2, "sides": 4 },
          "sanity_damage": 12,
          "defense": 4,
          "init": 5,
          "effects": []
        },
        "audio": {
          "voice_hurt": "enemy_female_hurt",
          "voice_death": "enemy_female_death",
          "voice_combat_start": "enemy_female_combat_start"
        },
        "xp_reward": 30
      },
      {
        "id": "leech_swarm",
        "name": "Leech Swarm",
        "gender": "i",
        "trhreat_level": 2,
        "portrait": "assets/img/enemy_portrait/leech_swarm.png",
        "description": "A dark, seething carpet of leeches seeking any scrap of exposed flesh or cloth seam.",
        "base_stats": {
          "hp": 35,
          "basic_attack": { "dice": 1, "sides": 12 },
          "sanity_damage": 5,
          "defense": 8,
          "init": 5,
          "effects": ["bleeding", 0.5]
        },
        "audio": {
          "voice_hurt": "enemy_insect_hurt",
          "voice_death": "enemy_insect_death",
          "voice_combat_start": "enemy_insect_combat_start"
        },
        "xp_reward": 30
      },
      {
        "id": "flesh_golem",
        "name": "Flesh Golem",
        "gender": "o",
        "threat_level": 3,
        "portrait": "assets/img/enemy_portrait/flesh_golem.png",
        "description": "A hulking construct of stitched flesh, sickening and perverse application of necromantic magic.",
        "base_stats": {
          "hp": 50,
          "basic_attack": { "dice": 3, "sides": 6 },
          "sanity_damage": 3,
          "defense": 10,
          "init": 2,
          "effects": []
        },
        "audio": {
          "voice_hurt": "enemy_beast_hurt",
          "voice_death": "enemy_beast_death",
          "voice_combat_start": "enemy_beast_combat_start"
        },
        "xp_reward": 75
      },
      {
        "id": "pit_butcher",
        "name": "Pit Butcher",
        "gender": "m",
        "trhreat_level": 3,
        "portrait": "assets/img/enemy_portrait/pit_butcher.png",
        "description": "Apron so stained it glistens black, cleaver nicked with more bone than steel.",
        "base_stats": {
          "hp": 50,
          "basic_attack": { "dice": 3, "sides": 6 },
          "sanity_damage": 0,
          "defense": 10,
          "init": 2,
          "effects": []
        },
        "audio": {
          "voice_hurt": "enemy_male_hurt",
          "voice_death": "enemy_male_death",
          "voice_combat_start": "enemy_male_combat_start"
        },
        "xp_reward": 75
      },
      {
        "id": "dream_eater",
        "name": "Dream Eater",
        "gender": "o",
        "threat_level": 3,
        "portrait": "assets/img/enemy_portrait/dream_eater.png",
        "description": "Softly padded thing that wears stolen faces over its lamprey ring of teeth.",
        "base_stats": {
          "hp": 60,
          "basic_attack": { "dice": 1, "sides": 6 },
          "sanity_damage": 15,
          "defense": 6,
          "init": 2,
          "effects": []
        },
        "audio": {
          "voice_hurt": "enemy_beast_hurt",
          "voice_death": "enemy_beast_death",
          "voice_combat_start": "enemy_beast_combat_start"
        },
        "xp_reward": 75
      },
      {
        "id": "astral_creeper",
        "name": "Astral Creeper",
        "threat_level": 4,
        "portrait": "assets/img/enemy_portrait/astral_creeper.png",
        "description": "The Malaligned Young of the Astral Summoner.",
        "base_stats": {
          "hp": 8,
          "basic_attack": { "dice": 1, "sides": 6 },
          "sanity_damage": 2,
          "defense": 0,
          "init": 5
        },
        "xp_reward": 10,
        "audio": {
          "voice_hurt": "astral_creeper_hurt",
          "voice_death": "astral_creeper_death"
        }
      },
      {
        "id": "astral_summoner",
        "name": "Astral Summoner",
        "threat_level": 4,
        "portrait": "assets/img/enemy_portrait/astral_summoner.png",
        "description": "The Astral Summoner beyond the veil of Stars, chanting a sanity-eating hymn that reshapes reality with every note.",
        "base_stats": {
          "hp": 85,
          "basic_attack": { "dice": 2, "sides": 10 },
          "sanity_damage": 10,
          "defense": 4,
          "init": 1,
          "effects": ["immune_charm", "resist_bleed", "weak_physical"]
        },
        "xp_reward": 250,
        "abilities": [
          {
            "id": "hymn_of_unbeing",
            "name": "Hymn of Unbeing",
            "type": "sanity_attack",
            "description": "The Chorister sings a mind-shattering note. Deals heavy sanity damage to all party members.",
            "sanity_damage": { "dice": 2, "sides": 8 },
            "chance": 0.45
          },
          {
            "id": "litany_of_the_spawned",
            "name": "Litany of the Spawned",
            "type": "summon",
            "description": "Rips open its own flesh to birth aberrant minions.",
            "summon_ids": ["astral_creeper"],
            "summon_count": { "min": 1, "max": 3 },
            "chance": 1
          },
          {
            "id": "erode_flesh",
            "name": "Erode Flesh",
            "type": "hp_attack",
            "description": "A tendril lashes out, rotting tissue upon contact.",
            "damage": { "dice": 1, "sides": 12 },
            "effect": {
              "type": "poison",
              "chance": 0.4,
              "duration": 3,
              "damage_per_turn": 4
            },
            "chance": 0.3
          }
        ],
        "ai_logic": {
          "summon_if_no_minions": true,
          "preferred_ability_order": [
            "litany_of_the_spawned",
            "hymn_of_unbeing",
            "erode_flesh"
          ]
        },
        "audio": {
          "voice_hurt": "astral_summoner_hurt",
          "voice_death": "astral_summoner_death",
          "voice_combat_start": "astral_summoner_arrival"
        }
      }
    ]
  };

  const inventoryFallback = [
    {
      "item_id": "vial_vital_humours",
      "name": "Vial of Vital Humours",
      "description": "A stoppered glass vial of thick, ruddy fluid that faintly warms to the touch, said to restore what the crypt slowly steals away.",
      "image": "./assets/img/item_portrait/ComfyUI_00921_.png",
      "type": "consumable",
      "usableContexts": ["combat", "exploration"],
      "targetType": "ally",
      "effects": [
        { "kind": "hp", "mode": "heal", "dice": "2d12" }
      ]
    },
    {
      "item_id": "tincture_of_lucidity",
      "name": "Tincture of Lucidity",
      "description": "An acrid, shimmering draught that briefly sharpens thought and pushes back the whispering dark.",
      "image": "./assets/img/item_portrait/ComfyUI_00922_.png",
      "type": "consumable",
      "usableContexts": ["combat", "exploration"],
      "targetType": "ally",
      "effects": [
        { "kind": "sanity", "mode": "heal", "dice": "2d12" }
      ]
    },
    {
      "item_id": "coagulant_seal_bandages",
      "name": "Coagulant Seal Bandages",
      "description": "Bandages steeped in an alchemical coagulant that hardens on contact with blood, sealing even grievous wounds.",
      "image": "./assets/img/item_portrait/ComfyUI_00923_.png",
      "type": "consumable",
      "usableContexts": ["combat", "exploration"],
      "targetType": "ally",
      "effects": [
        { "kind": "cure_status", "status": "bleeding" },
        { "kind": "hp", "mode": "heal", "dice": "1d8" }
      ]
    },
    {
      "item_id": "berserker_blood",
      "name": "Berserker Blood",
      "description": "A violent crimson tincture that tastes of iron and ash, sending the drinker into a controlled frenzy.",
      "image": "./assets/img/item_portrait/ComfyUI_00924_.png",
      "type": "consumable",
      "usableContexts": ["combat"],
      "targetType": "self",
      "effects": [
        { "kind": "buff", "stat": "attackDamage", "dice": "2d4", "duration": 3 }
      ]
    },
    {
      "item_id": "nightshade_resin",
      "name": "Nightshade Resin",
      "description": "A tar-thick, violet resin distilled from forbidden herbs, applied to blades to deliver a slow and dreadful demise.",
      "image": "./assets/img/item_portrait/ComfyUI_00925_.png",
      "type": "consumable",
      "usableContexts": ["combat", "exploration"],
      "targetType": "self",
      "effects": [
        { "kind": "weapon_coating", "coatingType": "poison", "damagePerTurn": "1d6", "duration": 3 }
      ]
    },
    {
      "item_id": "black_tar_pitch",
      "name": "Black Tar Pitch",
      "description": "A heavy, reeking pitch that clings to metal and flesh alike, eager to catch fire at the slightest spark.",
      "image": "./assets/img/item_portrait/ComfyUI_00926_.png",
      "type": "consumable",
      "usableContexts": ["combat", "exploration"],
      "targetType": "self",
      "effects": [
        { "kind": "weapon_coating", "coatingType": "fire", "damagePerTurn": "1d6", "duration": 3 }
      ]
    },
    {
      "item_id": "chillwater_vapours_phial",
      "name": "Chillwater Vapours Phial",
      "description": "A small glass phial that releases a burst of ghostly cold mist, smothering embers and searing heat.",
      "image": "./assets/img/item_portrait/ComfyUI_00927_.png",
      "type": "consumable",
      "usableContexts": ["combat", "exploration"],
      "targetType": "ally",
      "effects": [
        { "kind": "cure_status", "status": "burning" }
      ]
    },
    {
      "item_id": "purging_bitter_tincture",
      "name": "Purging Bitter Tincture",
      "description": "A foul, herbal distillate that scours the veins, driving out toxins at the cost of a moment's agony.",
      "image": "./assets/img/item_portrait/ComfyUI_00928_.png",
      "type": "consumable",
      "usableContexts": ["combat", "exploration"],
      "targetType": "ally",
      "effects": [
        { "kind": "cure_status", "status": "poisoned" }
      ]
    },
    {
      "item_id": "coagulant_seal_tonic",
      "name": "Coagulant Seal Tonic",
      "description": "A concentrated draught of clotting reagents, taken internally to arrest internal bleeding.",
      "image": "./assets/img/item_portrait/ComfyUI_00929_.png",
      "type": "consumable",
      "usableContexts": ["combat", "exploration"],
      "targetType": "ally",
      "effects": [
        { "kind": "cure_status", "status": "bleeding" }
      ]
    },
    {
      "item_id": "dreamless_incense",
      "name": "Dreamless Incense",
      "description": "A bundle of grey-blue incense sticks that burn with a cold, smokeless glow, ushering the party into mercifully dreamless rest.",
      "image": "./assets/img/item_portrait/ComfyUI_00930_.png",
      "type": "consumable",
      "usableContexts": ["exploration"],
      "targetType": "party",
      "effects": [
        { "kind": "rest" }
      ]
    },
    {
      "item_id": "sigil_of_warding",
      "name": "Sigil of Warding",
      "description": "A palm-sized talisman etched with interlocking runes that flare to life when invoked, deflecting harm for a fleeting moment.",
      "image": "./assets/img/item_portrait/ComfyUI_00931_.png",
      "type": "consumable",
      "usableContexts": ["combat"],
      "targetType": "ally",
      "effects": [
        { "kind": "barrier", "duration": 2 }
      ]
    },
    {
      "item_id": "chains_of_old",
      "name": "Chains of Old",
      "description": "A brittle parchment inscribed with ancient binding script; when torn, spectral chains lash out to fetter the unwilling.",
      "image": "./assets/img/item_portrait/ComfyUI_00932_.png",
      "type": "consumable",
      "usableContexts": ["combat"],
      "targetType": "enemy",
      "effects": [
        { "kind": "immobilize", "duration": 2 }
      ]
    },
    {
      "item_id": "eldritch_discord",
      "name": "Eldritch Discord",
      "description": "A whispered incantation in a language never meant for mortal tongues, turning ordered thought into murderous chaos.",
      "image": "./assets/img/item_portrait/ComfyUI_00933_.png",
      "type": "consumable",
      "usableContexts": ["combat"],
      "targetType": "enemy",
      "effects": [
        { "kind": "confusion", "duration": 2 }
      ]
    },
    {
      "item_id": "herbal_tonic",
      "name": "Herbal Tonic",
      "description": "A simple herbal brew that soothes minor aches and restores a bit of vigor.",
      "image": "./assets/img/item_portrait/ComfyUI_00934_.png",
      "type": "consumable",
      "usableContexts": ["combat", "exploration"],
      "targetType": "ally",
      "effects": [
        { "kind": "hp", "mode": "heal", "dice": "1d6+2" }
      ]
    },
    {
      "item_id": "scroll_spirit_guardian",
      "name": "Scroll of Spirit Guardian",
      "description": "An ancient parchment inscribed with binding runes. When read aloud, it calls forth a spectral guardian to fight alongside you.",
      "image": "./assets/img/ally_portrait/spirit_guardian.png",
      "type": "consumable",
      "usableContexts": ["combat"],
      "targetType": "self",
      "effects": [
        { "kind": "summon", "summonId": "spirit_guardian" }
      ]
    },
    {
      "item_id": "scroll_shadow_familiar",
      "name": "Scroll of Shadow Familiar",
      "description": "A dark scroll that writhes with living shadows. Speaking its words unleashes a swift and deadly familiar.",
      "image": "./assets/img/ally_portrait/shadow_familiar.png",
      "type": "consumable",
      "usableContexts": ["combat"],
      "targetType": "self",
      "effects": [
        { "kind": "summon", "summonId": "shadow_familiar" }
      ]
    },
    {
      "item_id": "scroll_healing_wisp",
      "name": "Scroll of Healing Wisp",
      "description": "A luminous scroll that glows with gentle warmth. Its incantation summons a healing wisp to tend to your wounds.",
      "image": "./assets/img/ally_portrait/healing_wisp.png",
      "type": "consumable",
      "usableContexts": ["combat"],
      "targetType": "self",
      "effects": [
        { "kind": "summon", "summonId": "healing_wisp" }
      ]
    }
  ];

  const abilitiesFallback = {
    "abilities": [
      {
        "id": "stun_attack",
        "name": "Stunning Blow",
        "category": "offense",
        "usable_in": ["combat"],
        "action_cost": 1,
        "base_effects": [
          { "type": "damage", "damage_type": "physical", "target_scope": "enemy", "magnitude": "1d8", "chance": 1 },
          { "type": "status", "status_id": "stun", "target_scope": "enemy", "duration_turns": 1, "magnitude": "0", "chance": 0.55 }
        ],
        "level_rules": [
          { "min_level": 1, "target_override": "enemy", "chance_delta": 0, "magnitude_delta": "+0" },
          { "min_level": 2, "target_override": "enemy", "chance_delta": 0.1, "magnitude_delta": "+1d4" },
          { "min_level": 3, "target_override": "enemy_team", "chance_delta": 0.15, "magnitude_delta": "+1d4" }
        ]
      },
      {
        "id": "poison_blast",
        "name": "Poison Blast",
        "category": "offense",
        "usable_in": ["combat"],
        "action_cost": 1,
        "base_effects": [
          { "type": "status", "status_id": "poison", "target_scope": "enemy", "duration_turns": 3, "magnitude": "1d4", "chance": 0.65 }
        ],
        "level_rules": [
          { "min_level": 1, "target_override": "enemy", "chance_delta": 0, "magnitude_delta": "+0" },
          { "min_level": 2, "target_override": "enemy", "chance_delta": 0.1, "magnitude_delta": "+1d2" },
          { "min_level": 3, "target_override": "enemy_team", "chance_delta": 0.1, "magnitude_delta": "+1d4" }
        ]
      },
      {
        "id": "fire_blast",
        "name": "Fire Blast",
        "category": "offense",
        "usable_in": ["combat"],
        "action_cost": 1,
        "base_effects": [
          { "type": "status", "status_id": "fire", "target_scope": "enemy", "duration_turns": 2, "magnitude": "1d6", "chance": 0.65 }
        ],
        "level_rules": [
          { "min_level": 1, "target_override": "enemy", "chance_delta": 0, "magnitude_delta": "+0" },
          { "min_level": 2, "target_override": "enemy", "chance_delta": 0.1, "magnitude_delta": "+1d4" },
          { "min_level": 3, "target_override": "enemy_team", "chance_delta": 0.1, "magnitude_delta": "+1d4" }
        ]
      },
      {
        "id": "bleeding_strike",
        "name": "Rending Slash",
        "category": "offense",
        "usable_in": ["combat"],
        "action_cost": 1,
        "base_effects": [
          { "type": "damage", "damage_type": "physical", "target_scope": "enemy", "magnitude": "1d10", "chance": 1 },
          { "type": "status", "status_id": "bleeding", "target_scope": "enemy", "duration_turns": 2, "magnitude": "1d8", "chance": 0.65 }
        ],
        "level_rules": [
          { "min_level": 1, "target_override": "enemy", "chance_delta": 0, "magnitude_delta": "+0" },
          { "min_level": 2, "target_override": "enemy", "chance_delta": 0.1, "magnitude_delta": "+1d4" },
          { "min_level": 3, "target_override": "enemy_team", "chance_delta": 0.1, "magnitude_delta": "+1d4" }
        ]
      },
      {
        "id": "hypnotise",
        "name": "Hypnotise",
        "category": "offense",
        "usable_in": ["combat"],
        "action_cost": 1,
        "base_effects": [
          { "type": "status", "status_id": "charmed", "target_scope": "enemy", "duration_turns": 2, "magnitude": "0", "chance": 0.5 }
        ],
        "level_rules": [
          { "min_level": 1, "target_override": "enemy", "chance_delta": 0, "magnitude_delta": "+0" },
          { "min_level": 2, "target_override": "enemy", "chance_delta": 0.15, "magnitude_delta": "+0" },
          { "min_level": 3, "target_override": "enemy_team", "chance_delta": 0.15, "magnitude_delta": "+0" }
        ]
      },
      {
        "id": "counter_attack",
        "name": "Counter",
        "category": "reaction",
        "usable_in": ["combat"],
        "action_cost": 0,
        "trigger": { "event": "on_hit", "once_per_round": true },
        "base_effects": [
          { "type": "damage", "damage_type": "physical", "target_scope": "last_attacker", "magnitude": "weapon_damage", "chance": 0.5 }
        ],
        "level_rules": [
          { "min_level": 1, "chance_delta": 0, "magnitude_delta": "+0" },
          { "min_level": 2, "chance_delta": 0.15, "magnitude_delta": "+1d4" },
          { "min_level": 3, "chance_delta": 0.2, "magnitude_delta": "+1d6" }
        ]
      },
      {
        "id": "parry",
        "name": "Parry",
        "category": "reaction",
        "usable_in": ["combat"],
        "action_cost": 0,
        "trigger": { "event": "on_hit_attempt", "once_per_round": true },
        "base_effects": [
          { "type": "meta", "meta_action": "nullify_incoming_damage", "target_scope": "self", "magnitude": "0", "chance": 0.5 },
          { "type": "status", "status_id": "stun", "target_scope": "last_attacker", "duration_turns": 1, "magnitude": "0", "chance": 0.5 }
        ],
        "level_rules": [
          { "min_level": 1, "chance_delta": 0, "magnitude_delta": "+0" },
          { "min_level": 2, "chance_delta": 0.15, "magnitude_delta": "+0" },
          { "min_level": 3, "chance_delta": 0.2, "magnitude_delta": "+0" }
        ]
      },
      {
        "id": "heal",
        "name": "Mending Light",
        "category": "support",
        "usable_in": ["combat", "exploration"],
        "action_cost": 1,
        "base_effects": [
          { "type": "heal", "resource": "hp", "target_scope": "ally", "magnitude": "1d21", "chance": 0.95 }
        ],
        "level_rules": [
          { "min_level": 1, "target_override": "ally", "chance_delta": 0, "magnitude_delta": "+0" },
          { "min_level": 2, "target_override": "ally", "chance_delta": 0, "magnitude_delta": "+1d10" },
          { "min_level": 3, "target_override": "ally_team", "chance_delta": 0, "magnitude_delta": "+1d10" }
        ]
      },
      {
        "id": "calm",
        "name": "Calming Words",
        "category": "support",
        "usable_in": ["combat", "exploration"],
        "action_cost": 1,
        "base_effects": [
          { "type": "heal", "resource": "sanity", "target_scope": "ally", "magnitude": "1d21", "chance": 0.85 }
        ],
        "level_rules": [
          { "min_level": 1, "target_override": "ally", "chance_delta": 0, "magnitude_delta": "+0" },
          { "min_level": 2, "target_override": "ally", "chance_delta": 0.05, "magnitude_delta": "+1d10" },
          { "min_level": 3, "target_override": "ally_team", "chance_delta": 0.05, "magnitude_delta": "+1d10" }
        ]
      },
      {
        "id": "inspire",
        "name": "Inspire",
        "category": "support",
        "usable_in": ["combat"],
        "action_cost": 1,
        "base_effects": [
          { "type": "buff", "status_id": "attack_up", "target_scope": "ally", "duration_turns": 3, "magnitude": "+1d6", "chance": 0.75 }
        ],
        "level_rules": [
          { "min_level": 1, "target_override": "ally", "chance_delta": 0, "magnitude_delta": "+0" },
          { "min_level": 2, "target_override": "ally", "chance_delta": 0.1, "magnitude_delta": "+1d4" },
          { "min_level": 3, "target_override": "ally_team", "chance_delta": 0.1, "magnitude_delta": "+1d4" }
        ]
      }
    ]
  };

  const statusEffectsFallback = {
    "status_effects": [
      { "id": "stun", "name": "Stunned", "description": "Skips next turn and moves to the back of the turn queue.", "tags": ["no_action", "move_to_back"], "stackable": false },
      { "id": "poison", "name": "Poisoned", "description": "Takes poison damage at the start of each turn.", "damage_type": "poison", "stackable": false },
      { "id": "fire", "name": "Burning", "description": "Takes fire damage at the start of each turn.", "damage_type": "fire", "stackable": false },
      { "id": "bleeding", "name": "Bleeding", "description": "Loses HP at the start of each turn.", "damage_type": "physical", "stackable": true, "max_stacks": 3 },
      { "id": "charmed", "name": "Hypnotised", "description": "Acts against allies or self for the duration.", "tags": ["ai_override", "attack_allies"], "stackable": false },
      { "id": "attack_up", "name": "Inspired", "description": "Attack damage is increased.", "buff_type": "attack", "stackable": false },
      { "id": "defense_up", "name": "Protected", "description": "Defense is increased, reducing incoming damage.", "buff_type": "defense", "stackable": false },
      { "id": "sanity_regen", "name": "Calm", "description": "Restores sanity at the start of each turn.", "resource": "sanity", "stackable": false }
    ]
  };

  const summonsFallback = {
    "summons": [
      {
        "id": "spirit_guardian",
        "name": "Spirit Guardian",
        "class": "Summon",
        "base_stats": {
          "hp": 20,
          "sanity": 10,
          "basic_attack": { "dice": 1, "sides": 6 },
          "support_power": 6,
          "defense": 0,
          "init": 5
        },
        "portrait": "assets/img/ally_portrait/spirit_guardian.png",
        "audio": {
          "voice_hurt": "cryptonaut_monster_hurt_sounds",
          "voice_death": "cryptonaut_monster_death_sounds",
          "voice_combat_start": "cryptonaut_monster_combat_start_sounds"
        },
        "duration": 3,
        "ai_behavior": "attack_weakest",
        "description": "A spectral ally summoned to aid you in battle."
      },
      {
        "id": "shadow_familiar",
        "name": "Shadow Familiar",
        "class": "Summon",
        "base_stats": {
          "hp": 15,
          "sanity": 5,
          "basic_attack": { "dice": 2, "sides": 4 },
          "support_power": 4,
          "defense": 1,
          "init": 7
        },
        "portrait": "assets/img/ally_portrait/shadow_familiar.png",
        "audio": {
          "voice_hurt": "cryptonaut_monster_hurt_sounds",
          "voice_death": "cryptonaut_monster_death_sounds",
          "voice_combat_start": "cryptonaut_monster_combat_start_sounds"
        },
        "duration": 2,
        "ai_behavior": "attack_strongest",
        "description": "A swift shadow creature that strikes hard but fades quickly."
      },
      {
        "id": "healing_wisp",
        "name": "Healing Wisp",
        "class": "Summon",
        "base_stats": {
          "hp": 10,
          "sanity": 15,
          "basic_attack": { "dice": 1, "sides": 4 },
          "support_power": 10,
          "defense": 0,
          "init": 4
        },
        "portrait": "assets/img/ally_portrait/healing_wisp.png",
        "audio": {
          "voice_hurt": "cryptonaut_monster_hurt_sounds",
          "voice_death": "cryptonaut_monster_death_sounds",
          "voice_combat_start": "cryptonaut_monster_combat_start_sounds"
        },
        "duration": 4,
        "ai_behavior": "support_heal",
        "description": "A gentle spirit focused on healing wounded allies."
      }
    ]
  };

  const gameStateFallback = {
    "save_slot": "default",
    "meta": {
      "label": "Demo Slot",
      "last_updated": "2025-12-12T00:00:00Z",
      "notes": "Initial party with shared monk archetype"
    },
    "party": [
      {
        "slot": "player",
        "name": "Cryptonaut",
        "gender": "m",
        "character_file": "characters.json",
        "character_id": "monk",
        "level": 0,
        "xp": 0,
        "xpToNextLevel": 50,
        "hp": 30,
        "sanity": 20,
        "inventory": ["herbal_tonic"]
      },
      {
        "slot": "companion",
        "name": "Lydia",
        "gender": "f",
        "character_file": "characters.json",
        "character_id": "monk",
        "level": 0,
        "xp": 0,
        "xpToNextLevel": 50,
        "hp": 30,
        "sanity": 20,
        "inventory": ["herbal_tonic"]
      }
    ],
    "inventory": {
      "vial_vital_humours": 2,
      "tincture_of_lucidity": 1,
      "herbal_tonic": 3
    },
    "encounter": {
      "encounter_id": "astral_sanctum",
      "encounter_name": "The Astral Summoner's Sanctum",
      "background": "./assets/img/environment/ComfyUI_00901_.png",
      "enemies": [
        { "id": "astral_summoner", "position": 1 }
      ],
      "loot": {
        "gold": 250,
        "items": ["healing_potion", "sanity_tonic", "elixir_of_fortitude"]
      }
    }
  };

  const existing = root.__CRYPTONAUTS_FALLBACKS__ || {};
  root.__CRYPTONAUTS_FALLBACKS__ = {
    ...existing,
    characters: existing.characters || charactersFallback,
    rooms: existing.rooms || roomsFallback,
    enemies: existing.enemies || enemiesFallback,
    inventory: existing.inventory || inventoryFallback,
    abilities: existing.abilities || abilitiesFallback,
    statusEffects: existing.statusEffects || statusEffectsFallback,
    summons: existing.summons || summonsFallback,
    gameState: existing.gameState || gameStateFallback
  };
})();
