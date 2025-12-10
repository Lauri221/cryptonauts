// ========================
// Global Game State Variables
// ========================

// ========================
// Insanity Mechanics - Sanity State System
// ========================
const SANITY_STATES = {
  STABLE: 'stable',    // > 50% sanity
  SHAKEN: 'shaken',    // 25-50% sanity
  BROKEN: 'broken'     // 0-25% sanity (full insanity effects)
};

let currentSanityState = SANITY_STATES.STABLE;

// Glyphs for text scrambling during insanity
const INSANITY_GLYPHS = ['̷', '̸', '̵', '҉', '҈', '̢', '̛', '̡', '̣', '̤', '̥', '̦', '∴', '∵', '⁂', '☠', '◉', '▲'];

// Phantom log messages that appear during insanity
const PHANTOM_LOG_ENTRIES = [
  "The shadows whisper your name...",
  "Do you hear them too?",
  "THEY ARE WATCHING",
  "The walls breathe",
  "Run. RUN. R̷U̸N̵",
  "Behind you.",
  "It was never real",
  "Your reflection blinks",
  "The void answers",
  "S̷o̸m̵e̴t̷h̵i̸n̷g̴ ̶i̵s̷ ̵w̶r̸o̷n̶g̵",
  "Don't trust them",
  "You've been here before",
  "TIME IS A CIRCLE",
  "Wake up. WAKE UP.",
  "The static grows louder"
];

/**
 * Updates the sanity state based on current player sanity.
 * Triggers UI effects when state changes.
 */
function updateSanityState() {
  if (!player || player.maxSanity === 0) return;
  
  const sanityPercent = player.sanity / player.maxSanity;
  let newState;
  
  if (sanityPercent > 0.5) {
    newState = SANITY_STATES.STABLE;
  } else if (sanityPercent > 0.25) {
    newState = SANITY_STATES.SHAKEN;
  } else {
    newState = SANITY_STATES.BROKEN;
  }
  
  if (newState !== currentSanityState) {
    currentSanityState = newState;
    applySanityStateEffects();
    console.log(`[Insanity] Sanity state changed to: ${currentSanityState}`);
  }
}

/**
 * Applies visual and UI effects based on current sanity state.
 */
function applySanityStateEffects() {
  const combatScreen = document.getElementById('combat-screen');
  if (!combatScreen) return;
  
  // Set data attribute for CSS effects
  combatScreen.dataset.sanityState = currentSanityState;
  
  // Clear any existing jitter intervals
  if (window.insanityJitterInterval) {
    clearInterval(window.insanityJitterInterval);
    window.insanityJitterInterval = null;
  }
  
  // Apply state-specific effects
  if (currentSanityState === SANITY_STATES.BROKEN) {
    startInsanityEffects();
  } else if (currentSanityState === SANITY_STATES.SHAKEN) {
    // Mild effects for shaken state
    maybeAddPhantomLog(0.15);
  }
}

/**
 * Starts intensive insanity effects when in BROKEN state.
 */
function startInsanityEffects() {
  // Continuous button jitter
  window.insanityJitterInterval = setInterval(() => {
    if (currentSanityState === SANITY_STATES.BROKEN) {
      jitterActionButtons();
    }
  }, 800);
  
  // Initial phantom log
  maybeAddPhantomLog(0.4);
}

/**
 * Scrambles a string with zalgo-style glyphs for insanity effect.
 * @param {string} text - Original text to scramble
 * @param {number} intensity - 0-1, how much to scramble (default based on sanity state)
 */
function scrambleString(text, intensity = null) {
  if (currentSanityState === SANITY_STATES.STABLE) return text;
  
  // Determine intensity based on sanity state if not provided
  if (intensity === null) {
    intensity = currentSanityState === SANITY_STATES.BROKEN ? 0.4 : 0.15;
  }
  
  return text.split('').map(char => {
    if (char === ' ' || Math.random() > intensity) return char;
    const glyph = INSANITY_GLYPHS[Math.floor(Math.random() * INSANITY_GLYPHS.length)];
    return char + glyph;
  }).join('');
}

/**
 * Renders text with insanity effects applied.
 * @param {string} text - Text to render
 * @param {boolean} forceScramble - Force scrambling regardless of state
 */
function renderInsanityText(text, forceScramble = false) {
  if (forceScramble || currentSanityState !== SANITY_STATES.STABLE) {
    return scrambleString(text);
  }
  return text;
}

/**
 * Shuffles the order of action buttons.
 */
function shuffleActionButtons() {
  if (currentSanityState !== SANITY_STATES.BROKEN) return;
  
  const actionsContainer = document.getElementById('actions');
  if (!actionsContainer) return;
  
  const buttons = Array.from(actionsContainer.querySelectorAll('button'));
  if (buttons.length < 2) return;
  
  // Fisher-Yates shuffle
  for (let i = buttons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    actionsContainer.insertBefore(buttons[j], buttons[i]);
  }
}

/**
 * Applies random position jitter to action buttons.
 */
function jitterActionButtons() {
  if (currentSanityState === SANITY_STATES.STABLE) return;
  
  const actionsContainer = document.getElementById('actions');
  if (!actionsContainer) return;
  
  const buttons = actionsContainer.querySelectorAll('button');
  const maxJitter = currentSanityState === SANITY_STATES.BROKEN ? 8 : 3;
  
  buttons.forEach(btn => {
    const x = (Math.random() - 0.5) * maxJitter * 2;
    const y = (Math.random() - 0.5) * maxJitter * 2;
    const rotate = (Math.random() - 0.5) * (maxJitter / 2);
    btn.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg)`;
  });
}

/**
 * Resets button positions (called when sanity stabilizes).
 */
function resetButtonPositions() {
  const actionsContainer = document.getElementById('actions');
  if (!actionsContainer) return;
  
  const buttons = actionsContainer.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.style.transform = '';
  });
}

/**
 * Maybe adds a phantom log entry based on probability.
 * @param {number} probability - 0-1 chance of adding a phantom log
 */
function maybeAddPhantomLog(probability = 0.2) {
  if (Math.random() > probability) return;
  
  const message = PHANTOM_LOG_ENTRIES[Math.floor(Math.random() * PHANTOM_LOG_ENTRIES.length)];
  addPhantomLogEntry(message);
}

/**
 * Adds a phantom (hallucination) entry to the combat log.
 * @param {string} message - The phantom message to display
 */
function addPhantomLogEntry(message) {
  const combatLog = document.getElementById('combat-log');
  if (!combatLog) return;
  
  const entry = document.createElement('div');
  entry.className = 'phantom-log-entry';
  entry.style.color = '#8b008b';
  entry.style.fontStyle = 'italic';
  entry.style.opacity = '0.85';
  entry.style.textShadow = '0 0 5px #ff00ff';
  entry.textContent = scrambleString(message, 0.25);
  
  combatLog.appendChild(entry);
  combatLog.scrollTop = combatLog.scrollHeight;
  
  // Fade out after a moment (hallucinations are fleeting)
  setTimeout(() => {
    entry.style.transition = 'opacity 2s';
    entry.style.opacity = '0.3';
  }, 3000);
}

// Holds player's information (HP, sanity, name, etc.)
let player = {};

// Holds companion's information (HP, sanity, ability, etc.)
let companion = {};

// Array of summoned friendly NPCs (AI-controlled)
let summonedNPCs = [];

// Tracks which character the player is currently controlling ('player' or 'companion')
let activeControlledCharacter = 'player';

// Tracks pending action awaiting target selection
let pendingAction = null;
let targetSelectionMode = false;

// Array of all enemies in the current encounter
let enemies = [];

// Array of all combatants (player, companion, enemies) sorted by initiative
let combatants = [];

// Keeps track of which combatant's turn it is (index in 'combatants')
let currentTurn = 0;

// Tracks the overall game state (optional, only used if saving/loading multi data)
let gameState = {};

function cloneData(data) {
  if (data == null) return null;
  if (typeof structuredClone === 'function') {
    return structuredClone(data);
  }
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to deep-clone data:', err);
    return data;
  }
}

const initialGameStateFromFile = (typeof window !== 'undefined' && window.initialGameState)
  ? window.initialGameState
  : null;
if (initialGameStateFromFile) {
  const clonedState = cloneData(initialGameStateFromFile);
  if (clonedState) {
    gameState = clonedState;
  }
}

// Flag to indicate whether the combat is over (victory or loss)
let combatEnded = false;

// Default action set in case a character JSON omits custom moves
const DEFAULT_ACTIONS = ['attack', 'defend', 'element', 'item'];

const DEATH_CARD_IMAGE = 'assets/img/death.png';

// Tracks whether the player has already clicked to begin combat/audio
let combatInitialized = false;

// Catalog of all available inventory items loaded from inventory.json
let inventoryCatalog = {};

// Tracks whether the item selection panel is currently visible
let itemSelectionOpen = false;

// Cache for loaded character specification files so we only fetch them once per session
const characterSpecCache = {};

async function getCharacterSpec(characterFile, characterId) {
  if (!characterFile) {
    throw new Error('Missing character_file in party configuration');
  }

  if (!characterSpecCache[characterFile]) {
    const response = await fetch(characterFile);
    if (!response.ok) {
      throw new Error(`Unable to load character data from ${characterFile}`);
    }
    characterSpecCache[characterFile] = await response.json();
  }

  const specFile = characterSpecCache[characterFile];
  let spec = specFile.characters?.find(c => c.id === characterId);

  if (!spec && Array.isArray(specFile.companions)) {
    spec = specFile.companions.find(c => c.id === characterId);
  }

  if (!spec) {
    throw new Error(`Character id "${characterId}" not found inside ${characterFile}`);
  }

  return spec;
}

function resolvePortraitPath(portraitId) {
  if (!portraitId) {
    return null;
  }

  // If the portrait already points to a file path (contains slash or extension) use it as-is
  if (portraitId.includes('/') || portraitId.includes('.')) {
    return portraitId;
  }

  return `assets/img/ally_portrait/${portraitId}.png`;
}

function normalizeInventoryCatalog(rawInventory) {
  if (!rawInventory) return {};

  // Handle new canonical array format from inventory.json
  if (Array.isArray(rawInventory)) {
    return rawInventory.reduce((map, item) => {
      const key = item?.item_id || item?.id;
      if (key) {
        map[key] = item;
      }
      return map;
    }, {});
  }

  // Handle legacy object with `items` array
  if (Array.isArray(rawInventory.items)) {
    return rawInventory.items.reduce((map, item) => {
      const key = item?.item_id || item?.id;
      if (key) {
        map[key] = item;
      }
      return map;
    }, {});
  }

  // Already keyed object, return as-is for backward compatibility
  return rawInventory;
}

function buildInventoryFromIds(idList = []) {
  if (!Array.isArray(idList) || idList.length === 0) return [];
  return idList
    .map(id => {
      const def = inventoryCatalog[id];
      if (!def) {
        console.warn(`Inventory definition not found for id: ${id}`);
        return null;
      }
      return {
        ...def,
        id,
        quantity: def.quantity ?? 1
      };
    })
    .filter(Boolean);
}

function buildCharacterActions(baseStats = {}) {
  const ability1 = baseStats.ability1 || null;
  const ability2 = baseStats.ability2 || null;
  return [
    {
      id: 'attack',
      label: 'Attack',
      description: 'Perform a basic attack based on your weapon training.'
    },
    {
      id: 'ability1',
      label: ability1?.name || 'Ability 1',
      description: ability1?.description || 'Class ability slot one.'
    },
    {
      id: 'ability2',
      label: ability2?.name || 'Ability 2',
      description: ability2?.description || 'Class ability slot two.'
    },
    {
      id: 'item',
      label: 'Use Item',
      description: 'Use an item from your inventory.'
    }
  ];
}

async function hydratePartyMember(rawConfig = {}) {
  // If no character reference is provided, fall back to whatever is already defined
  if (!rawConfig.character_file || !rawConfig.character_id) {
    return {
      ...rawConfig,
      maxHp: rawConfig.maxHp || rawConfig.hp || 0,
      maxSanity: rawConfig.maxSanity || rawConfig.sanity || 0,
      level: rawConfig.level ?? 0,
      xp: rawConfig.xp ?? 0,
      xpToNextLevel: rawConfig.xpToNextLevel ?? 50
    };
  }

  const spec = await getCharacterSpec(rawConfig.character_file, rawConfig.character_id);
  const baseStats = spec.base_stats || {};
  const genderKey = rawConfig.gender || spec.gender || 'm';
  const genderVariants = spec.gender_variants || {};
  const genderData = genderVariants[genderKey] || Object.values(genderVariants)[0] || {};

  const portrait =
    resolvePortraitPath(genderData.portrait) ||
    resolvePortraitPath(spec.portrait) ||
    resolvePortraitPath(rawConfig.portrait) ||
    spec.portrait ||
    rawConfig.portrait ||
    null;
  const inventoryIds = rawConfig.inventory || spec.starting_inventory || [];
  const inventory = buildInventoryFromIds(inventoryIds);
  const actions = buildCharacterActions(baseStats);

  const audioProfile = genderData.audio
    ? { ...genderData.audio }
    : spec.audio
      ? { ...spec.audio }
      : rawConfig.audioProfile
        ? { ...rawConfig.audioProfile }
        : null;

  // Level and XP - start at level 0 with 0 XP, 50 XP to reach level 1
  const level = rawConfig.level ?? 0;
  const xp = rawConfig.xp ?? 0;
  const xpToNextLevel = rawConfig.xpToNextLevel ?? calculateXpToNextLevel(level);

  // Calculate scaled stats based on level (+15% cumulative per level)
  const baseHp = baseStats.hp ?? rawConfig.hp ?? 0;
  const baseSanity = baseStats.sanity ?? rawConfig.sanity ?? 0;
  const hpMultiplier = 1 + (0.15 * level);
  const sanityMultiplier = 1 + (0.15 * level);
  const scaledHp = Math.floor(baseHp * hpMultiplier);
  const scaledSanity = Math.floor(baseSanity * sanityMultiplier);

  const hydrated = {
    ...rawConfig,
    character_id: spec.id,
    class: spec.class,
    base_stats: baseStats,
    level,
    xp,
    xpToNextLevel,
    hp: scaledHp,
    maxHp: scaledHp,
    sanity: scaledSanity,
    maxSanity: scaledSanity,
    defense: baseStats.defense ?? rawConfig.defense ?? 0,
    speed: baseStats.speed ?? rawConfig.speed ?? 0,
    basic_attack: baseStats.basic_attack ?? rawConfig.basic_attack,
    resistance: baseStats.resistance ?? rawConfig.resistance,
    weakness: baseStats.weakness ?? rawConfig.weakness,
    ability1: baseStats.ability1 || null,
    ability2: baseStats.ability2 || null,
    inventory,
    actions,
    portrait,
    audioProfile
  };

  return hydrated;
}

/**
 * Calculate XP required to reach the next level.
 * Base: 50 XP for level 1, then 1.2x multiplier each level.
 * Max level is 10.
 */
function calculateXpToNextLevel(currentLevel) {
  if (currentLevel >= 10) return Infinity; // Max level reached
  const baseXp = 50;
  return Math.floor(baseXp * Math.pow(1.2, currentLevel));
}

/**
 * Award XP to a character and check for level up.
 * Returns true if character leveled up.
 */
function awardXp(character, amount) {
  if (!character || character.level >= 10) return false;
  
  character.xp = (character.xp || 0) + amount;
  
  let leveledUp = false;
  while (character.xp >= character.xpToNextLevel && character.level < 10) {
    leveledUp = true;
    character.xp -= character.xpToNextLevel;
    character.level++;
    
    // Apply level-up bonuses
    applyLevelUpBonuses(character);
    
    // Calculate new XP threshold
    character.xpToNextLevel = calculateXpToNextLevel(character.level);
    
    // Log and play effects
    log(`🎉 ${character.name} reached Level ${character.level}!`);
    playLevelUpSound();
    flashLevelUp(character);
  }
  
  return leveledUp;
}

/**
 * Apply stat bonuses when leveling up.
 * +15% HP and Sanity (cumulative from base), +2 attack power per level.
 */
function applyLevelUpBonuses(character) {
  const baseStats = character.base_stats || {};
  const baseHp = baseStats.hp || 30;
  const baseSanity = baseStats.sanity || 20;
  
  // Calculate new max stats (+15% cumulative per level)
  const hpMultiplier = 1 + (0.15 * character.level);
  const sanityMultiplier = 1 + (0.15 * character.level);
  const newMaxHp = Math.floor(baseHp * hpMultiplier);
  const newMaxSanity = Math.floor(baseSanity * sanityMultiplier);
  
  // Increase current HP/Sanity by the difference (heal on level up)
  const hpGain = newMaxHp - character.maxHp;
  const sanityGain = newMaxSanity - character.maxSanity;
  
  character.maxHp = newMaxHp;
  character.maxSanity = newMaxSanity;
  character.hp = Math.min(character.hp + hpGain, newMaxHp);
  character.sanity = Math.min(character.sanity + sanityGain, newMaxSanity);
  
  log(`  ➤ Max HP: ${newMaxHp} (+${hpGain}), Max Sanity: ${newMaxSanity} (+${sanityGain})`);
}

/**
 * Calculate scaled basic attack damage based on level.
 * +2 per level, extra die at levels 3 and 6.
 */
function getScaledBasicAttack(character) {
  const baseAttack = character.basic_attack || character.base_stats?.basic_attack;
  if (!baseAttack) return Math.floor(Math.random() * 6) + 4;
  
  const level = character.level || 0;
  let dice = baseAttack.dice || 2;
  const sides = baseAttack.sides || 4;
  
  // Add extra die at levels 3 and 6
  if (level >= 3) dice++;
  if (level >= 6) dice++;
  
  // Roll the dice
  let total = 0;
  for (let i = 0; i < dice; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  
  // Add +2 per level
  total += level * 2;
  
  return total;
}

/**
 * Apply defense to incoming damage and subtract from target HP.
 * Only reduces damage for 'physical' damage type (or when damageType omitted).
 * Returns the final damage applied (>= 0).
 */
function applyDamageToTarget(target, rawDamage, damageType = 'physical') {
  if (!target || typeof rawDamage !== 'number') return 0;

  const def = Number(target.defense || 0) || 0;
  // Only apply defense to physical damage
  let final = rawDamage;
  if (!damageType || damageType === 'physical') {
    final = Math.max(0, rawDamage - Math.floor(def));
  }

  target.hp -= final;
  return final;
}

/**
 * Get the ability magnitude bonus based on character level.
 * +1 per level cumulative.
 */
function getAbilityLevelBonus(character) {
  return character.level || 0;
}

/**
 * Flash the character card white on level up.
 */
function flashLevelUp(character) {
  let elementId = null;
  if (character === player) {
    elementId = 'player-portrait';
  } else if (character === companion) {
    elementId = 'ally-portrait';
  }
  
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('level-up-flash');
      setTimeout(() => element.classList.remove('level-up-flash'), 1000);
    }
  }
}

/**
 * Play level up sound effect.
 */
function playLevelUpSound() {
  if (levelUpSound) {
    levelUpSound.currentTime = 0;
    levelUpSound.play().catch(err => console.log('Level up sound error:', err));
  }
}

// Audio for victory jingle; loaded from relative path
let victorySound = new Audio('./music/victory_music.mp3');

// Level up sound effect
let levelUpSound = new Audio('./sound/level_up.mp3');

// Looping combat underscore
let combatMusic = new Audio('./music/combat.mp3');
combatMusic.loop = true;

// Defeat music for party loss
let defeatMusic = new Audio('./music/defeat_music.mp3');
defeatMusic.loop = false;

//adding sound effects for combat
// Using sword sounds for attack (randomly pick one)
let attackSounds = [
  new Audio('./sound/sword_01.mp3'),
  new Audio('./sound/sword_02.mp3'),
  new Audio('./sound/sword_03.mp3'),
  new Audio('./sound/sword_04.mp3')
];
let defendSound = new Audio('./sound/shield.mp3');
let potion_sound = new Audio('./sound/potion.mp3');
let summon_sound = new Audio('./sound/summon.mp3');

// Enemy death sound effects
let enemy_death_male_sound = [
  new Audio('./sound/enemy_male_death_01.mp3'),
  new Audio('./sound/enemy_male_death_02.mp3'),
  new Audio('./sound/enemy_male_death_03.mp3'),
  new Audio('./sound/enemy_male_death_04.mp3'),
  new Audio('./sound/enemy_male_death_05.mp3')
];

let enemy_death_female_sound = [
  new Audio('./sound/enemy_female_death_01.mp3'),
  new Audio('./sound/enemy_female_death_02.mp3'),
  new Audio('./sound/enemy_female_death_03.mp3'),
  new Audio('./sound/enemy_female_death_04.mp3')
];

let enemy_death_monster_sound = [
  new Audio('./sound/enemy_monster_death_01.mp3'),
  new Audio('./sound/enemy_monster_death_02.mp3')
];

// Enemy hurt sound effects
let enemy_hurt_male_sound = [
  new Audio('./sound/enemy_male_hurt_01.mp3'),
  new Audio('./sound/enemy_male_hurt_02.mp3'),
  new Audio('./sound/enemy_male_hurt_03.mp3'),
  new Audio('./sound/enemy_male_hurt_04.mp3'),
  new Audio('./sound/enemy_male_hurt_05.mp3'),
  new Audio('./sound/enemy_male_hurt_06.mp3'),
  new Audio('./sound/enemy_male_hurt_07.mp3'),
  new Audio('./sound/enemy_male_hurt_08.mp3')
];

let enemy_hurt_female_sound = [
  new Audio('./sound/enemy_female_hurt_01.mp3'),
  new Audio('./sound/enemy_female_hurt_02.mp3'),
  new Audio('./sound/enemy_female_hurt_03.mp3'),
  new Audio('./sound/enemy_female_hurt_04.mp3'),
  new Audio('./sound/enemy_female_hurt_05.mp3'),
  new Audio('./sound/enemy_female_hurt_06.mp3'),
  new Audio('./sound/enemy_female_hurt_07.mp3'),
  new Audio('./sound/enemy_female_hurt_08.mp3'),
  new Audio('./sound/enemy_female_hurt_09.mp3'),
  new Audio('./sound/enemy_female_hurt_10.mp3')
];

let enemy_hurt_monster_sound = [
  new Audio('./sound/enemy_monster_hurt_01.mp3'),
  new Audio('./sound/enemy_monster_hurt_02.mp3'),
  new Audio('./sound/enemy_monster_hurt_03.mp3'),
  new Audio('./sound/enemy_monster_hurt_04.mp3'),
  new Audio('./sound/enemy_monster_hurt_05.mp3'),
  new Audio('./sound/enemy_monster_hurt_06.mp3'),
  new Audio('./sound/enemy_monster_hurt_07.mp3'),
  new Audio('./sound/enemy_monster_hurt_08.mp3')
];

let enemy_hurt_beast_sound = [
  new Audio('./sound/enemy_beast_hurt_01.mp3'),
  new Audio('./sound/enemy_beast_hurt_02.mp3'),
  new Audio('./sound/enemy_beast_hurt_03.mp3')
];

let enemy_death_beast_sound = [
  new Audio('./sound/enemy_beast_death_01.mp3'),
  new Audio('./sound/enemy_beast_death_02.mp3'),
  new Audio('./sound/enemy_beast_death_03.mp3')
];

let enemy_hurt_insect_sound = [
  new Audio('./sound/enemy_insect_hurt_01.mp3'),
  new Audio('./sound/enemy_insect_hurt_02.mp3'),
  new Audio('./sound/enemy_insect_hurt_03.mp3'),
  new Audio('./sound/enemy_insect_hurt_04.mp3')
];

let enemy_death_insect_sound = [
  new Audio('./sound/enemy_insect_death_01.mp3'),
  new Audio('./sound/enemy_insect_death_02.mp3'),
  new Audio('./sound/enemy_insect_death_03.mp3')
];
let enemy_insect_combat_start_sounds = [
  new Audio('./sound/growl_combat_start.mp3')
];

// ========================
// Player Action Handler
// ========================
// Called by the UI buttons (Attack, Ability 1, Ability 2, Item).
// Now handles both player and companion turns since companion is player-controlled.
function chooseAction(actionId) {
  const current = combatants[currentTurn];
  // Allow actions for player or companion (both are player-controlled)
  if (current?.type !== 'player' && current?.type !== 'companion') return;
  
  // Track which character is acting
  activeControlledCharacter = current.type;

  if (actionId !== 'item' && itemSelectionOpen) {
    hideItemSelection();
  }

  if (actionId === 'item') {
    showItemSelection();
    return;
  }

  // Check if action needs target selection
  if (actionId === 'defend') {
    // Defend doesn't need a target
    const result = executePlayerAction(actionId, null);
    if (result) completePlayerAction(result);
    return;
  }
  
  // Enter target selection mode for actions that need targets
  startActionTargeting(actionId);
}

function startActionTargeting(actionId) {
  const actor = activeControlledCharacter === 'companion' ? companion : player;
  
  // Determine target type
  let targetType = 'enemy';
  
  if (actionId === 'ability1' || actionId === 'ability2') {
    const abilitySlot = actionId === 'ability1' ? actor.ability1 : actor.ability2;
    const abilityId = abilitySlot?.id;
    if (abilityId) {
      const abilityDef = getAbilityById(abilityId);
      if (abilityDef?.base_effects?.some(eff => 
        eff.target_scope === 'ally' || eff.target_scope === 'self' || eff.type === 'heal'
      )) {
        targetType = 'ally';
      }
    }
  }
  
  // Store pending action
  pendingAction = { actionId, targetType, actor };
  targetSelectionMode = true;
  
  // Set up targetable portraits
  if (targetType === 'enemy') {
    enemies.forEach((enemy, i) => {
      if (enemy.alive !== false && enemy.hp > 0) {
        const card = document.getElementById(`enemy-portrait-${i}`);
        if (card) {
          card.classList.add('targetable', 'target-enemy');
          card.dataset.targetType = 'enemy';
          card.dataset.enemyIndex = i;
          card.addEventListener('click', handleTargetClick);
        }
      }
    });
    log('Select an enemy target...');
  } else {
    const playerCard = document.getElementById('player-portrait');
    if (playerCard && player.alive !== false && player.hp > 0) {
      playerCard.classList.add('targetable', 'target-ally');
      playerCard.dataset.targetType = 'player';
      playerCard.addEventListener('click', handleTargetClick);
    }
    const allyCard = document.getElementById('ally-portrait');
    if (allyCard && companion.alive !== false && companion.hp > 0) {
      allyCard.classList.add('targetable', 'target-ally');
      allyCard.dataset.targetType = 'companion';
      allyCard.addEventListener('click', handleTargetClick);
    }
    summonedNPCs.forEach(summon => {
      if (summon.alive && summon.hp > 0) {
        const card = document.getElementById(`summon-portrait-${summon.id}`);
        if (card) {
          card.classList.add('targetable', 'target-ally');
          card.dataset.targetType = 'summon';
          card.dataset.summonId = summon.id;
          card.addEventListener('click', handleTargetClick);
        }
      }
    });
    log('Select a friendly target...');
  }
}

function enterTargetSelection(actionId) {
  const actor = activeControlledCharacter === 'companion' ? companion : player;
  
  // Determine what kind of targets this action needs
  let targetType = 'enemy'; // default
  
  if (actionId === 'defend') {
    // Defend doesn't need a target, execute immediately
    const result = executePlayerAction(actionId, null);
    if (result) completePlayerAction(result);
    return;
  }
  
  // Check if it's an ability that targets allies
  if (actionId === 'ability1' || actionId === 'ability2') {
    const abilitySlot = actionId === 'ability1' ? actor.ability1 : actor.ability2;
    const abilityId = abilitySlot?.id;
    if (abilityId) {
      const abilityDef = getAbilityById(abilityId);
      if (abilityDef) {
        // Check base_effects to determine target type
        const hasAllyEffect = abilityDef.base_effects?.some(eff => 
          eff.target_scope === 'ally' || eff.target_scope === 'self' || eff.type === 'heal'
        );
        if (hasAllyEffect) {
          targetType = 'ally';
        }
      }
    }
  }
  
  // Store pending action
  pendingAction = { actionId, targetType, actor };
  targetSelectionMode = true;
  
  // Highlight valid targets
  highlightValidTargets(targetType);
  
  // Show instruction
  log(`Select a ${targetType === 'ally' ? 'friendly' : 'enemy'} target...`);
}

function highlightValidTargets(targetType) {
  // Remove any existing target-valid highlights
  document.querySelectorAll('.portrait').forEach(p => p.classList.remove('target-valid'));
  
  if (targetType === 'enemy') {
    // Highlight living enemies
    enemies.forEach((enemy, i) => {
      if (enemy.alive !== false && enemy.hp > 0) {
        const card = document.getElementById(`enemy-portrait-${i}`);
        if (card) card.classList.add('target-valid');
      }
    });
  } else if (targetType === 'ally') {
    // Highlight player and companion
    if (player.alive !== false && player.hp > 0) {
      document.getElementById('player-portrait')?.classList.add('target-valid');
    }
    if (companion.alive !== false && companion.hp > 0) {
      document.getElementById('ally-portrait')?.classList.add('target-valid');
    }
    // Highlight summons
    summonedNPCs.forEach(summon => {
      if (summon.alive && summon.hp > 0) {
        const card = document.getElementById(`summon-portrait-${summon.id}`);
        if (card) card.classList.add('target-valid');
      }
    });
  }
}

function cancelTargetSelection() {
  targetSelectionMode = false;
  pendingAction = null;
  document.querySelectorAll('.portrait').forEach(p => p.classList.remove('target-valid'));
  log('Action cancelled.');
  // Re-enable action buttons
  enableActions();
}

function handlePortraitClick(target) {
  if (!targetSelectionMode || !pendingAction) return;
  
  // Validate target
  const { actionId, targetType } = pendingAction;
  let isValid = false;
  
  if (targetType === 'enemy' && target.type === 'enemy') {
    isValid = target.data.alive !== false && target.data.hp > 0;
  } else if (targetType === 'ally') {
    if (target.type === 'player' || target.type === 'companion' || target.type === 'summon') {
      isValid = target.data.alive !== false && target.data.hp > 0;
    }
  }
  
  if (!isValid) {
    log('Invalid target.');
    return;
  }
  
  // Clear targeting mode
  targetSelectionMode = false;
  document.querySelectorAll('.portrait').forEach(p => p.classList.remove('target-valid'));
  
  // Execute action with selected target
  const result = executePlayerAction(actionId, target.data);
  pendingAction = null;
  
  if (result) {
    completePlayerAction(result);
  }
}

function executePlayerAction(actionId, selectedTarget = null) {
  const livingEnemies = getLivingEnemies();
  const targetEnemy = selectedTarget || livingEnemies[0] || null;
  
  // Determine which character is acting (player or companion)
  const actor = activeControlledCharacter === 'companion' ? companion : player;
  const actorName = actor === player ? 'You' : actor.name;
  
  const abilityName = actionId === 'ability1' ? (actor.ability1?.name || 'Ability 1')
                      : actionId === 'ability2' ? (actor.ability2?.name || 'Ability 2')
                      : null;

  switch (actionId) {
    case 'attack': {
      if (!targetEnemy) {
        handleVictory();
        return null;
      }
      const damage = getScaledBasicAttack(actor);
      const final = applyDamageToTarget(targetEnemy, damage, 'physical');
      log(`${actorName} attack${actor === player ? '' : 's'} ${targetEnemy.name} for ${final} damage (${damage} raw).`);
      playAttackSound();
      return { enemy: targetEnemy, damage: final, rawDamage: damage, action: 'attack', actor };
    }
    case 'defend': {
      const sanityGainCap = actor.maxSanity ?? (actor.sanity + 5);
      const sanityBefore = actor.sanity;
      actor.sanity = Math.min(sanityGainCap, actor.sanity + 5);
      const sanityGain = actor.sanity - sanityBefore;
      log(`${actorName} brace${actor === player ? '' : 's'}${sanityGain ? ` and regain${actor === player ? '' : 's'} ${sanityGain} sanity` : ''}.`);
      defendSound.play().catch(err => console.log('Sound error:', err));
      return { action: 'defend', actor };
    }
    case 'element': {
      if (!targetEnemy) {
        handleVictory();
        return null;
      }
      const damage = Math.floor(Math.random() * 12) + 8;
      // Elemental attacks bypass physical defense (magical)
      const final = applyDamageToTarget(targetEnemy, damage, 'elemental');
      actor.sanity = Math.max(0, actor.sanity - 5);
      
      // Update sanity state after sanity cost
      if (actor === player) updateSanityState();
      
      log(`${actorName} unleash${actor === player ? '' : 'es'} elemental strike! ${final} damage dealt (raw ${damage}), sanity -5.`);
      playAttackSound();
      return { enemy: targetEnemy, damage: final, rawDamage: damage, action: 'element', actor };
    }
    case 'ability1': {
      if (!actor.ability1) {
        log(`${actorName} do${actor === player ? '' : 'es'} not have a first ability.`);
        return null;
      }
      const abilityId = actor.ability1.id;
      if (abilityId && getAbilityById(abilityId)) {
        // Use the new ability resolution system
        const targets = selectedTarget || getLivingEnemies()[0] || actor; // Use selected target
        const result = resolveAbilityUse(abilityId, actor, targets);
        return { action: 'ability1', abilityResult: result, actor };
      }
      // Fallback for abilities without IDs (legacy)
      const sanityBefore = actor.sanity;
      const hpBefore = actor.hp;
      const sanityCap = actor.maxSanity ?? (actor.sanity + 10);
      const hpCap = actor.maxHp ?? (actor.hp + 5);
      actor.sanity = Math.min(sanityCap, actor.sanity + 10);
      actor.hp = Math.min(hpCap, actor.hp + 5);
      const sanityGain = actor.sanity - sanityBefore;
      const hpGain = actor.hp - hpBefore;
      const pieces = [];
      if (hpGain > 0) pieces.push(`restore${actor === player ? '' : 's'} ${hpGain} HP`);
      if (sanityGain > 0) pieces.push(`regain${actor === player ? '' : 's'} ${sanityGain} sanity`);
      const effectText = pieces.length ? `, ${pieces.join(' and ')}` : '';
      log(`${actorName} use${actor === player ? '' : 's'} ${abilityName}${effectText}.`);
      return { action: 'ability1', actor };
    }
    case 'ability2': {
      if (!actor.ability2) {
        log(`${actorName} do${actor === player ? '' : 'es'} not have a second ability.`);
        return null;
      }
      const abilityId2 = actor.ability2.id;
      if (abilityId2 && getAbilityById(abilityId2)) {
        // Use the new ability resolution system
        const targetForAbility = selectedTarget || targetEnemy || getLivingEnemies()[0];
        if (!targetForAbility) {
          handleVictory();
          return null;
        }
        const result = resolveAbilityUse(abilityId2, actor, targetForAbility);
        playAttackSound();
        return { enemy: targetForAbility, action: 'ability2', abilityResult: result, actor };
      }
      // Fallback for abilities without IDs (legacy)
      if (!targetEnemy) {
        handleVictory();
        return null;
      }
      const damage = Math.floor(Math.random() * 8) + 6;
      const final = applyDamageToTarget(targetEnemy, damage, 'physical');
      const sanityBefore = actor.sanity;
      const sanityCap = actor.maxSanity ?? (actor.sanity + 5);
      actor.sanity = Math.min(sanityCap, actor.sanity + 5);
      const sanityGain = actor.sanity - sanityBefore;
      const sanityText = sanityGain ? ` and stead${actor === player ? 'y your' : 'ies their'} mind (+${sanityGain} sanity)` : '';
      log(`${actorName} unleash${actor === player ? '' : 'es'} ${abilityName}, unsettling ${targetEnemy.name} for ${damage} damage${sanityText}.`);
      playAttackSound();
      return { enemy: targetEnemy, damage: final, rawDamage: damage, action: 'ability2', actor };
    }
    default:
      log('Unknown action.');
      return null;
  }
}

function completePlayerAction(result = {}) {
  const enemy = result.enemy;
  const damage = result.damage || 0;

  if (enemy) {
    const enemyIndex = enemies.indexOf(enemy);
    if (enemyIndex >= 0) {
      updateEnemyHP(enemyIndex);
      if (damage > 0) {
        flashDamage(`enemy-portrait-${enemyIndex}`);
      }
    }

    if (enemy.hp <= 0 && enemy.alive !== false) {
      animateEnemyDeath(enemy, enemyIndex);
      enemy.alive = false;
      setTimeout(() => {
        const deathSoundArray = getEnemyDeathSounds(enemy);
        playRandomSound(deathSoundArray);
      }, 1000);
    } else if (damage > 0) {
      setTimeout(() => {
        const hurtSoundArray = getEnemyHurtSounds(enemy);
        playRandomSound(hurtSoundArray);
      }, 1000);
    }
  }

  updateUI();
  const victoryTriggered = checkEnemyStatus();
  saveGameState();

  if (!combatEnded && !victoryTriggered) {
    setTimeout(nextTurn, 2000);
  }
}

// Character hurt sound effects (player/companion)

let cryptonaut_male_hurt_sounds = [
  new Audio('./sound/cryptonaut_male_hurt_01.mp3'),
  new Audio('./sound/cryptonaut_male_hurt_02.mp3'),
  new Audio('./sound/cryptonaut_male_hurt_03.mp3'),
  new Audio('./sound/cryptonaut_male_hurt_04.mp3'),
  new Audio('./sound/cryptonaut_male_hurt_05.mp3'),
  new Audio('./sound/cryptonaut_male_hurt_06.mp3'),
  new Audio('./sound/cryptonaut_male_hurt_07.mp3'),
  new Audio('./sound/cryptonaut_male_hurt_08.mp3')
];

let cryptonaut_female_hurt_sounds = [
  new Audio('./sound/cryptonaut_female_hurt_01.mp3'),
  new Audio('./sound/cryptonaut_female_hurt_02.mp3'),
  new Audio('./sound/cryptonaut_female_hurt_03.mp3'),
  new Audio('./sound/cryptonaut_female_hurt_04.mp3'),
  new Audio('./sound/cryptonaut_female_hurt_05.mp3'),
  new Audio('./sound/cryptonaut_female_hurt_06.mp3'),
  new Audio('./sound/cryptonaut_female_hurt_07.mp3'),
  new Audio('./sound/cryptonaut_female_hurt_08.mp3')
];

let cryptonaut_monster_hurt_sounds = [
  new Audio('./sound/cryptonaut_monster_hurt_01.mp3'),
  new Audio('./sound/cryptonaut_monster_hurt_02.mp3'),
  new Audio('./sound/cryptonaut_monster_hurt_03.mp3'),
  new Audio('./sound/cryptonaut_monster_hurt_04.mp3'),
  new Audio('./sound/cryptonaut_monster_hurt_05.mp3'),
  new Audio('./sound/cryptonaut_monster_hurt_06.mp3'),
  new Audio('./sound/cryptonaut_monster_hurt_07.mp3'),
  new Audio('./sound/cryptonaut_monster_hurt_08.mp3')
];

// Character win sounds

let cryptonaut_male_win_sounds = [
  new Audio('./sound/cryptonauts_male_win_01.mp3'),
  new Audio('./sound/cryptonauts_male_win_02.mp3')
];

let cryptonaut_female_win_sounds = [
  new Audio('./sound/cryptonaut_female_win_01.mp3'),
  new Audio('./sound/cryptonaut_female_win_02.mp3'),
  new Audio('./sound/cryptonaut_female_win_03.mp3')
];

let cryptonaut_monster_win_sounds = [
  new Audio('./sound/cryptonaut_monster_win_01.mp3'),
  new Audio('./sound/cryptonaut_monster_win_02.mp3'),
  new Audio('./sound/cryptonaut_monster_win_03.mp3')
];

// Combat start sounds

let cryptonaut_male_combat_start_sounds = [
  new Audio('./sound/cryptonaut_male_combat_start_01.mp3'),
  new Audio('./sound/cryptonaut_male_combat_start_02.mp3')
];

let cryptonaut_female_combat_start_sounds = [
  new Audio('./sound/cryptonaut_female_combat_start_01.mp3'),
  new Audio('./sound/cryptonaut_female_combat_start_02.mp3')
];

let cryptonaut_monster_combat_start_sounds = [
  new Audio('./sound/cryptonaut_monster_combat_start_01.mp3'),
  new Audio('./sound/cryptonaut_monster_combat_start_02.mp3')
];

let enemy_male_combat_start_sounds = [
  new Audio('./sound/enemy_male_combat_starts_01.mp3'),
  new Audio('./sound/enemy_male_combat_starts_02.mp3')
];

let enemy_female_combat_start_sounds = [
  new Audio('./sound/enemy_female_combat_start_01.mp3')
];

let enemy_monster_combat_start_sounds = [
  new Audio('./sound/enemy_monster_combat_start_01.mp3'),
  new Audio('./sound/enemy_monster_combat_start_02.mp3'),
  new Audio('./sound/enemy_monster_combat_start_03.mp3')
];

const enemySoundBank = {
  enemy_male_hurt: enemy_hurt_male_sound,
  enemy_female_hurt: enemy_hurt_female_sound,
  enemy_monster_hurt: enemy_hurt_monster_sound,
  enemy_beast_hurt: enemy_hurt_beast_sound,
  enemy_insect_hurt: enemy_hurt_insect_sound,
  enemy_male_death: enemy_death_male_sound,
  enemy_female_death: enemy_death_female_sound,
  enemy_monster_death: enemy_death_monster_sound,
  enemy_beast_death: enemy_death_beast_sound,
  enemy_insect_death: enemy_death_insect_sound,
  enemy_male_combat_start: enemy_male_combat_start_sounds,
  enemy_female_combat_start: enemy_female_combat_start_sounds,
  enemy_monster_combat_start: enemy_monster_combat_start_sounds,
  enemy_beast_combat_start: enemy_monster_combat_start_sounds,
  enemy_insect_combat_start: enemy_insect_combat_start_sounds,
  growl_combat_start: enemy_insect_combat_start_sounds
};

function resolveEnemySoundArray(key, fallbackArray) {
  if (key && enemySoundBank[key]) {
    return enemySoundBank[key];
  }
  return fallbackArray;
}

function getDefaultEnemyHurtArray(enemy) {
  if (!enemy) return enemy_hurt_monster_sound;
  switch (enemy.gender) {
    case 'f':
      return enemy_hurt_female_sound;
    case 'm':
      return enemy_hurt_male_sound;
    case 'i':
      return enemy_hurt_insect_sound;
    default:
      return enemy_hurt_monster_sound;
  }
}

function getDefaultEnemyDeathArray(enemy) {
  if (!enemy) return enemy_death_monster_sound;
  switch (enemy.gender) {
    case 'f':
      return enemy_death_female_sound;
    case 'm':
      return enemy_death_male_sound;
    case 'i':
      return enemy_death_insect_sound;
    default:
      return enemy_death_monster_sound;
  }
}

function getDefaultEnemyCombatStartArray(enemy) {
  if (!enemy) return enemy_monster_combat_start_sounds;
  switch (enemy.gender) {
    case 'f':
      return enemy_female_combat_start_sounds;
    case 'm':
      return enemy_male_combat_start_sounds;
    case 'i':
      return enemy_insect_combat_start_sounds;
    default:
      return enemy_monster_combat_start_sounds;
  }
}

function getEnemyHurtSounds(enemy) {
  return resolveEnemySoundArray(enemy?.audio?.voice_hurt, getDefaultEnemyHurtArray(enemy));
}

function getEnemyDeathSounds(enemy) {
  return resolveEnemySoundArray(enemy?.audio?.voice_death, getDefaultEnemyDeathArray(enemy));
}

function getEnemyCombatStartSounds(enemy) {
  return resolveEnemySoundArray(enemy?.audio?.voice_combat_start, getDefaultEnemyCombatStartArray(enemy));
}

// Party defeat sounds

let party_death_male_sound = [
  new Audio('./sound/cryptonaut_male_death_01.mp3'),
  new Audio('./sound/cryptonaut_male_death_02.mp3'),
  new Audio('./sound/cryptonaut_male_death_03.mp3'),
  new Audio('./sound/cryptonaut_male_death_04.mp3')
];

let party_death_female_sound = [
  new Audio('./sound/cryptonaut_female_death_01.mp3'),
  new Audio('./sound/cryptonaut_female_death_02.mp3'),
  new Audio('./sound/cryptonaut_female_death_03.mp3')
];

let party_death_monster_sound = [
  new Audio('./sound/cryptonaut_monster_death_01.mp3'),
  new Audio('./sound/cryptonaut_monster_death_02.mp3'),
  new Audio('./sound/cryptonaut_monster_death_03.mp3')
];

// Consolidated list of every audio buffer we need to unlock via user interaction
const audioCollections = [
  [victorySound],
  [combatMusic],
  [levelUpSound],
  attackSounds,
  [defendSound],
  [potion_sound],
  [summon_sound],
  cryptonaut_male_hurt_sounds,
  cryptonaut_female_hurt_sounds,
  cryptonaut_monster_hurt_sounds,
  cryptonaut_male_win_sounds,
  cryptonaut_female_win_sounds,
  cryptonaut_monster_win_sounds,
  cryptonaut_male_combat_start_sounds,
  cryptonaut_female_combat_start_sounds,
  cryptonaut_monster_combat_start_sounds,
  enemy_male_combat_start_sounds,
  enemy_female_combat_start_sounds,
  enemy_monster_combat_start_sounds,
  enemy_insect_combat_start_sounds,
  party_death_male_sound,
  party_death_female_sound,
  party_death_monster_sound,
  enemy_death_male_sound,
  enemy_death_female_sound,
  enemy_death_monster_sound,
  enemy_death_beast_sound,
  enemy_death_insect_sound,
  enemy_hurt_male_sound,
  enemy_hurt_female_sound,
  enemy_hurt_monster_sound,
  enemy_hurt_beast_sound,
  enemy_hurt_insect_sound
];

function getAllAudioNodes() {
  return audioCollections.flat().filter(Boolean);
}

async function unlockAudioPlayback() {
  const nodes = getAllAudioNodes();
  const unlockPromises = nodes.map(audio => {
    if (!audio) return Promise.resolve();
    audio.muted = true;
    audio.currentTime = 0;
    try {
      return audio.play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        })
        .catch(() => {
          audio.muted = false;
        });
    } catch (err) {
      audio.muted = false;
      return Promise.resolve();
    }
  });
  return Promise.all(unlockPromises);
}

function startCombatMusic() {
  if (!combatMusic) return;
  combatMusic.currentTime = 0;
  combatMusic.play().catch(err => console.log('Combat music error:', err));
  
  // Play a combat start voice 2 seconds after music begins
  setTimeout(() => {
    playCombatStartVoice();
    // Start first turn 2 seconds after combat start voice
    setTimeout(() => {
      nextTurn();
    }, 2000);
  }, 2000);
}

/**
 * Play a random combat start voice from either the player/companion or an enemy.
 * 50% chance for each side.
 */
function playCombatStartVoice() {
  const isPlayerSide = Math.random() < 0.5;
  
  if (isPlayerSide) {
    // Play player or companion combat start sound based on gender
    const gender = player.gender || 'm';
    let soundArray;
    if (gender === 'f') {
      soundArray = cryptonaut_female_combat_start_sounds;
    } else if (gender === 'm') {
      soundArray = cryptonaut_male_combat_start_sounds;
    } else {
      soundArray = cryptonaut_monster_combat_start_sounds;
    }
    playRandomSound(soundArray);
  } else {
    // Play a random enemy's combat start sound based on their gender
    const livingEnemies = enemies.filter(e => e.alive !== false && e.hp > 0);
    if (livingEnemies.length === 0) return;
    
    const randomEnemy = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
    const soundArray = getEnemyCombatStartSounds(randomEnemy);
    playRandomSound(soundArray);
  }
}

function stopCombatMusic() {
  if (!combatMusic) return;
  combatMusic.pause();
  combatMusic.currentTime = 0;
}

function formatActionLabel(action = '') {
  if (!action) return '';
  return action.replace(/_/g, ' ').replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}

function renderActionButtons(actionList = []) {
  const container = document.getElementById('actions');
  if (!container) return;
  const list = (Array.isArray(actionList) && actionList.length)
    ? actionList
    : buildCharacterActions();
  container.innerHTML = '';
  list.forEach(action => {
    if (!action?.id) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = action.id;
    button.textContent = action.label || formatActionLabel(action.id);
    if (action.description) {
      button.title = action.description;
    }
    button.addEventListener('click', () => chooseAction(action.id));
    container.appendChild(button);
  });
}

function getLivingEnemies() {
  return enemies.filter(e => e.alive !== false && e.hp > 0);
}

function rollFromDiceSpec(spec) {
  if (!spec || typeof spec !== 'object') {
    return Math.floor(Math.random() * 6) + 4;
  }
  const dice = Number(spec.dice) || 1;
  const sides = Number(spec.sides) || 6;
  let total = 0;
  for (let i = 0; i < dice; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

/**
 * Parse a dice string like "2d6" or "1d8+2" and roll it.
 * Returns a numeric result.
 */
function rollDiceString(diceStr) {
  if (!diceStr || diceStr === '0' || diceStr === '+0') return 0;
  if (typeof diceStr === 'number') return diceStr;
  
  // Handle simple numeric strings
  const numericOnly = parseInt(diceStr, 10);
  if (!isNaN(numericOnly) && String(numericOnly) === diceStr) {
    return numericOnly;
  }
  
  // Parse dice notation: NdS or NdS+M or +NdS
  let total = 0;
  const parts = diceStr.replace(/\s/g, '').split(/(?=[+-])/);
  
  for (const part of parts) {
    if (!part) continue;
    const diceMatch = part.match(/^([+-]?)(\d+)?d(\d+)$/);
    if (diceMatch) {
      const sign = diceMatch[1] === '-' ? -1 : 1;
      const dice = parseInt(diceMatch[2] || '1', 10);
      const sides = parseInt(diceMatch[3], 10);
      for (let i = 0; i < dice; i++) {
        total += sign * (Math.floor(Math.random() * sides) + 1);
      }
    } else {
      // Flat modifier like +5 or -3
      total += parseInt(part, 10) || 0;
    }
  }
  return total;
}

// ========================
// Ability & Status Effect System
// ========================

// Cached ability and status effect definitions
let abilityCatalog = {};
let statusEffectCatalog = {};

/**
 * Load abilities and status effects from JSON files.
 */
async function loadAbilitiesAndEffects() {
  try {
    const [abilitiesRes, effectsRes] = await Promise.all([
      fetch('abilities.json'),
      fetch('status_effects.json')
    ]);
    
    if (abilitiesRes.ok) {
      const abilitiesData = await abilitiesRes.json();
      const rawAbilities = abilitiesData.abilities || [];
      const abilitiesArray = Array.isArray(rawAbilities)
        ? rawAbilities
        : Object.values(rawAbilities);
      abilityCatalog = abilitiesArray.reduce((map, ability) => {
        map[ability.id] = ability;
        return map;
      }, {});
      console.log('Loaded abilities:', Object.keys(abilityCatalog));
    }
    
    if (effectsRes.ok) {
      const effectsData = await effectsRes.json();
      const rawEffects = effectsData.status_effects || [];
      const effectsArray = Array.isArray(rawEffects)
        ? rawEffects
        : Object.values(rawEffects);
      statusEffectCatalog = effectsArray.reduce((map, effect) => {
        map[effect.id] = effect;
        return map;
      }, {});
      console.log('Loaded status effects:', Object.keys(statusEffectCatalog));
    }
  } catch (err) {
    console.warn('Could not load abilities/effects:', err);
  }
}

/**
 * Get the ability definition by ID.
 */
function getAbilityById(abilityId) {
  return abilityCatalog[abilityId] || null;
}

/**
 * Get the status effect definition by ID.
 */
function getStatusEffectById(statusId) {
  return statusEffectCatalog[statusId] || null;
}

/**
 * Get the applicable level rule for an ability based on character level.
 */
function getLevelRule(ability, characterLevel) {
  if (!ability || !ability.level_rules || !ability.level_rules.length) {
    return null;
  }
  
  // Find the highest min_level that is <= characterLevel
  let applicableRule = null;
  for (const rule of ability.level_rules) {
    if (rule.min_level <= characterLevel) {
      if (!applicableRule || rule.min_level > applicableRule.min_level) {
        applicableRule = rule;
      }
    }
  }
  return applicableRule;
}

/**
 * Apply a single effect from an ability to the target(s).
 * @param {Object} effect - The effect definition from the ability.
 * @param {Object} caster - The character using the ability.
 * @param {Object|Array} targets - Single target or array of targets.
 * @param {Object} levelRule - The applicable level rule for scaling.
 * @returns {Object} Result of applying the effect.
 */
function applyEffect(effect, caster, targets, levelRule) {
  const targetArray = Array.isArray(targets) ? targets : [targets];
  const results = [];
  
  // Calculate adjusted chance
  let chance = effect.chance || 1.0;
  if (levelRule && levelRule.chance_delta) {
    chance += levelRule.chance_delta;
  }
  chance = Math.min(1.0, Math.max(0, chance));
  
  // Calculate adjusted magnitude with level bonus (+1 per level)
  let magnitudeStr = effect.magnitude || '0';
  if (levelRule && levelRule.magnitude_delta && levelRule.magnitude_delta !== '+0') {
    magnitudeStr = magnitudeStr + levelRule.magnitude_delta;
  }
  // Add character level bonus to magnitude (+1 per level)
  const levelBonus = getAbilityLevelBonus(caster);
  
  for (const target of targetArray) {
    if (!target || target.hp <= 0 || target.alive === false) continue;
    
    // Roll against chance
    const roll = Math.random();
    if (roll > chance) {
      results.push({ target, success: false, reason: 'missed' });
      continue;
    }
    
    const baseMagnitude = rollDiceString(magnitudeStr);
    const magnitude = effect.skipLevelBonus ? baseMagnitude : baseMagnitude + levelBonus;
    
    switch (effect.type) {
      case 'damage': {
        // Respect damage type: physical damage is reduced by defense
        const dmgType = effect.damage_type || 'physical';
        const applied = applyDamageToTarget(target, magnitude, dmgType);
        results.push({ target, success: true, type: 'damage', amount: applied, raw: magnitude });
        log(`${target.name} takes ${applied} ${dmgType} damage (raw ${magnitude})!`);
        break;
      }
      
      case 'heal': {
        const resource = effect.resource || 'hp';
        const maxVal = target[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}`] || target[resource] + magnitude;
        const before = target[resource];
        target[resource] = Math.min(maxVal, target[resource] + magnitude);
        const healed = target[resource] - before;
        results.push({ target, success: true, type: 'heal', resource, amount: healed });
        log(`${target.name} recovers ${healed} ${resource}!`);
        break;
      }
      
      case 'status':
      case 'buff': {
        const statusDef = getStatusEffectById(effect.status_id);
        if (!statusDef) {
          results.push({ target, success: false, reason: 'unknown_status' });
          break;
        }
        
        // Initialize status_effects array if needed
        if (!target.status_effects) target.status_effects = [];
        
        // Check if target already has this status
        const existing = target.status_effects.find(s => s.id === effect.status_id);
        
        if (existing) {
          // Handle stacking
          if (statusDef.stackable) {
            const maxStacks = statusDef.max_stacks || 99;
            existing.stacks = Math.min((existing.stacks || 1) + 1, maxStacks);
            existing.duration = Math.max(existing.duration, effect.duration_turns || statusDef.default_duration);
            log(`${target.name}'s ${statusDef.name} intensifies! (${existing.stacks} stacks)`);
          } else {
            // Refresh duration
            existing.duration = Math.max(existing.duration, effect.duration_turns || statusDef.default_duration);
            log(`${target.name}'s ${statusDef.name} is refreshed.`);
          }
        } else {
          // Apply new status
          target.status_effects.push({
            id: effect.status_id,
            name: statusDef.name,
            duration: effect.duration_turns || statusDef.default_duration,
            magnitude: magnitude,
            stacks: 1,
            appliedBy: caster.name || 'unknown'
          });
          log(`${target.name} is afflicted with ${statusDef.name}!`);
        }
        
        results.push({ target, success: true, type: 'status', status: effect.status_id });
        break;
      }

      case 'cleanse': {
        if (target.status_effects && target.status_effects.length) {
          const before = target.status_effects.length;
          const statusId = effect.status_id;
          target.status_effects = statusId
            ? target.status_effects.filter(s => s.id !== statusId)
            : [];
          const removed = before - target.status_effects.length;
          if (removed > 0) {
            log(`${target.name} is cleansed of ${statusId || 'ailments'}.`);
          }
        }
        results.push({ target, success: true, type: 'cleanse' });
        break;
      }

      case 'cure_all': {
        if (target.status_effects) {
          target.status_effects = [];
        }
        log(`${target.name} feels renewed.`);
        results.push({ target, success: true, type: 'cleanse' });
        break;
      }

      case 'weapon_coating': {
        if (!target.weaponCoatings) {
          target.weaponCoatings = [];
        }
        target.weaponCoatings.push({
          type: effect.coating_type,
          damagePerTurn: effect.magnitude || '1d6',
          duration: effect.duration_turns || 3
        });
        log(`${target.name}'s weapon is coated with ${effect.coating_type}.`);
        results.push({ target, success: true, type: 'weapon_coating' });
        break;
      }

      case 'barrier': {
        target.barrier = {
          active: true,
          remainingTurns: effect.duration_turns || 2
        };
        log(`A barrier shields ${target.name}.`);
        results.push({ target, success: true, type: 'barrier' });
        break;
      }

      case 'immobilize': {
        target.immobilized = {
          active: true,
          remainingTurns: effect.duration_turns || 2
        };
        log(`${target.name} is immobilized!`);
        results.push({ target, success: true, type: 'immobilize' });
        break;
      }

      case 'confusion': {
        target.confused = {
          active: true,
          remainingTurns: effect.duration_turns || 2
        };
        log(`${target.name} is thrown into disarray!`);
        results.push({ target, success: true, type: 'confusion' });
        break;
      }

      case 'summon': {
        if (!effect.summonId) {
          results.push({ target, success: false, reason: 'missing_summon_id' });
          break;
        }
        if (typeof spawnSummon !== 'function') {
          log('Summon effect failed: system unavailable.');
          results.push({ target, success: false, reason: 'summon_system_unavailable' });
          break;
        }
        const summonOutcome = spawnSummon(effect.summonId);
        if (summonOutcome.success) {
          results.push({
            target: summonOutcome.summon || target,
            success: true,
            type: 'summon',
            summonId: effect.summonId
          });
        } else {
          const failureMessage = summonOutcome.message || 'Summon failed.';
          log(failureMessage);
          results.push({ target, success: false, reason: failureMessage });
        }
        break;
      }
      
      case 'meta': {
        // Meta effects like nullify_incoming_damage are handled by combat logic
        if (effect.meta_action === 'rest_party') {
          [player, companion]
            .filter(Boolean)
            .forEach(member => {
              member.hp = member.maxHp;
              member.sanity = member.maxSanity;
              member.status_effects = [];
            });
          log('The party takes a moment to rest and recover.');
        }
        results.push({ target, success: true, type: 'meta', action: effect.meta_action });
        break;
      }
      
      default:
        results.push({ target, success: false, reason: 'unknown_effect_type' });
    }
  }
  
  return results;
}

// Expose effect engine for other modules (e.g., item system)
const globalScope = typeof window !== 'undefined' ? window : globalThis;
globalScope.sharedEffectEngine = globalScope.sharedEffectEngine || {};
globalScope.sharedEffectEngine.applyEffect = applyEffect;
globalScope.sharedEffectEngine.rollDiceString = rollDiceString;

/**
 * Resolve using an ability.
 * @param {string} abilityId - The ID of the ability to use.
 * @param {Object} caster - The character using the ability.
 * @param {Object|Array} targets - The target(s) of the ability.
 * @returns {Object} Result of the ability use.
 */
function resolveAbilityUse(abilityId, caster, targets) {
  const ability = getAbilityById(abilityId);
  if (!ability) {
    log(`Unknown ability: ${abilityId}`);
    return { success: false, reason: 'unknown_ability' };
  }
  
  const characterLevel = caster.level || 1;
  const levelRule = getLevelRule(ability, characterLevel);
  const casterName = caster?.name || 'Someone';
  
  // Determine actual targets based on level rule target override
  let actualTargets = targets;
  if (levelRule && levelRule.target_override) {
    const override = levelRule.target_override;
    if (override === 'enemy_team') {
      actualTargets = getLivingEnemies();
    } else if (override === 'ally_team') {
      actualTargets = [player, companion].filter(c => c && c.alive !== false && c.hp > 0);
    }
  }

  const targetSummary = describeTargetsForLog(actualTargets);
  const preface = targetSummary ? ` on ${targetSummary}` : '';
  log(`⚔️ ${casterName} uses ${ability.name}${preface}.`);
  
  const allResults = [];
  
  // Apply each effect in the ability
  for (const effect of ability.base_effects || []) {
    const effectResults = applyEffect(effect, caster, actualTargets, levelRule);
    allResults.push(...effectResults);
  }

  logAbilityResultDetails(ability.name, allResults);
  
  return { success: true, ability: ability.name, results: allResults };
}

function describeTargetsForLog(targets) {
  if (!targets) return '';
  const arr = Array.isArray(targets) ? targets : [targets];
  const names = arr
    .filter(t => t)
    .map(t => t.name || t.displayName || t.id || 'unknown target');
  if (!names.length) return '';
  if (names.length <= 3) {
    return names.join(', ');
  }
  return `${names.length} targets`;
}

function logAbilityResultDetails(abilityName, results) {
  if (!results || results.length === 0) {
    log(`${abilityName} has no noticeable effect.`);
    return;
  }
  
  results.forEach(result => {
    const targetName = result?.target?.name || result?.target?.displayName || result?.target?.id || 'unknown target';
    const typeLabel = result?.type ? ` (${result.type})` : '';
    if (result.success) {
      log(`✔️ ${abilityName}${typeLabel} succeeds on ${targetName}.`);
    } else {
      const reasonText = formatFailureReason(result?.reason);
      log(`✖️ ${abilityName}${typeLabel} fails on ${targetName}${reasonText}.`);
    }
  });
}

function formatFailureReason(reason) {
  if (!reason) return '';
  if (typeof reason === 'string') {
    return ` (${reason.replace(/_/g, ' ')})`;
  }
  try {
    return ` (${JSON.stringify(reason)})`;
  } catch (err) {
    return ' (unknown reason)';
  }
}

/**
 * Process status effects at the start of a combatant's turn.
 * Handles DoT, HoT, and decrementing durations.
 * @param {Object} combatant - The combatant whose turn is starting.
 */
function processStatusEffects(combatant) {
  if (!combatant || !combatant.status_effects || combatant.status_effects.length === 0) {
    return;
  }
  
  const effectsToRemove = [];
  
  for (const activeEffect of combatant.status_effects) {
    const statusDef = getStatusEffectById(activeEffect.id);
    if (!statusDef) continue;
    
    // Check for tags that affect behavior
    const tags = statusDef.tags || [];
    
    // Handle no_action tag (stun) - handled in turn logic
    
    // Handle tick_damage (DoT like poison, fire, bleeding)
    if (statusDef.tick_damage) {
      const tickDmg = rollDiceString(statusDef.tick_damage);
      const stacks = activeEffect.stacks || 1;
      const totalDmg = tickDmg * stacks;
      combatant.hp -= totalDmg;
      log(`${combatant.name} takes ${totalDmg} ${statusDef.name} damage!`);
    }
    
    // Handle tick_heal (HoT like regeneration)
    if (statusDef.tick_heal) {
      const tickHeal = rollDiceString(statusDef.tick_heal);
      const maxHp = combatant.maxHp || combatant.hp + tickHeal;
      const before = combatant.hp;
      combatant.hp = Math.min(maxHp, combatant.hp + tickHeal);
      const healed = combatant.hp - before;
      if (healed > 0) {
        log(`${combatant.name} regenerates ${healed} HP.`);
      }
    }
    
    // Decrement duration
    activeEffect.duration--;
    
    if (activeEffect.duration <= 0) {
      effectsToRemove.push(activeEffect);
      log(`${combatant.name}'s ${activeEffect.name} wears off.`);
    }
  }
  
  // Remove expired effects
  for (const effect of effectsToRemove) {
    const idx = combatant.status_effects.indexOf(effect);
    if (idx >= 0) {
      combatant.status_effects.splice(idx, 1);
    }
  }
}

/**
 * Check if a combatant is stunned (has no_action tag).
 */
function isStunned(combatant) {
  if (!combatant || !combatant.status_effects) return false;
  
  for (const activeEffect of combatant.status_effects) {
    const statusDef = getStatusEffectById(activeEffect.id);
    if (statusDef && statusDef.tags && statusDef.tags.includes('no_action')) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a combatant is charmed (ai_override tag).
 */
function isCharmed(combatant) {
  if (!combatant || !combatant.status_effects) return false;
  
  for (const activeEffect of combatant.status_effects) {
    const statusDef = getStatusEffectById(activeEffect.id);
    if (statusDef && statusDef.tags && statusDef.tags.includes('ai_override')) {
      return true;
    }
  }
  return false;
}

// ========================
// Item Selection & Targeting System
// ========================

// Track the currently selected item for target selection
let selectedItemId = null;
let selectedItemDef = null;
let targetSelectionActive = false;

/**
 * Show the item selection panel with available combat items.
 */
function showItemSelection() {
  const panel = document.getElementById('item-selection');
  const list = document.getElementById('item-list');
  if (!panel || !list) return;
  
  // Get usable items from the unified item system
  const usableItems = getUsableItemsForContext('combat');
  
  if (!usableItems || usableItems.length === 0) {
    log('No usable items in your inventory.');
    return;
  }
  
  list.innerHTML = '';
  usableItems.forEach(({ itemId, quantity, def }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.itemId = itemId;
    button.textContent = `${def.name} (${quantity})`;
    
    // Add target type indicator class
    if (def.targetType === 'enemy' || def.targetType === 'all_enemies') {
      button.classList.add('target-enemy');
    } else if (def.targetType === 'ally' || def.targetType === 'self' || def.targetType === 'party') {
      button.classList.add('target-ally');
    }
    
    // Add hover events for tooltip
    button.addEventListener('mouseenter', (e) => showItemTooltip(def, e));
    button.addEventListener('mousemove', (e) => moveItemTooltip(e));
    button.addEventListener('mouseleave', hideItemTooltip);
    
    // Click to select item
    button.addEventListener('click', () => handleItemSelection(itemId, def));
    list.appendChild(button);
  });
  
  panel.classList.add('visible');
  itemSelectionOpen = true;
}

/**
 * Hide the item selection panel.
 */
function hideItemSelection() {
  const panel = document.getElementById('item-selection');
  if (!panel) return;
  panel.classList.remove('visible');
  itemSelectionOpen = false;
  hideItemTooltip();
}

/**
 * Show tooltip with item details on hover.
 */
function showItemTooltip(itemDef, event) {
  const tooltip = document.getElementById('item-tooltip');
  if (!tooltip || !itemDef) return;
  
  // Set tooltip content
  const imgEl = document.getElementById('tooltip-image');
  const nameEl = document.getElementById('tooltip-name');
  const descEl = document.getElementById('tooltip-description');
  const effectsEl = document.getElementById('tooltip-effects');
  
  if (imgEl) {
    imgEl.src = itemDef.image || './assets/img/item_portrait/place_holder.png';
    imgEl.alt = itemDef.name;
  }
  if (nameEl) nameEl.textContent = itemDef.name;
  if (descEl) descEl.textContent = itemDef.description || '';
  
  // Build effects text
  if (effectsEl && itemDef.effects) {
    const effectTexts = itemDef.effects.map(effect => {
      switch (effect.kind) {
        case 'hp':
          return `${effect.mode === 'heal' ? '❤️ Heals' : '💔 Damages'}: ${effect.dice || effect.amount}`;
        case 'sanity':
          return `${effect.mode === 'heal' ? '🧠 Restores' : '😵 Drains'}: ${effect.dice || effect.amount} Sanity`;
        case 'cure_status':
          return `✨ Cures: ${effect.status}`;
        case 'buff':
          return `⬆️ +${effect.dice || effect.amount} ${effect.stat} (${effect.duration} turns)`;
        case 'barrier':
          return `🛡️ Barrier (${effect.duration} turns)`;
        case 'weapon_coating':
          return `🗡️ ${effect.coatingType} coating (${effect.duration} turns)`;
        case 'immobilize':
          return `⛓️ Immobilize (${effect.duration} turns)`;
        case 'confusion':
          return `🌀 Confuse (${effect.duration} turns)`;
        case 'rest':
          return `💤 Full party rest`;
        default:
          return '';
      }
    }).filter(Boolean);
    effectsEl.innerHTML = effectTexts.join('<br>');
  }
  
  // Position and show tooltip
  tooltip.classList.add('visible');
  moveItemTooltip(event);
}

/**
 * Move tooltip to follow mouse cursor.
 */
function moveItemTooltip(event) {
  const tooltip = document.getElementById('item-tooltip');
  if (!tooltip) return;
  
  const offset = 15;
  let x = event.clientX + offset;
  let y = event.clientY + offset;
  
  // Keep tooltip on screen
  const rect = tooltip.getBoundingClientRect();
  if (x + rect.width > window.innerWidth) {
    x = event.clientX - rect.width - offset;
  }
  if (y + rect.height > window.innerHeight) {
    y = event.clientY - rect.height - offset;
  }
  
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

/**
 * Hide the item tooltip.
 */
function hideItemTooltip() {
  const tooltip = document.getElementById('item-tooltip');
  if (tooltip) {
    tooltip.classList.remove('visible');
  }
}

/**
 * Handle item selection - either apply immediately (self) or start target selection.
 */
function handleItemSelection(itemId, itemDef) {
  if (!itemId || !itemDef) return;
  
  hideItemTooltip();
  
  const targetType = itemDef.targetType || 'self';
  
  // Self-targeting items apply immediately
  if (targetType === 'self') {
    applyItemToTarget(itemId, player);
    return;
  }
  
  // Party-targeting items apply to all allies at once
  if (targetType === 'party') {
    // In combat, party items typically shouldn't be usable, but handle gracefully
    applyItemToTarget(itemId, player); // Apply to player as fallback
    return;
  }
  
  // Store selected item and start target selection
  selectedItemId = itemId;
  selectedItemDef = itemDef;
  
  // Hide item panel, show target selection prompt
  hideItemSelection();
  startTargetSelection(targetType);
}

/**
 * Start the target selection mode - highlight valid targets.
 */
function startTargetSelection(targetType) {
  targetSelectionActive = true;
  
  // Show target selection prompt
  const targetPanel = document.getElementById('target-selection');
  const targetPrompt = document.getElementById('target-selection-prompt');
  if (targetPanel) {
    targetPanel.classList.add('visible');
  }
  if (targetPrompt) {
    if (targetType === 'enemy' || targetType === 'all_enemies') {
      targetPrompt.textContent = 'Select an enemy target:';
    } else {
      targetPrompt.textContent = 'Select an ally to target:';
    }
  }
  
  // Highlight valid targets based on target type
  if (targetType === 'ally') {
    highlightAllyTargets();
  } else if (targetType === 'enemy') {
    highlightEnemyTargets();
  } else if (targetType === 'all_enemies') {
    highlightAllEnemyTargets();
  }
  
  // Add click listeners to targetable portraits
  addTargetClickListeners();
}

/**
 * Highlight ally portraits (player and companion) as targetable.
 */
function highlightAllyTargets() {
  const playerPortrait = document.getElementById('player-portrait');
  const allyPortrait = document.getElementById('ally-portrait');
  
  if (playerPortrait && player.alive) {
    playerPortrait.classList.add('targetable', 'target-ally');
    playerPortrait.dataset.targetType = 'player';
  }
  if (allyPortrait && companion.alive) {
    allyPortrait.classList.add('targetable', 'target-ally');
    allyPortrait.dataset.targetType = 'companion';
  }
}

/**
 * Highlight enemy portraits as targetable.
 */
function highlightEnemyTargets() {
  const livingEnemies = getLivingEnemies();
  livingEnemies.forEach((enemy, index) => {
    const actualIndex = enemies.indexOf(enemy);
    const portrait = document.getElementById(`enemy-portrait-${actualIndex}`);
    if (portrait) {
      portrait.classList.add('targetable', 'target-enemy');
      portrait.dataset.targetType = 'enemy';
      portrait.dataset.enemyIndex = actualIndex;
    }
  });
}

/**
 * Highlight all enemy portraits for mass-targeting items.
 */
function highlightAllEnemyTargets() {
  const livingEnemies = getLivingEnemies();
  livingEnemies.forEach((enemy, index) => {
    const actualIndex = enemies.indexOf(enemy);
    const portrait = document.getElementById(`enemy-portrait-${actualIndex}`);
    if (portrait) {
      portrait.classList.add('targetable', 'target-party');
      portrait.dataset.targetType = 'all_enemies';
      portrait.dataset.enemyIndex = actualIndex;
    }
  });
}

/**
 * Add click listeners to all targetable portraits.
 */
function addTargetClickListeners() {
  document.querySelectorAll('.portrait.targetable').forEach(portrait => {
    portrait.addEventListener('click', handleTargetClick);
  });
}

/**
 * Handle clicking on a target portrait.
 */
function handleTargetClick(event) {
  const portrait = event.currentTarget;
  const targetType = portrait.dataset.targetType;
  
  // Handle action targeting
  if (pendingAction && targetSelectionMode) {
    let target = null;
    
    if (targetType === 'player') {
      target = player;
    } else if (targetType === 'companion') {
      target = companion;
    } else if (targetType === 'enemy') {
      const enemyIndex = parseInt(portrait.dataset.enemyIndex, 10);
      target = enemies[enemyIndex];
    } else if (targetType === 'summon') {
      const summonId = portrait.dataset.summonId;
      target = summonedNPCs.find(s => s.id === summonId);
    }
    
    if (target) {
      const actionId = pendingAction.actionId;
      cancelTargetSelection();
      const result = executePlayerAction(actionId, target);
      if (result) completePlayerAction(result);
    }
    return;
  }
  
  // Handle item targeting
  if (!targetSelectionActive || !selectedItemId) return;
  
  let target = null;
  
  if (targetType === 'player') {
    target = player;
  } else if (targetType === 'companion') {
    target = companion;
  } else if (targetType === 'enemy' || targetType === 'all_enemies') {
    const enemyIndex = parseInt(portrait.dataset.enemyIndex, 10);
    target = enemies[enemyIndex];
  }
  
  if (target) {
    // For all_enemies, we apply to all living enemies
    if (targetType === 'all_enemies') {
      const livingEnemies = getLivingEnemies();
      livingEnemies.forEach(enemy => {
        applyItemToTarget(selectedItemId, enemy, false); // Don't complete action yet
      });
      // Complete action after applying to all
      finishItemUse();
    } else {
      applyItemToTarget(selectedItemId, target);
    }
  }
}

/**
 * Apply the selected item to the chosen target.
 */
function applyItemToTarget(itemId, target, completeAction = true) {
  // Build game state for the item system
  const currentGameState = {
    player: player,
    companion: companion,
    enemies: enemies
  };
  
  // Use the unified item system
  const result = handleCombatItemUse(itemId, target, currentGameState, log);
  
  if (result.success) {
    // Play potion/item sound
    potion_sound?.play().catch(() => {});
    
    if (completeAction) {
      finishItemUse();
    }
  } else {
    log('Cannot use that item right now.');
    cancelTargetSelection();
  }
}

/**
 * Clean up after item use and proceed with combat.
 */
function finishItemUse() {
  cancelTargetSelection();
  hideItemSelection();
  updateUI();
  completePlayerAction();
}

/**
 * Cancel target selection mode and clean up.
 */
function cancelTargetSelection() {
  targetSelectionActive = false;
  selectedItemId = null;
  selectedItemDef = null;
  pendingActionId = null;
  pendingAction = null;
  targetSelectionMode = false;
  
  // Hide target selection prompt
  const targetPanel = document.getElementById('target-selection');
  if (targetPanel) {
    targetPanel.classList.remove('visible');
  }
  
  // Remove targetable classes and listeners from all portraits
  document.querySelectorAll('.portrait.targetable').forEach(portrait => {
    portrait.classList.remove('targetable', 'target-ally', 'target-enemy', 'target-party');
    portrait.removeEventListener('click', handleTargetClick);
    delete portrait.dataset.targetType;
    delete portrait.dataset.enemyIndex;
    delete portrait.dataset.summonId;
  });
}

/**
 * Cancel all item-related UI (called on right-click).
 */
function cancelItemAction() {
  if (targetSelectionActive) {
    cancelTargetSelection();
    // Go back to item selection
    showItemSelection();
  } else if (itemSelectionOpen) {
    hideItemSelection();
  }
}

/**
 * Set up right-click to cancel item/target selection.
 */
function setupRightClickCancel() {
  document.addEventListener('contextmenu', (event) => {
    if (targetSelectionActive || itemSelectionOpen) {
      event.preventDefault();
      cancelItemAction();
    }
  });
}

// Initialize right-click cancel on page load
document.addEventListener('DOMContentLoaded', setupRightClickCancel);

// 
// Helper function to play a random sound from an array
function playRandomSound(soundArray) {
  if (!soundArray || soundArray.length === 0) return;
  const randomIndex = Math.floor(Math.random() * soundArray.length);
  soundArray[randomIndex].play().catch(e => console.log("Sound error:", e));
}

// ========================
// Initial Setup
// ========================
// Wait for the DOM to load, then wire up the combat start overlay/button.
document.addEventListener("DOMContentLoaded", () => {
  setupCombatStartOverlay();
  setupItemSelectionUI();
  checkExplorationParams();
});

// Check if coming from exploration mode
function checkExplorationParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const fromExploration = urlParams.get('fromExploration') === 'true';
  const enemyId = urlParams.get('enemy');
  
  if (fromExploration && enemyId) {
    console.log(`[Combat] Initiated from exploration with enemy: ${enemyId}`);
    // Store the enemy ID for loadCombatData to use
    window.explorationCombatEnemy = enemyId;
    window.fromExploration = true;
  }
}

function setupCombatStartOverlay() {
  const startButton = document.getElementById('start-combat-button');
  const overlay = document.getElementById('combat-start-overlay');
  if (!startButton) {
    loadCombatData();
    return;
  }
  startButton.addEventListener('click', async () => {
    if (combatInitialized) return;
    combatInitialized = true;
    startButton.disabled = true;
    await unlockAudioPlayback();
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      setTimeout(() => overlay.remove(), 400);
    }
    loadCombatData();
  });
}

function setupItemSelectionUI() {
  const cancelButton = document.getElementById('cancel-item-selection');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      hideItemSelection();
    });
  }
}

function getExplorationCombatState() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  const stored = sessionStorage.getItem('explorationCombat');
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (err) {
    console.warn('[Combat] Failed to parse exploration combat payload:', err);
    return null;
  }
}

function applyExplorationOverrides(baseConfig, partyState) {
  if (!partyState) {
    return baseConfig;
  }

  const merged = { ...baseConfig };
  merged.character_file = merged.character_file || 'characters.json';

  if (partyState.name) merged.name = partyState.name;
  if (partyState.gender) merged.gender = partyState.gender;
  if (partyState.classId || partyState.character_id) {
    merged.character_id = partyState.classId || partyState.character_id;
  }
  if (partyState.level != null) merged.level = partyState.level;
  if (partyState.xp != null) merged.xp = partyState.xp;
  if (partyState.xpToNextLevel != null) merged.xpToNextLevel = partyState.xpToNextLevel;
  if (partyState.portrait) merged.portrait = partyState.portrait;

  return merged;
}


// ========================
// Data Loading Function
// ========================
// This async function fetches multiple external JSON files:
//  - player.json
//  - companion.json
//  - enemies.json
//  - combat_encounter.json
// After fetching all data, it sets up the user interface and starts combat.
async function loadCombatData() {
  try {
    // Load abilities and status effects for the combat system
    await loadAbilitiesAndEffects();
    
    // Load item database for the unified item system
    await loadItemDatabase('./inventory.json');
    
    // Load summon templates for scroll items
    await loadSummonTemplates();
    
    const explorationCombatState = getExplorationCombatState();

    // Initialize inventory state with starting items (can be loaded from save later)
    const defaultInventorySeed = (typeof window !== 'undefined' && window.initialInventoryState)
      ? cloneData(window.initialInventoryState)
      : {
          vial_vital_humours: 2,
          tincture_of_lucidity: 1,
          herbal_tonic: 3
        };
    const inventorySeed = explorationCombatState?.inventory
      ? cloneData(explorationCombatState.inventory)
      : defaultInventorySeed;
    initInventoryState(inventorySeed || {});
    
    // Load inventory definitions used to hydrate party inventories (legacy support)
    const inventoryRes = await fetch('inventory.json');
    const inventoryRaw = await inventoryRes.json();
    inventoryCatalog = normalizeInventoryCatalog(inventoryRaw);

    // 1) Load player data
    const playerRes = await fetch('player.json'); // Fetch local file
    const rawPlayerConfig = await playerRes.json();  // Convert the response to JS object
    const playerConfig = applyExplorationOverrides(rawPlayerConfig, explorationCombatState?.player);
    player = await hydratePartyMember(playerConfig);
    player.alive = player.hp > 0;                 // Mark player as alive if HP > 0
    renderActionButtons(player.actions);
    
    // 2) Load companion data
    const companionRes = await fetch('companion.json');
    const rawCompanionConfig = await companionRes.json();
    const companionConfig = applyExplorationOverrides(rawCompanionConfig, explorationCombatState?.companion);
    companion = await hydratePartyMember(companionConfig);
    companion.alive = companion.hp > 0;           // Mark companion as alive if HP > 0
    
    // 3) Load the enemy templates file
    const enemyDataRes = await fetch('enemies.json');
    const enemyData = await enemyDataRes.json();
    
    console.log("Enemy templates loaded:", JSON.stringify(enemyData.enemies));
    
    // 4) Load encounter definition or use exploration enemy
    //    - Tells us which enemies appear, their positions, and the background
    let encounter;
    
    if (window.fromExploration && window.explorationCombatEnemy) {
      // Create encounter from exploration enemy
      const explorationEnemy = window.explorationCombatEnemy;
      console.log(`[Combat] Creating exploration encounter for: ${explorationEnemy}`);
      
      encounter = {
        encounter_name: "Exploration Encounter",
        background: 'assets/img/environment/dungeon1.png',
        enemies: [{ id: explorationEnemy, position: 1 }]
      };
      
      // Load saved party state from exploration if available
      const expState = explorationCombatState;
      if (expState) {
        // Apply exploration HP/sanity to combat
        if (expState.player) {
          player.hp = Math.max(1, expState.player.hp);
          player.sanity = Math.max(0, expState.player.sanity);
        }
        if (expState.companion) {
          companion.hp = Math.max(1, expState.companion.hp);
          companion.sanity = Math.max(0, expState.companion.sanity);
        }
        console.log(`[Combat] Applied exploration state - Player HP: ${player.hp}, Sanity: ${player.sanity}`);
      }
    } else {
      // Standard encounter from file
      const encRes = await fetch('combat_encounter.json');
      encounter = await encRes.json();
    }
    
    // If the encounter JSON has a background or encounter name, set them here
    battleBackground = encounter.background || 'combat';
    document.getElementById('encounter-title').textContent =
      encounter.encounter_name || "Unknown Encounter";
    
    // Clear the existing enemies array
    enemies = [];
    
    // Build a new array with the enemies that appear in this encounter
    encounter.enemies.forEach(slot => {
      // Find the template for this enemy type
      const template = enemyData.enemies.find(e => e.id === slot.id);
      
      if (!template) {
        console.error(`Enemy template not found for id: ${slot.id}`);
        return;
      }
      
      // Extract base_stats (new format) or fall back to legacy flat properties
      const baseStats = template.base_stats || {};
      const hp = baseStats.hp ?? template.hp ?? 10;
      const init = baseStats.init ?? template.init ?? 5;
      const sanityDamage = baseStats.sanity_damage ?? template.sanityDamage ?? 0;
      const defense = baseStats.defense ?? template.defense ?? 0;
      const basicAttack = baseStats.basic_attack ?? template.basic_attack ?? null;
      
      // Create a completely new object based on the template
      const enemyInstance = {
        id: template.id,
        name: template.name,
        gender: template.gender || 'o', // Include gender, default to other/monster if not specified
        hp: hp,
        maxHp: hp,
        basic_attack: basicAttack,
        sanityDamage: sanityDamage,
        defense: defense,
        init: init,
        xp_reward: template.xp_reward ?? 0,
        enemy_hit_sound: template.enemy_hit_sound || null,
        enemy_death_sound: template.enemy_death_sound || null,
        audio: template.audio ? { ...template.audio } : {},
        alive: true,
        position: slot.position
      };
      
      console.log(`Created enemy: ${enemyInstance.name} with HP: ${enemyInstance.hp}, basic_attack:`, basicAttack);
      enemies.push(enemyInstance);
    });
    
    console.log("Final enemies array:", JSON.stringify(enemies));
    
    // Now that we have all data (player, companion, enemies), we build the UI:
    //  - Generate enemy cards (on-screen portraits)
    //  - Set up turn order by initiative
    //  - Render the initial UI state
    generateEnemyCards();
    setupTurnOrder();
    updateUI();
    // Start combat music and sequenced audio, which will call nextTurn after delays
    startCombatMusic();
  } catch (err) {
    console.error("Error loading data:", err);
  }
}


// ========================
// Setting up Turn Order
// ========================
// We combine player, companion, and enemies into a single list 'combatants',
// then sort them based on initiative. This will control who goes first.
function setupTurnOrder() {
  // Make sure we only include enemies that are alive and have HP > 0
  enemies = enemies.filter(e => e.hp > 0 && e.alive !== false);
  const activeSummons = summonedNPCs.filter(s => s.alive);
  
  // Build array with all combatants:
  //  1) Player object with type 'player'
  //  2) Companion object with type 'companion'
  //  3) Active summons
  //  4) Each enemy (mapped to type 'enemy')
  combatants = [
    { type: 'player', data: player },
    { type: 'companion', data: companion },
    ...activeSummons.map(s => ({ type: 'summon', data: s })),
    ...enemies.map(e => ({ type: 'enemy', data: e }))
  ];
  
  // For each combatant, add a random modifier (±3) to their base initiative
  combatants.forEach(c => {
    // Store the base initiative for reference
    c.baseInit = c.data.init || 0;
    // Calculate a new initiative roll with randomness
    c.rollInit = c.baseInit + (Math.floor(Math.random() * 7) - 3); // -3 to +3 random modifier
    console.log(`${c.type} ${c.data.name || ''}: Base init ${c.baseInit}, rolled ${c.rollInit}`);
  });
  
  // Sort in descending order of rolled initiative: higher initiative goes earlier in the turn order
  combatants.sort((a, b) => b.rollInit - a.rollInit);
  
  // Start at the first combatant (index 0) in the sorted array
  currentTurn = 0;
  
  // Log the turn order for debugging
  console.log("Combat turn order:", 
    combatants.map(c => `${c.type}: ${c.data.name || 'unnamed'} (base init: ${c.baseInit}, roll: ${c.rollInit})`));
  
  // Begin the first round of combat
  startRound();
}


// ========================
// Starting the Combat Round
// ========================
// Logs the beginning of combat, then triggers 'nextTurn()' to handle the first turn.
function startRound() {
  log("--- New Round ---");
  
  // Re-roll initiative for a new round
  combatants.forEach(c => {
    c.baseInit = c.data.init || 0;
    c.rollInit = c.baseInit + (Math.floor(Math.random() * 7) - 3); // -3 to +3 random modifier
  });
  
  // Sort by the new initiative rolls
  combatants.sort((a, b) => b.rollInit - a.rollInit);
  
  // Log the new turn order
  const initiativeOrder = combatants.map(c => {
    const name = c.data.name || (c.type === 'player' ? 'You' : c.type === 'companion' ? 'Ally' : 'Enemy');
    return `${name} (${c.rollInit})`;
  }).join(', ');
  
  log(`Initiative order: ${initiativeOrder}`);
  
  // Reset to the first combatant
  currentTurn = -1; // Will be incremented to 0 in nextTurn()
  // nextTurn is now called after audio sequencing from startCombatMusic
}


// ========================
// Progress to Next Turn
// ========================
// This function increments currentTurn and decides who acts next (player, companion, or enemy).
function nextTurn() {
  // Make sure we're not trying to advance turns after combat has ended
  if (combatEnded) {
    console.log("Combat already ended, not advancing turns");
    return;
  }
  
  // Check for victory condition before proceeding
  if (!enemies.some(e => e.alive !== false && e.hp > 0)) {
    console.log("No living enemies found at start of nextTurn, triggering victory");
    handleVictory();
    return;
  }
  
  // Advance to the next combatant
  currentTurn++;
  
  // If we reach the end of the array, loop back to 0
  if (currentTurn >= combatants.length) currentTurn = 0;
  
  // Get the current combatant
  const current = combatants[currentTurn];
  
  // If there's no valid combatant, attempt to rebuild the list and exit
  if (!current) {
    console.error("No valid combatant found for turn " + currentTurn);
    rebuildCombatants();
    return setTimeout(nextTurn, 500);
  }
  
  // For enemies, ensure they're still valid
  if (current.type === 'enemy' && (!current.data.alive || current.data.hp <= 0)) {
    console.log(`Found defeated enemy in turn queue: ${current.data.name}, skipping turn`);
    // Rebuild combatants to ensure defeated enemies are removed
    rebuildCombatants();
    return setTimeout(nextTurn, 500);
  }
  
  // Process status effects at the start of this combatant's turn (DoT, HoT, duration ticks)
  processStatusEffects(current.data);
  
  // Check if the combatant died from status effects (e.g., poison)
  if (current.data.hp <= 0) {
    if (current.type === 'enemy') {
      if (current.data.alive !== false) {
        current.data.alive = false;
        const enemyIndex = enemies.indexOf(current.data);
        animateEnemyDeath(current.data, enemyIndex);
      }
      log(`${current.data.name} succumbs to their afflictions!`);
      rebuildCombatants();
      updateUI();
      checkEnemyStatus();
      return setTimeout(nextTurn, 1000);
    } else if (current.type === 'player' || current.type === 'companion') {
      if (current.data.alive !== false) {
        current.data.alive = false;
        const cardId = current.type === 'player' ? 'player-portrait' : 'ally-portrait';
        animateAllyDeath(cardId);
      }
      log(`${current.data.name || 'A party member'} falls!`);
      updateUI();
      checkLossCondition();
      return;
    }
  }
  
  // Check if the combatant is stunned
  if (isStunned(current.data)) {
    log(`${current.data.name || 'Someone'} is stunned and cannot act!`);
    updateUI();
    return setTimeout(nextTurn, 1500);
  }
  
  // Update UI before the current combatant acts
  updateUI();
  
  // Decide actions based on the combatant 'type'
  if (current.type === 'player') {
    // Check if player is charmed (hypnotized)
    if (isCharmed(current.data)) {
      // Charmed player attacks party or summons
      disableActions();
      log("You are hypnotised and strike your allies!");
      setTimeout(() => {
        handleCharmedAllyTurn(current.data);
      }, 1000);
      return;
    }
    activeControlledCharacter = 'player';
    log("Your turn! Choose an action...");
    enableActions(); // Allows user to click Attack / Defend / etc.
  } else if (current.type === 'companion') {
    // Check if companion is charmed (hypnotized)
    if (isCharmed(current.data)) {
      // Charmed ally attacks party or summons
      disableActions();
      log(`${current.data.name} is hypnotised and attacks allies!`);
      setTimeout(() => {
        handleCharmedAllyTurn(current.data);
      }, 1000);
      return;
    }
    // Companion is now player-controlled (not AI)
    // Check if companion is actually alive
    if (!companion.alive || companion.hp <= 0) {
      log(`${companion.name || "Companion"} is incapacitated and skips their turn.`);
      return setTimeout(nextTurn, 1000);
    }
    activeControlledCharacter = 'companion';
    log(`${companion.name}'s turn! Choose an action...`);
    enableActions(); // Player controls the companion too
  } else if (current.type === 'summon') {
    disableActions(); // Hide player controls
    // AI-controlled summoned NPC
    if (!current.data.alive || current.data.hp <= 0) {
      log(`${current.data.name || "Summon"} has faded and skips their turn.`);
      return setTimeout(nextTurn, 1000);
    }
    // Wait 1 second, then let the summon AI act
    setTimeout(() => summonedNPCTurn(current.data), 1000);
  } else if (current.type === 'enemy') {
    disableActions(); // Hide player controls
    // Pass 'current.data' (the actual enemy object) to the enemyTurn function
    setTimeout(() => enemyTurn(current.data), 1000);
  }
}

// ========================
// Update the User Interface
// ========================
// This function updates the on-screen elements (portraits, stats, backgrounds, etc.)
function updateUI() {  // Change the background image based on 'battleBackground'
  const backdrop = document.getElementById('backdrop');
  backdrop.className = ''; // Reset any previous classes
  
  // Check if the background path is a direct image path or a class name
  if (battleBackground && battleBackground.includes('/')) {
    // It's a direct path to an image, use it as inline style
    backdrop.style.backgroundImage = `url('${battleBackground}')`;
  } else {
    // It's a class name (like 'combat'), add it as a class
    backdrop.classList.add(`${battleBackground}-bg`);
  }
  
  // Update sanity state based on current player sanity
  updateSanityState();
  
  // Update player info (include level if > 0)
  const playerLevelText = player.level > 0 ? ` (Lv.${player.level})` : '';
  document.getElementById('player-name').textContent = (player.name || "Cryptonaut") + playerLevelText;
  document.getElementById('player-hp').textContent = player.hp;
  document.getElementById('player-sanity').textContent = player.sanity;
  const playerImg = document.querySelector('#player-portrait img');
  const playerCard = document.getElementById('player-portrait');
  const playerDeathAnim = playerCard?.dataset.deathAnimating === 'running';
  if (playerCard) {
    if (player.alive) {
      resetDeathCardState(playerCard, player.portrait);
    }
    playerCard.style.display = (!player.alive && !playerDeathAnim) ? 'none' : 'block';
  }
  if (playerImg && player.portrait) {
    if (!playerDeathAnim) {
      playerImg.src = player.portrait;
    }
    playerImg.alt = player.name || 'Player';
  }
  
  // Update companion info (include level if > 0)
  const companionLevelText = companion.level > 0 ? ` (Lv.${companion.level})` : '';
  document.getElementById('companion-name').textContent = (companion.name || "Companion") + companionLevelText;
  document.getElementById('ally-hp').textContent = companion.hp;
  document.getElementById('ally-sanity').textContent = companion.sanity;
  const companionImg = document.querySelector('#ally-portrait img');
  const companionCard = document.getElementById('ally-portrait');
  const companionDeathAnim = companionCard?.dataset.deathAnimating === 'running';
  if (companionCard) {
    if (companion.alive) {
      resetDeathCardState(companionCard, companion.portrait);
    }
    companionCard.style.display = (!companion.alive && !companionDeathAnim) ? 'none' : 'block';
  }
  if (companionImg && companion.portrait) {
    if (!companionDeathAnim) {
      companionImg.src = companion.portrait;
    }
    companionImg.alt = companion.name || 'Ally';
  }
  
  // Get all enemy portrait elements
  const enemyPortraits = document.querySelectorAll('.portrait.enemy');
  
  // First, hide all enemy portraits
  enemyPortraits.forEach(portrait => {
    portrait.style.display = 'none';
  });
    // Then, only show the ones that correspond to living enemies
  enemies.forEach((enemy, i) => {
    const cardId = enemy.cardElementId || `enemy-portrait-${i}`;
    const card = document.getElementById(cardId);
    const hpSpan = document.getElementById(`enemy-hp-${i}`);
    if (card && hpSpan) {
      // Force the HP display text to update with current enemy HP value
      hpSpan.textContent = `${enemy.hp}`;
      
      const isAlive = enemy.alive !== false && enemy.hp > 0;
      const deathAnim = card.dataset.deathAnimating === 'running';
      const portraitSrc = enemy.portrait || `assets/img/enemy_portrait/${enemy.id}.png`;
      if (isAlive && !deathAnim) {
        resetDeathCardState(card, portraitSrc);
      }
      card.style.display = (isAlive || deathAnim) ? 'block' : 'none';
      if (!deathAnim) {
        const img = card.querySelector('img');
        if (img && img.src !== portraitSrc) {
          img.src = portraitSrc;
        }
      }
      
      // Debug logging to track enemy HP updates in UI
      console.log(`Enemy ${enemy.name} (index ${i}): HP=${enemy.hp}, alive=${enemy.alive}, display=${card.style.display}, element text=${hpSpan.textContent}`);
    }
  });
  
  // Remove previous highlights
  document.querySelectorAll('.portrait').forEach(card => {
    card.classList.remove('active-turn');
  });
  
  // Highlight whose turn it is
  if (combatants.length > 0 && currentTurn >= 0 && currentTurn < combatants.length) {
    const current = combatants[currentTurn];
    if (!current) return;
    if (current.type === 'player') {
      document.getElementById('player-portrait').classList.add('active-turn');
    } else if (current.type === 'companion') {
      document.getElementById('ally-portrait').classList.add('active-turn');
    } else if (current.type === 'enemy') {
      // Find which enemy in the 'enemies' array matches the current data
      const ix = enemies.findIndex(e => e === current.data);
      // Add 'active-turn' to that portrait if found
      if (ix >= 0) {
        document.getElementById(`enemy-portrait-${ix}`).classList.add('active-turn');
      }
    } else if (current.type === 'summon') {
      const summonCard = document.getElementById(`summon-portrait-${current.data.id}`);
      if (summonCard) {
        summonCard.classList.add('active-turn');
      }
    }
  }
  
  // Update summon UI
  updateSummonUI();
}

// ========================
// Generating Enemy Portrait Cards
// ========================
// Called once the enemies array is built, this function creates HTML elements for each enemy.
function generateEnemyCards() {
  const enemyArea = document.getElementById("enemy-area");
  if (!enemyArea) return; // If there's no element for enemies, exit
  
  // Clear any existing enemy cards
  enemyArea.innerHTML = ''; 
  
  // Create a .portrait element for each enemy
  enemies.forEach((enemy, i) => {
    const card = document.createElement('div');
    card.className = 'portrait enemy';
    card.id = `enemy-portrait-${i}`;
    
    // Add a data attribute to track which enemy this is
    card.dataset.enemyId = enemy.id;
    card.dataset.enemyIndex = i;
    
    const portraitPath = enemy.portrait || `assets/img/enemy_portrait/${enemy.id}.png`;
    // The ID is used elsewhere for updating HP, etc.
    card.innerHTML = `
      <img src="${portraitPath}" alt="${enemy.name}">
      <div class="stats">
        <div class="character-name"><span>${enemy.name}</span></div>
        <div>HP: <span id="enemy-hp-${i}">${enemy.hp}</span></div>
      </div>
    `;
    
    // Only show the card if the enemy is alive
    card.style.display = enemy.alive !== false && enemy.hp > 0 ? 'block' : 'none';
    
    // Add click handler for target selection
    card.addEventListener('click', () => {
      handlePortraitClick({ type: 'enemy', data: enemy, index: i });
    });
    
    // Append the card to the enemy area in the DOM
    enemyArea.appendChild(card);
    const img = card.querySelector('img');
    if (img) {
      img.dataset.originalSrc = portraitPath;
    }
    enemy.cardElementId = card.id;
    
    console.log(`Generated card for ${enemy.name} (id: ${enemy.id}) with HP: ${enemy.hp}, alive: ${enemy.alive}`);
  });
}

// ========================
// Summoned NPC (AI-Controlled) Turn
// ========================
// This function handles AI-controlled summoned NPCs.
// The old companion AI logic is preserved here for summons.
function summonedNPCTurn(summon) {
  if (!summon || !summon.alive || summon.hp <= 0) {
    console.log(`Summon ${summon?.name || 'unknown'} is not available to act`);
    setTimeout(nextTurn, 500);
    return;
  }
  
  // Before summon acts, clean up enemies array to ensure we don't target defeated enemies
  const initialEnemyCount = enemies.length;
  enemies = enemies.filter(e => e.alive !== false && e.hp > 0);
  
  if (initialEnemyCount !== enemies.length) {
    console.log(`Summon turn: Filtered out ${initialEnemyCount - enemies.length} defeated enemies`);
  }
  
  // If there are no enemies left, trigger victory and exit
  if (!enemies.length || !enemies.some(e => e.alive !== false && e.hp > 0)) {
    console.log("Summon found no valid enemies, triggering victory");
    handleVictory();
    return;
  }
  
  // First filter to get only valid targets (alive enemies with HP > 0)
  const validTargets = enemies.filter(e => e.alive !== false && e.hp > 0);
  
  // Additional sanity check to make sure we have targets
  if (!validTargets.length) {
    console.log("No valid targets for summon after filtering");
    handleVictory();
    return;
  }
  
  console.log(`${summon.name} found ${validTargets.length} valid targets`);
  
  // Determine target based on AI behavior
  let targetEnemy;
  const aiBehavior = summon.ai_behavior || 'attack_weakest';
  
  switch (aiBehavior) {
    case 'attack_strongest':
      targetEnemy = [...validTargets].sort((a, b) => b.hp - a.hp)[0];
      break;
    case 'support_heal': {
      const friendlyTargets = [player, companion, ...(summonedNPCs || [])]
        .filter(ally => ally && ally.alive !== false && ally.hp > 0);

      if (!friendlyTargets.length) {
        log(`${summon.name} finds no allies to mend.`);
        setTimeout(nextTurn, 1000);
        return;
      }

      const ratio = (ally) => {
        const max = ally.maxHp || ally.hp || 1;
        return ally.hp / max;
      };

      const injuredTargets = friendlyTargets.filter(ally => ally.hp < (ally.maxHp || ally.hp));
      const prioritisedPool = injuredTargets.length ? injuredTargets : friendlyTargets;
      const healTarget = [...prioritisedPool].sort((a, b) => ratio(a) - ratio(b))[0];

      if (!healTarget) {
        log(`${summon.name} waits for someone to heal.`);
        setTimeout(nextTurn, 1000);
        return;
      }

      const healAmt = Math.floor(Math.random() * (summon.support_power || 6) + 3);
      const maxHp = healTarget.maxHp || healTarget.hp + healAmt;
      const before = healTarget.hp;
      healTarget.hp = Math.min(maxHp, healTarget.hp + healAmt);
      const restored = healTarget.hp - before;
      const label = healTarget === player ? 'you' : (healTarget.name || 'an ally');
      if (restored > 0) {
        log(`${summon.name} bathes ${label} in light, restoring ${restored} HP!`);
      } else {
        log(`${summon.name}'s healing washes over ${label}, but there is no effect.`);
      }
      potion_sound.play().catch(e => console.log('Sound error:', e));

      saveGameState();
      updateUI();
      if (!combatEnded) {
        setTimeout(nextTurn, 2000);
      }
      return;
    }
    case 'attack_weakest':
    default:
      targetEnemy = [...validTargets].sort((a, b) => a.hp - b.hp)[0];
      break;
  }
  
  // Double-check that our target is actually valid before attacking
  if (!targetEnemy || targetEnemy.hp <= 0 || targetEnemy.alive === false) {
    console.log("Target enemy is invalid or already defeated - skipping summon attack");
    setTimeout(nextTurn, 1000);
    return;
  }
  
    // Attack the target
  const dmg = summon.basic_attack 
    ? rollFromDiceSpec(summon.basic_attack)
    : Math.floor(Math.random() * (summon.support_power || 6) + 3);
  const final = applyDamageToTarget(targetEnemy, dmg, 'physical');
  log(`${summon.name} attacks ${targetEnemy.name} for ${final} damage (${dmg} raw)!`);
  
  console.log(`After summon attack: ${targetEnemy.name}, HP: ${targetEnemy.hp}`);
  
  playAttackSound();
  
  const enemyIndex = enemies.indexOf(targetEnemy);
  if (enemyIndex >= 0) {
    updateEnemyHP(enemyIndex);
    flashDamage(`enemy-portrait-${enemyIndex}`);
  }
  
  updateUI();
  
  if (targetEnemy.hp <= 0) {
    if (targetEnemy.alive !== false) {
      targetEnemy.alive = false;
      animateEnemyDeath(targetEnemy, enemyIndex);
    }
    console.log(`Enemy defeated by summon: ${targetEnemy.name}`);
    setTimeout(() => {
        const deathSoundArray = getEnemyDeathSounds(targetEnemy);
      playRandomSound(deathSoundArray);
    }, 1000);
  } else {
    setTimeout(() => {
        const hurtSoundArray = getEnemyHurtSounds(targetEnemy);
      playRandomSound(hurtSoundArray);
    }, 1000);
  }
  
  if (checkEnemyStatus()) {
    return;
  }
  
  // Decrease summon duration
  if (summon.remainingDuration !== undefined) {
    summon.remainingDuration--;
    updateSummonUI();
    if (summon.remainingDuration <= 0) {
      summon.alive = false;
      log(`${summon.name} fades away...`);
      // Remove from combatants
      combatants = combatants.filter(c => c.data !== summon);
      summonedNPCs = summonedNPCs.filter(s => s !== summon);
      cleanupSummonUI();
    }
  }
  
  saveGameState();
  
  if (!combatEnded) {
    setTimeout(nextTurn, 2000);
  }
}

// ========================
// Summon System
// ========================

// Cache for loaded summon templates
let summonTemplates = null;

/**
 * Load summon templates from npc_summon.json
 */
async function loadSummonTemplates() {
  if (summonTemplates) return summonTemplates;
  
  try {
    const response = await fetch('npc_summon.json');
    if (!response.ok) {
      console.error('Failed to load summon templates');
      return null;
    }
    const data = await response.json();
    summonTemplates = data.summons || [];
    console.log('Summon templates loaded:', summonTemplates.length);
    return summonTemplates;
  } catch (err) {
    console.error('Error loading summon templates:', err);
    return null;
  }
}

/**
 * Spawn a summoned NPC into combat.
 * @param {string} summonId - The ID of the summon from npc_summon.json
 * @returns {Object} - Result { success, message, summon? }
 */
function spawnSummon(summonId) {
  if (!summonTemplates) {
    return { success: false, message: 'Summon templates not loaded.' };
  }
  
  const template = summonTemplates.find(s => s.id === summonId);
  if (!template) {
    return { success: false, message: `Unknown summon: ${summonId}` };
  }
  
  // Check if we already have too many summons (limit to 2)
  if (summonedNPCs.length >= 2) {
    return { success: false, message: 'You cannot control more summons.' };
  }
  
  // Create the summon instance
  const baseStats = template.base_stats || {};
  const summonInstance = {
    id: template.id,
    name: template.name,
    class: template.class || 'Summon',
    hp: baseStats.hp || 10,
    maxHp: baseStats.hp || 10,
    sanity: baseStats.sanity || 5,
    maxSanity: baseStats.sanity || 5,
    basic_attack: baseStats.basic_attack || { dice: 1, sides: 4 },
    support_power: baseStats.support_power || 5,
    defense: baseStats.defense || 0,
    init: baseStats.init || 5,
    portrait: template.portrait || 'assets/img/ally_portrait/summon_npc.png',
    audio: template.audio || {},
    ai_behavior: template.ai_behavior || 'attack_weakest',
    remainingDuration: template.duration || 3,
    alive: true,
    isSummon: true
  };
  
  // Add to summonedNPCs array
  summonedNPCs.push(summonInstance);
  
  // Add to combatants list
  const newCombatant = { type: 'summon', data: summonInstance };
  newCombatant.baseInit = summonInstance.init;
  newCombatant.rollInit = summonInstance.init + (Math.floor(Math.random() * 7) - 3);
  combatants.push(newCombatant);
  
  // Re-sort combatants by initiative (summon joins the battle)
  combatants.sort((a, b) => b.rollInit - a.rollInit);
  
  // Generate UI card for the summon
  generateSummonCard(summonInstance);
  updateSummonUI();
  
  // Play summon sound effect
  summon_sound.currentTime = 0;
  summon_sound.play().catch(err => console.log('Summon sound error:', err));
  
  log(`${summonInstance.name} appears to aid you! (${summonInstance.remainingDuration} turns)`);
  
  return { 
    success: true, 
    message: `${summonInstance.name} has been summoned!`,
    summon: summonInstance 
  };
}

/**
 * Generate a UI card for a summoned NPC
 */
function generateSummonCard(summon) {
  const summonArea = document.getElementById('summon-area');
  if (!summonArea) return;
  const cardId = `summon-portrait-${summon.id}`;
  const hpId = `summon-hp-${summon.id}`;
  const durationId = `summon-duration-${summon.id}`;
  const existingCard = document.getElementById(cardId);
  if (existingCard) {
    existingCard.remove();
  }
  
  const card = document.createElement('div');
  card.className = 'portrait summon';
  card.id = cardId;
  card.dataset.summonId = summon.id;
  
  card.innerHTML = `
    <img src="${summon.portrait}" alt="${summon.name}">
    <div class="stats">
      <div class="character-name"><span>${summon.name}</span></div>
      <div>HP: <span id="${hpId}">${summon.hp}</span></div>
      <div class="summon-duration">Turns: <span id="${durationId}">${summon.remainingDuration}</span></div>
    </div>
  `;
  card.dataset.summonId = summon.id;
  
  // Add click handler for target selection
  card.addEventListener('click', () => {
    handlePortraitClick({ type: 'summon', data: summon });
  });
  const img = card.querySelector('img');
  if (img) {
    img.dataset.originalSrc = summon.portrait;
  }
  
  summonArea.appendChild(card);
}

/**
 * Update summon UI cards
 */
function updateSummonUI() {
  summonedNPCs.forEach((summon) => {
    const card = document.getElementById(`summon-portrait-${summon.id}`);
    const hpSpan = document.getElementById(`summon-hp-${summon.id}`);
    const durationSpan = document.getElementById(`summon-duration-${summon.id}`);
    
    if (card) {
      const deathAnim = card.dataset.deathAnimating === 'running';
      if (summon.alive && !deathAnim) {
        resetDeathCardState(card, summon.portrait);
      }
      card.style.display = (summon.alive || deathAnim) ? 'block' : 'none';
    }
    if (hpSpan) {
      hpSpan.textContent = summon.hp;
    }
    if (durationSpan) {
      durationSpan.textContent = summon.remainingDuration;
    }
  });
}

/**
 * Remove expired or dead summons from UI
 */
function cleanupSummonUI() {
  const summonArea = document.getElementById('summon-area');
  if (!summonArea) return;
  
  // Remove cards for dead/expired summons
  summonArea.querySelectorAll('.portrait.summon').forEach(card => {
    const summonId = card.dataset.summonId;
    const activeSummon = summonedNPCs.find(s => s.id === summonId && s.alive);
    if (!activeSummon && card.dataset.deathAnimating !== 'running') {
      card.remove();
    }
  });
}

// Expose spawnSummon globally for the item system
if (typeof window !== 'undefined') {
  window.spawnSummon = spawnSummon;
}

// ========================
// Legacy Companion AI (kept for reference, now uses summonedNPCTurn)
// ========================
// This function was previously used for companion AI.
// Companion is now player-controlled. This is kept for backwards compatibility.
function companionTurn() {  
  // Before companion acts, clean up enemies array to ensure we don't target defeated enemies
  const initialEnemyCount = enemies.length;
  enemies = enemies.filter(e => e.alive !== false && e.hp > 0);
  
  if (initialEnemyCount !== enemies.length) {
    console.log(`Companion turn: Filtered out ${initialEnemyCount - enemies.length} defeated enemies`);
  }
  
  // If there are no enemies left, trigger victory and exit
  if (!enemies.length || !enemies.some(e => e.alive !== false && e.hp > 0)) {
    console.log("Companion found no valid enemies, triggering victory");
    handleVictory();
    return;
  }
  
  // First filter to get only valid targets (alive enemies with HP > 0)
  const validTargets = enemies.filter(e => e.alive !== false && e.hp > 0);
  
  // Additional sanity check to make sure we have targets
  if (!validTargets.length) {
    console.log("No valid targets for companion after filtering");
    handleVictory();
    return;
  }
  
  console.log(`Companion found ${validTargets.length} valid targets`);
  
  // Sort valid enemies to find the weakest one (example AI)
  const targetEnemy = [...validTargets].sort((a, b) => a.hp - b.hp)[0];
    // Check if the player or companion is in need of healing
  const playerLow = player.hp < (player.maxHp || 50) * 0.5;
  const companionLow = companion.hp < (companion.maxHp || 30) * 0.4;
  
  // If either is low, apply a heal
  if (playerLow || companionLow) {
    const healTarget = playerLow ? player : companion;
    const healAmt = Math.floor(Math.random() * (companion.support_power || 8) + 5);    healTarget.hp += healAmt;
    log(`${companion.name} heals ${healTarget === player ? "you" : companion.name} for ${healAmt} HP!`);
    // Play potion sound for healing
    potion_sound.play().catch(e => console.log("Sound error:", e));  } else {
    // Double-check that our target is actually valid before attacking
    if (!targetEnemy || targetEnemy.hp <= 0 || targetEnemy.alive === false) {
      console.log("Target enemy is invalid or already defeated - skipping companion attack");
      setTimeout(nextTurn, 1000);
      return;
    }
    
    // Otherwise, the companion attacks the weakest enemy
    const dmg = Math.floor(Math.random() * (companion.support_power || 8) + 5);
    const final = applyDamageToTarget(targetEnemy, dmg, 'physical');
    log(`${companion.name} attacks ${targetEnemy.name} for ${final} damage (${dmg} raw)!`);
    
    // Log the state of the target enemy after damage is applied
    console.log(`After companion attack: ${targetEnemy.name}, HP: ${targetEnemy.hp}`);
    
    // Play attack sound
    playAttackSound();
      // Check if damage was done and flash enemy portrait
    const enemyIndex = enemies.indexOf(targetEnemy);
    if (enemyIndex >= 0) {
      // Update this specific enemy's HP in the UI immediately
      updateEnemyHP(enemyIndex);
      flashDamage(`enemy-portrait-${enemyIndex}`);
    }
    
    // Full UI update to ensure all elements are in sync
    updateUI();
      // Check if this attack defeated the enemy
    if (targetEnemy.hp <= 0) {
      if (targetEnemy.alive !== false) {
        targetEnemy.alive = false;
        animateEnemyDeath(targetEnemy, enemyIndex);
      }
      console.log(`Enemy defeated by companion: ${targetEnemy.name}`);
      
      // Play death sound for the enemy with delay
      setTimeout(() => {
        const deathSoundArray = getEnemyDeathSounds(targetEnemy);
        playRandomSound(deathSoundArray);
      }, 1000);
    } else {
      // Play hurt sound if the enemy was damaged but not defeated (with delay)
      setTimeout(() => {
        const hurtSoundArray = getEnemyHurtSounds(targetEnemy);
        playRandomSound(hurtSoundArray);
      }, 1000);
    }
  }
  
  // Check if any enemies were defeated and handle victory if needed
  // If checkEnemyStatus returns true, it means victory was triggered
  if (checkEnemyStatus()) {
    return; // Stop here if victory was triggered
  }
  
  saveGameState();    // Save changes
  
  // Only move to next turn if combat hasn't ended
  if (!combatEnded) {
    setTimeout(nextTurn, 2000); // Move on after 2 seconds
  }
}


// ========================
// Enemy Turn
// ========================
// This is called with the enemy object whose turn it is.
function handleCharmedEnemyTurn(enemy) {
  if (!enemy) return true;
  console.log(`Enemy ${enemy.name} is charmed and turns on their allies.`);
  playAttackSound();
  const alliedTargets = enemies.filter(e => e !== enemy && e.alive !== false && e.hp > 0);
  const summonTargets = (summonedNPCs || []).filter(s => s.alive && s.hp > 0);
  const potentialTargets = [...alliedTargets, ...summonTargets];
  const target = potentialTargets.length
    ? potentialTargets[Math.floor(Math.random() * potentialTargets.length)]
    : enemy;
  const dmg = enemy.basic_attack
    ? rollFromDiceSpec(enemy.basic_attack)
    : Math.floor(Math.random() * (enemy.attackPower || 5) + 1);
  // 1s delay before hit sound
  setTimeout(() => {
    const final = applyDamageToTarget(target, dmg, 'physical');
    const targetLabel = target === enemy ? 'themselves' : target.name;
    log(`🌀 ${enemy.name} is hypnotised and strikes ${targetLabel} for ${final} damage (${dmg} raw)!`);
    if (target === enemy || alliedTargets.includes(target)) {
      const enemyIndex = enemies.indexOf(target);
      if (enemyIndex >= 0) {
        updateEnemyHP(enemyIndex);
        flashDamage(`enemy-portrait-${enemyIndex}`);
      }
      if (target.hp <= 0 && target.alive !== false) {
        target.alive = false;
        animateEnemyDeath(target, enemyIndex);
        setTimeout(() => {
          const deathSoundArray = getEnemyDeathSounds(target);
          playRandomSound(deathSoundArray);
        }, 100);
      } else {
        setTimeout(() => {
          const hurtSoundArray = getEnemyHurtSounds(target);
          playRandomSound(hurtSoundArray);
        }, 100);
      }
      const victoryTriggered = checkEnemyStatus();
      updateUI();
      saveGameState();
      if (!victoryTriggered && !combatEnded) {
        setTimeout(nextTurn, 2000);
      }
      return;
    }
    const cardId = `summon-portrait-${target.id}`;
    if (document.getElementById(cardId)) {
      flashDamage(cardId);
    }
    updateSummonUI();
    if (target.hp <= 0 && target.alive) {
      target.alive = false;
      animateSummonDeath(target, true);
      log(`${target.name} dissipates under the assault!`);
      combatants = combatants.filter(c => c.data !== target);
      summonedNPCs = summonedNPCs.filter(s => s !== target);
      cleanupSummonUI();
    }
    saveGameState();
    updateUI();
    if (!combatEnded) {
      setTimeout(nextTurn, 2000);
    }
  }, 1000);
}

function handleCharmedAllyTurn(ally) {
  if (!ally) return;
  console.log(`${ally.name} is charmed and attacks party or summons.`);
  playAttackSound();
  const partyTargets = [player, companion].filter(c => c && c.alive !== false && c.hp > 0 && c !== ally);
  const summonTargets = (summonedNPCs || []).filter(s => s.alive && s.hp > 0);
  const potentialTargets = [...partyTargets, ...summonTargets];
  const target = potentialTargets.length
    ? potentialTargets[Math.floor(Math.random() * potentialTargets.length)]
    : ally;
  const dmg = ally.basic_attack
    ? rollFromDiceSpec(ally.basic_attack)
    : Math.floor(Math.random() * 6) + 3;
  setTimeout(() => {
    const final = applyDamageToTarget(target, dmg, 'physical');
    const targetLabel = target === ally ? 'themselves' : (target === player ? 'you' : target.name);
    log(`🌀 ${ally.name} is hypnotised and strikes ${targetLabel} for ${final} damage (${dmg} raw)!`);
    if (target === player || target === companion) {
      const portraitId = target === player ? 'player-portrait' : 'ally-portrait';
      flashDamage(portraitId);
      setTimeout(() => {
        const hurtSounds = target.gender === 'f' ? cryptonaut_female_hurt_sounds : 
                          target.gender === 'm' ? cryptonaut_male_hurt_sounds : cryptonaut_monster_hurt_sounds;
        const deathSounds = target.gender === 'f' ? party_death_female_sound : 
                             target.gender === 'm' ? party_death_male_sound : party_death_monster_sound;
        if (target.hp <= 0) {
          if (target.alive !== false) {
            target.alive = false;
            animateAllyDeath(portraitId);
            playRandomSound(deathSounds);
          }
        } else {
          playRandomSound(hurtSounds);
        }
      }, 100);
    } else {
      const cardId = `summon-portrait-${target.id}`;
      if (document.getElementById(cardId)) {
        flashDamage(cardId);
      }
      updateSummonUI();
      if (target.hp <= 0 && target.alive) {
        target.alive = false;
        animateSummonDeath(target, true);
        log(`${target.name} fades away!`);
        combatants = combatants.filter(c => c.data !== target);
        summonedNPCs = summonedNPCs.filter(s => s !== target);
        cleanupSummonUI();
      }
    }
    updateUI();
    saveGameState();
    const lossTriggered = checkLossCondition();
    if (!lossTriggered && !combatEnded) {
      setTimeout(nextTurn, 2000);
    }
  }, 1000);
}

function enemyTurn(enemy) {
  // If the enemy is not alive or has HP <= 0, skip the turn
  if (!enemy || !enemy.alive || enemy.hp <= 0) {
    console.log(`Skipping turn for defeated enemy: ${enemy?.name || 'unknown'}`);
    
    // Check if all enemies are defeated before moving to the next turn
    if (!enemies.some(e => e.alive !== false && e.hp > 0)) {
      console.log("All enemies are defeated during enemy turn check");
      handleVictory();
      return;
    }
    
    return setTimeout(nextTurn, 500);
  }
  
  // Log that this enemy is taking their turn
  console.log(`Enemy turn: ${enemy.name} (HP: ${enemy.hp})`);
  
  if (isCharmed(enemy)) {
    handleCharmedEnemyTurn(enemy);
    return;
  }
  
  // Simple AI that sometimes targets the player more often if the player has low HP
  // or the companion more often if the companion has low HP, etc.
  const compLow = companion.hp < (companion.maxHp || 30) * 0.3;
  const plyLow = player.hp < (player.maxHp || 50) * 0.3;
  
  // Decide if the enemy hits the player or the companion
  let targetIsPlayer;
  if (!companion.alive) {
    // If companion is already defeated, must target player
    targetIsPlayer = true;
  } else if (compLow && !plyLow) {
    // If only companion is low, 40% chance to attack player. So 60% to companion
    targetIsPlayer = (Math.random() < 0.4);
  } else if (plyLow && !compLow) {
    // If only player is low, 80% chance to attack player
    targetIsPlayer = (Math.random() < 0.8);
  } else {
    // Otherwise 60% chance to attack player
    targetIsPlayer = (Math.random() < 0.6);
  }
    // Play attack sound for enemy
  playAttackSound();
  
  // Calculate damage for the attack using dice spec if available
  let dmg;
  if (enemy.basic_attack) {
    dmg = rollFromDiceSpec(enemy.basic_attack);
  } else {
    // Legacy fallback for old data format
    dmg = Math.floor(Math.random() * (enemy.attackPower || 5) + 1);
  }
  
  // 1s delay before damage is applied and hit sound plays
  setTimeout(() => {
    if (targetIsPlayer) {
      // Attacking player
      const sanityDmg = enemy.sanityDamage || 0; // Some enemies also deal sanity damage
      const final = applyDamageToTarget(player, dmg, 'physical');
      const sanityBefore = player.sanity;
      player.sanity = Math.max(0, player.sanity - sanityDmg); // Clamp to 0, don't go negative
      
      // Update sanity state after sanity damage
      updateSanityState();
      
      // Special message when sanity first hits 0
      if (sanityBefore > 0 && player.sanity === 0) {
        log(`🌀 Your mind shatters... but you fight on through the madness!`);
        maybeAddPhantomLog(1.0); // Guaranteed phantom log on sanity break
      }
      
      log(`☠ The ${enemy.name} strikes you for ${final} damage (${dmg} raw)${sanityDmg > 0 ? `, sanity -${sanityDmg}` : ''}.`);
      
      // Maybe add phantom log during insanity
      if (currentSanityState !== SANITY_STATES.STABLE) {
        maybeAddPhantomLog(currentSanityState === SANITY_STATES.BROKEN ? 0.3 : 0.1);
      }
      
      // Flash player portrait red to indicate damage
      flashDamage('player-portrait');
        
      const playerSounds = player.gender === 'f' ? cryptonaut_female_hurt_sounds : 
                          player.gender === 'm' ? cryptonaut_male_hurt_sounds : cryptonaut_monster_hurt_sounds;
      const playerDeathSounds = player.gender === 'f' ? party_death_female_sound : 
                               player.gender === 'm' ? party_death_male_sound : party_death_monster_sound;

      if (player.hp <= 0) {
        if (player.alive) {
          player.alive = false; // Mark as dead once to avoid repeated sounds
          animateAllyDeath('player-portrait');
          playRandomSound(playerDeathSounds);
        }
      } else {
        playRandomSound(playerSounds);
      }
    } else {
      // Attacking companion
      const final = applyDamageToTarget(companion, dmg, 'physical');
      log(`☠ The ${enemy.name} attacks ${companion.name} for ${final} damage (${dmg} raw)!`);
      
      // Flash companion portrait red to indicate damage
      flashDamage('ally-portrait');
        
      const companionSounds = companion.gender === 'f' ? cryptonaut_female_hurt_sounds : 
                             companion.gender === 'm' ? cryptonaut_male_hurt_sounds : cryptonaut_monster_hurt_sounds;
      const companionDeathSounds = companion.gender === 'f' ? party_death_female_sound : 
                                    companion.gender === 'm' ? party_death_male_sound : party_death_monster_sound;

      if (companion.hp <= 0) {
        if (companion.alive) {
          playRandomSound(companionDeathSounds);
        }
      } else {
        playRandomSound(companionSounds);
      }
    }
    
    updateUI();
    
    // Check if the player got defeated here (HP only - sanity 0 = peak insanity, not defeat)
    if (player.hp <= 0) {
      stopCombatMusic();
      combatEnded = true;
      log("💀 You collapse from your injuries. Game over.");
      disableActions(); // Player can no longer act
      // Play defeat music
      defeatMusic.currentTime = 0;
      defeatMusic.play().catch(err => console.log('Defeat music error:', err));
      return;
    }
  
  if (companion.hp <= 0 && companion.alive) {
    companion.alive = false;
    animateAllyDeath('ally-portrait');
    log(`${companion.name} falls unconscious!`);
    rebuildCombatants();
    
    // Check if all enemies are defeated after rebuilding combatants
    if (!enemies.some(e => e.alive !== false && e.hp > 0)) {
      console.log("All enemies are defeated after companion falls");
      handleVictory();
      return;
    }
    
    if (currentTurn >= combatants.length) currentTurn = 0;
  }
  
    saveGameState();    // Save updated HP for player/companion
    // Only proceed to next turn if combat hasn't ended, 2s after hit sounds
    if (!combatEnded) {
      setTimeout(nextTurn, 2000); // Move to the next turn after 2 seconds
    }
  }, 1000);
}

function playAttackSound() {
  if (!attackSounds.length) return;
  const idx = Math.floor(Math.random() * attackSounds.length);
  const sound = attackSounds[idx];
  sound.currentTime = 0;
  sound.play().catch(err => console.log('Sound error:', err));
}

// ========================
// Checking for Enemy Defeat
// ========================
// This function checks if any enemies' HP <= 0, removes them from arrays, and triggers victory if all are defeated.
function checkEnemyStatus() {
  // Gather all enemies with zero or negative HP that are still marked as alive
  const defeated = enemies.filter(e => e.hp <= 0 && e.alive !== false);
  enemies.forEach((enemy, idx) => {
    if (enemy.hp <= 0) {
      animateEnemyDeath(enemy, idx);
    }
  });
  
  // If none are defeated, return false (no changes)
  if (!defeated.length) return false;
  
  // Debug info
  console.log(`checkEnemyStatus found ${defeated.length} newly defeated enemies`);
  
  // Mark each one as dead, log a message, and award XP
  defeated.forEach(dead => {
    log(`🎉 The ${dead.name} is defeated!`);
    dead.alive = false;
    console.log(`Marked enemy as defeated: ${dead.name}, HP: ${dead.hp}, alive: ${dead.alive}`);
    
    // Award XP to both player and companion (party XP)
    const xpReward = dead.xp_reward || 10;
    log(`⭐ Party gains ${xpReward} XP!`);
    awardXp(player, xpReward);
    if (companion && companion.alive) {
      awardXp(companion, xpReward);
    }
    
    const deadIndex = enemies.indexOf(dead);
    if (deadIndex >= 0) {
      animateEnemyDeath(dead, deadIndex);
    }
  });
  
  // Filter out those with HP <= 0 or not alive from the main enemies array
  const oldEnemiesCount = enemies.length;
  enemies = enemies.filter(e => e.hp > 0 && e.alive !== false);
  console.log(`Filtered enemies array: ${oldEnemiesCount} -> ${enemies.length}`);
  
  // Rebuild the combatants queue with the updated enemies list
  rebuildCombatants();
  
  // If the current turn goes out of bounds after rebuilding, reset it
  if (currentTurn >= combatants.length) {
    console.log(`Resetting current turn: ${currentTurn} -> 0 (combatants length: ${combatants.length})`);
    currentTurn = 0;
  }
  
  // Check if there are no enemies left or all enemies are defeated
  if (enemies.length === 0 || !enemies.some(e => e.alive !== false && e.hp > 0)) {
    console.log("No enemies left, handling victory");
    handleVictory();
    return true;
  }
  
  // Force UI update to reflect changes
  updateUI();
  
  return false;
}


// ========================
// Handling Victory
// ========================
// Called when all enemies have been defeated. Display a victory message.
function handleVictory() {
  // Double check that there are truly no living enemies
  const livingEnemies = enemies.filter(e => e.alive !== false && e.hp > 0);
  
  // If there are still living enemies, do not trigger victory
  if (livingEnemies.length > 0) {
    console.log("Victory was triggered but there are still living enemies. Continuing combat.");
    return;
  }
  
  // Make sure we only do this once
  if (combatEnded) return;
  combatEnded = true;

  stopCombatMusic();
  
  // Log victory message
  log("🏆 Victory! All enemies have been defeated!");
  console.log("Combat victory triggered!");
  
  disableActions(); // Stop the player from clicking actions
    // Play the victory sound
  victorySound.play().catch(e => console.log("Sound error:", e));
  
  // Save final game state
  saveGameState();
  
  // Check if returning to exploration
  if (window.fromExploration) {
    handleExplorationReturn(true);
    return;
  }
  
  // Show victory screen
  setTimeout(() => {
    document.getElementById('victory-screen')?.classList.add('visible');
  }, 1500);
}

// Handle return to exploration after combat
function handleExplorationReturn(victory) {
  // Store combat result for exploration to pick up
  const combatResult = {
    victory: victory,
    player: {
      hp: player.hp,
      maxHp: player.maxHp,
      sanity: player.sanity,
      maxSanity: player.maxSanity,
      statusEffects: player.statusEffects || []
    },
    companion: companion ? {
      hp: companion.hp,
      maxHp: companion.maxHp,
      sanity: companion.sanity,
      maxSanity: companion.maxSanity,
      statusEffects: companion.statusEffects || []
    } : null,
    inventory: typeof getInventoryState === 'function' ? getInventoryState() : null,
    xpGained: enemies.reduce((sum, e) => sum + (e.xp_reward || 0), 0)
  };
  
  sessionStorage.setItem('explorationCombatResult', JSON.stringify(combatResult));
  
  // Clear exploration combat data
  sessionStorage.removeItem('explorationCombat');
  
  // Redirect back to exploration
  setTimeout(() => {
    log(victory ? "🚶 Returning to exploration..." : "💀 Your journey ends here...");
    setTimeout(() => {
      window.location.href = 'exploration.html';
    }, 1500);
  }, 2000);
}

// ========================
// Handling Party Defeat
// ========================
// Called when the player dies from status effects or other damage.
// Note: Sanity at 0 no longer causes defeat - player fights on in peak insanity!
function checkLossCondition() {
  // Check if player is dead (HP only - sanity 0 means peak insanity, not defeat)
  if (player.hp <= 0) {
    if (combatEnded) return;
    if (player.alive !== false) {
      player.alive = false;
      animateAllyDeath('player-portrait');
    }
    combatEnded = true;
    stopCombatMusic();
    log("💀 You collapse from your injuries. Game over.");
    disableActions();
    
    // Play death sound
    const deathSounds = player.gender === 'f' ? party_death_female_sound :
                        player.gender === 'm' ? party_death_male_sound : party_death_monster_sound;
    playRandomSound(deathSounds);
    
    // Play defeat music
    defeatMusic.currentTime = 0;
    defeatMusic.play().catch(err => console.log('Defeat music error:', err));
    
    // Check if returning to exploration (for game over handling)
    if (window.fromExploration) {
      handleExplorationReturn(false);
      return true;
    }
    
    // Could show a defeat screen here
    return true;
  }
  return false;
}

// ========================
// Saving Game State
// ========================
// Writes some data to localStorage for quick saving. 
function saveGameState() {
  try {
    localStorage.setItem('player', JSON.stringify(player));
    localStorage.setItem('companion', JSON.stringify(companion));
  } catch (err) {
    console.error("Save failed:", err);
  }
}

// ========================
// Logging Utility
// ========================
// Adds text to the 'combat-log' div at the bottom of the screen.
function log(text) {
  const logDiv = document.getElementById('combat-log');
  if (!logDiv) return; // If there's no log element, skip
  
  // Apply insanity text scrambling if in broken/shaken state
  const displayText = renderInsanityText(text);
  
  logDiv.innerHTML += `<div>> ${displayText}</div>`; // Append a new line
  logDiv.scrollTop = logDiv.scrollHeight;     // Auto-scroll to bottom
}

// ========================
// UI Helpers
// ========================
// enableActions() makes the player's action buttons clickable,
// disableActions() disables them (for enemy turns, etc.)
function enableActions() {
  document.querySelectorAll("#actions button").forEach(b => b.disabled = false);
  
  // Apply insanity effects to buttons when enabled
  if (currentSanityState === SANITY_STATES.BROKEN) {
    shuffleActionButtons();
    jitterActionButtons();
  } else if (currentSanityState === SANITY_STATES.SHAKEN) {
    jitterActionButtons();
  } else {
    resetButtonPositions();
  }
}
function disableActions() {
  document.querySelectorAll("#actions button").forEach(b => b.disabled = true);
}

// Function to flash a character's portrait red when hit
function flashDamage(characterId) {
  const portrait = document.getElementById(characterId);
  if (!portrait) return;
  
  // Add a class for the red flash effect
  portrait.classList.add('damage-flash');
  
  // Remove the class after the animation completes
  setTimeout(() => {
    portrait.classList.remove('damage-flash');
  }, 500);
}

function triggerDeathCardEffect(card, onComplete) {
  if (!card) return;
  if (card.dataset.deathAnimating === 'running') return;
  card.dataset.deathAnimating = 'running';
  card.classList.remove('death-hidden', 'death-card', 'death-fall');
  card.classList.add('death-flash');
  card.style.display = 'block';

  const img = card.querySelector('img');
  if (img && !img.dataset.originalSrc) {
    img.dataset.originalSrc = img.src;
  }

  setTimeout(() => {
    if (img) {
      img.src = DEATH_CARD_IMAGE;
      img.alt = 'Fallen combatant';
    }
    card.classList.add('death-card');
  }, 250);

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    card.dataset.deathAnimating = '';
    card.classList.add('death-hidden');
    card.style.display = 'none';
    card.removeEventListener('animationend', finish);
    if (typeof onComplete === 'function') {
      onComplete();
    }
  };

  setTimeout(() => {
    card.classList.remove('death-flash');
    card.classList.add('death-fall');
    card.addEventListener('animationend', finish, { once: true });
    // Fallback in case animationend doesn't fire
    setTimeout(finish, 1600);
  }, 1100);
}

function resetDeathCardState(card, portraitSrc) {
  if (!card || card.dataset.deathAnimating === 'running') return;
  card.classList.remove('death-flash', 'death-card', 'death-fall', 'death-hidden');
  card.style.display = 'block';
  const img = card.querySelector('img');
  if (img) {
    const source = portraitSrc || img.dataset.originalSrc;
    if (source) {
      img.src = source;
      img.dataset.originalSrc = source;
    }
  }
}

function getEnemyCardElement(enemy, fallbackIndex) {
  if (!enemy) return null;
  if (enemy.cardElementId) {
    const card = document.getElementById(enemy.cardElementId);
    if (card) return card;
  }
  if (typeof fallbackIndex === 'number' && fallbackIndex >= 0) {
    const card = document.getElementById(`enemy-portrait-${fallbackIndex}`);
    if (card) return card;
  }
  if (enemy.id) {
    return document.querySelector(`.portrait.enemy[data-enemy-id="${enemy.id}"]`);
  }
  return null;
}

function animateEnemyDeath(enemy, fallbackIndex) {
  const card = getEnemyCardElement(enemy, fallbackIndex);
  if (card) {
    triggerDeathCardEffect(card);
  }
}

function animateAllyDeath(cardId) {
  const card = document.getElementById(cardId);
  if (card) {
    triggerDeathCardEffect(card);
  }
}

function animateSummonDeath(summon, removeAfter = false) {
  if (!summon) return;
  const card = document.getElementById(`summon-portrait-${summon.id}`);
  if (!card) return;
  const onComplete = removeAfter ? () => cleanupSummonUI() : null;
  triggerDeathCardEffect(card, onComplete);
}

// This function is used to leave the combat screen, e.g., after winning.
// It's up to you how you want to transition or reload the page.
// Function to update a specific enemy's HP display in the UI
function updateEnemyHP(enemyIndex) {
  if (enemyIndex < 0 || enemyIndex >= enemies.length) return;
  
  const enemy = enemies[enemyIndex];
  const hpSpan = document.getElementById(`enemy-hp-${enemyIndex}`);
  
  if (hpSpan) {
    hpSpan.textContent = `${enemy.hp}`;
    console.log(`Updated UI HP for ${enemy.name} to ${enemy.hp}`);
  }
}

function exitCombat() {
  document.getElementById('victory-screen')?.classList.remove('visible');
  log("Exiting combat...");
  // Fades out #combat-screen
  document.getElementById('combat-screen').style.opacity = '0';
  // After 1 second, show an alert or navigate away
  setTimeout(() => alert("Combat ended. Stats saved."), 1000);
}

// ========================
// Rebuild Combatants Array
// ========================
// This function rebuilds the combatants array based on who is alive in the battle
function rebuildCombatants() {
  // First, make sure the enemies array itself only contains living enemies
  // This is crucial for preventing targeting of already-defeated enemies
  const oldEnemiesLength = enemies.length;
  enemies = enemies.filter(e => e.alive !== false && e.hp > 0);
  
  if (oldEnemiesLength !== enemies.length) {
    console.log(`rebuildCombatants: filtered enemies array from ${oldEnemiesLength} to ${enemies.length} enemies`);
  }
  
  // Create a new array with all living combatants in the proper order
  combatants = [
    // Player is always included
    { type: 'player', data: player },
    
    // Include companion only if alive
    ...(companion.alive ? [{ type: 'companion', data: companion }] : []),
    
    // Include only enemies that are still alive and have HP > 0
    ...enemies
      .filter(e => e.alive !== false && e.hp > 0)
      .map(e => ({ type: 'enemy', data: e }))
  ];
  
  // For each combatant, add a random modifier (±3) to their base initiative
  combatants.forEach(c => {
    // Store the base initiative for reference
    c.baseInit = c.data.init || 0;
    // Calculate a new initiative roll with randomness
    c.rollInit = c.baseInit + (Math.floor(Math.random() * 7) - 3); // -3 to +3 random modifier
  });
  
  // Re-sort the combatants by rolled initiative
  combatants.sort((a, b) => b.rollInit - a.rollInit);
  
  // Log the new turn order for debugging purposes
  console.log("Rebuilt combatants array:", 
    combatants.map(c => `${c.type}: ${c.data.name || 'unnamed'} (base init: ${c.baseInit}, roll: ${c.rollInit})`));
}
