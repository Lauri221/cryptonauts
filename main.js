// ========================
// Global Game State Variables
// ========================

// Holds player's information (HP, sanity, name, etc.)
let player = {};

// Holds companion's information (HP, sanity, ability, etc.)
let companion = {};

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
  const spec = specFile.characters?.find(c => c.id === characterId);

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
      maxSanity: rawConfig.maxSanity || rawConfig.sanity || 0
    };
  }

  const spec = await getCharacterSpec(rawConfig.character_file, rawConfig.character_id);
  const baseStats = spec.base_stats || {};
  const genderKey = rawConfig.gender || 'm';
  const genderVariants = spec.gender_variants || {};
  const genderData = genderVariants[genderKey] || Object.values(genderVariants)[0] || {};

  const portrait = resolvePortraitPath(genderData.portrait) || rawConfig.portrait;
  const inventoryIds = rawConfig.inventory || spec.starting_inventory || [];
  const inventory = buildInventoryFromIds(inventoryIds);
  const actions = buildCharacterActions(baseStats);

  const hydrated = {
    ...rawConfig,
    character_id: spec.id,
    class: spec.class,
    base_stats: baseStats,
    hp: baseStats.hp ?? rawConfig.hp ?? 0,
    maxHp: baseStats.hp ?? rawConfig.hp ?? 0,
    sanity: baseStats.sanity ?? rawConfig.sanity ?? 0,
    maxSanity: baseStats.sanity ?? rawConfig.sanity ?? 0,
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
    audioProfile: genderData.audio ? { ...genderData.audio } : rawConfig.audioProfile || null
  };

  return hydrated;
}

// Audio for victory jingle; loaded from relative path
let victorySound = new Audio('./music/victory_music.mp3');

// Looping combat underscore
let combatMusic = new Audio('./music/combat.mp3');
combatMusic.loop = true;

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

// ========================
// Player Action Handler
// ========================
// Called by the UI buttons (Attack, Ability 1, Ability 2, Item).
function chooseAction(actionId) {
  if (combatants[currentTurn]?.type !== 'player') return;

  if (actionId !== 'item' && itemSelectionOpen) {
    hideItemSelection();
  }

  if (actionId === 'item') {
    showItemSelection();
    return;
  }

  const result = executePlayerAction(actionId);
  if (!result) return;
  completePlayerAction(result);
}

function executePlayerAction(actionId) {
  const livingEnemies = getLivingEnemies();
  const targetEnemy = livingEnemies[0] || null;
  const abilityName = actionId === 'ability1' ? (player.ability1?.name || 'Ability 1')
                      : actionId === 'ability2' ? (player.ability2?.name || 'Ability 2')
                      : null;

  switch (actionId) {
    case 'attack': {
      if (!targetEnemy) {
        handleVictory();
        return null;
      }
      const baseAttackSpec = player.basic_attack;
      const damage = baseAttackSpec ? rollFromDiceSpec(baseAttackSpec) : Math.floor(Math.random() * 10 + 5);
      targetEnemy.hp -= damage;
      log(`You attack ${targetEnemy.name} for ${damage} damage.`);
      playAttackSound();
      return { enemy: targetEnemy, damage, action: 'attack' };
    }
    case 'defend': {
      const sanityGainCap = player.maxSanity ?? (player.sanity + 5);
      const sanityBefore = player.sanity;
      player.sanity = Math.min(sanityGainCap, player.sanity + 5);
      const sanityGain = player.sanity - sanityBefore;
      log(`You brace yourself${sanityGain ? ` and regain ${sanityGain} sanity` : ''}.`);
      defendSound.play().catch(err => console.log('Sound error:', err));
      return { action: 'defend' };
    }
    case 'element': {
      if (!targetEnemy) {
        handleVictory();
        return null;
      }
      const damage = Math.floor(Math.random() * 12) + 8;
      targetEnemy.hp -= damage;
      player.sanity = Math.max(0, player.sanity - 5);
      log(`Elemental strike! ${damage} damage dealt, sanity -5.`);
      playAttackSound();
      return { enemy: targetEnemy, damage, action: 'element' };
    }
    case 'ability1': {
      if (!player.ability1) {
        log('This class does not have a first ability.');
        return null;
      }
      const sanityBefore = player.sanity;
      const hpBefore = player.hp;
      const sanityCap = player.maxSanity ?? (player.sanity + 10);
      const hpCap = player.maxHp ?? (player.hp + 5);
      player.sanity = Math.min(sanityCap, player.sanity + 10);
      player.hp = Math.min(hpCap, player.hp + 5);
      const sanityGain = player.sanity - sanityBefore;
      const hpGain = player.hp - hpBefore;
      const pieces = [];
      if (hpGain > 0) pieces.push(`restore ${hpGain} HP`);
      if (sanityGain > 0) pieces.push(`regain ${sanityGain} sanity`);
      const effectText = pieces.length ? `, ${pieces.join(' and ')}` : '';
      log(`You use ${abilityName}${effectText}.`);
      return { action: 'ability1' };
    }
    case 'ability2': {
      if (!player.ability2) {
        log('This class does not have a second ability.');
        return null;
      }
      if (!targetEnemy) {
        handleVictory();
        return null;
      }
      const damage = Math.floor(Math.random() * 8) + 6;
      targetEnemy.hp -= damage;
      const sanityBefore = player.sanity;
      const sanityCap = player.maxSanity ?? (player.sanity + 5);
      player.sanity = Math.min(sanityCap, player.sanity + 5);
      const sanityGain = player.sanity - sanityBefore;
      const sanityText = sanityGain ? ` and steady your mind (+${sanityGain} sanity)` : '';
      log(`You unleash ${abilityName}, unsettling ${targetEnemy.name} for ${damage} damage${sanityText}.`);
      playAttackSound();
      return { enemy: targetEnemy, damage, action: 'ability2' };
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
      enemy.alive = false;
      setTimeout(() => {
        const deathSoundArray = enemy.gender === 'f' ? enemy_death_female_sound :
                                enemy.gender === 'm' ? enemy_death_male_sound : enemy_death_monster_sound;
        playRandomSound(deathSoundArray);
      }, 1000);
    } else if (damage > 0) {
      setTimeout(() => {
        const hurtSoundArray = enemy.gender === 'f' ? enemy_hurt_female_sound :
                               enemy.gender === 'm' ? enemy_hurt_male_sound : enemy_hurt_monster_sound;
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
  attackSounds,
  [defendSound],
  [potion_sound],
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
  party_death_male_sound,
  party_death_female_sound,
  party_death_monster_sound,
  enemy_death_male_sound,
  enemy_death_female_sound,
  enemy_death_monster_sound,
  enemy_hurt_male_sound,
  enemy_hurt_female_sound,
  enemy_hurt_monster_sound
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
  if (!targetSelectionActive || !selectedItemId) return;
  
  const portrait = event.currentTarget;
  const targetType = portrait.dataset.targetType;
  
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
});

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
    // Load item database for the unified item system
    await loadItemDatabase('./inventory.json');
    
    // Initialize inventory state with starting items (can be loaded from save later)
    const inventorySeed = (typeof window !== 'undefined' && window.initialInventoryState)
      ? cloneData(window.initialInventoryState)
      : {
          vial_vital_humours: 2,
          tincture_of_lucidity: 1,
          herbal_tonic: 3
        };
    initInventoryState(inventorySeed || {});
    
    // Load inventory definitions used to hydrate party inventories (legacy support)
    const inventoryRes = await fetch('inventory.json');
    const inventoryRaw = await inventoryRes.json();
    inventoryCatalog = normalizeInventoryCatalog(inventoryRaw);

    // 1) Load player data
    const playerRes = await fetch('player.json'); // Fetch local file
    const playerConfig = await playerRes.json();  // Convert the response to JS object
    player = await hydratePartyMember(playerConfig);
    player.alive = player.hp > 0;                 // Mark player as alive if HP > 0
    renderActionButtons(player.actions);
    
    // 2) Load companion data
    const companionRes = await fetch('companion.json');
    const companionConfig = await companionRes.json();
    companion = await hydratePartyMember(companionConfig);
    companion.alive = companion.hp > 0;           // Mark companion as alive if HP > 0
    
    // 3) Load the enemy templates file
    const enemyDataRes = await fetch('enemies.json');
    const enemyData = await enemyDataRes.json();
    
    console.log("Enemy templates loaded:", JSON.stringify(enemyData.enemies));
    
    // 4) Load encounter definition
    //    - Tells us which enemies appear, their positions, and the background
    const encRes = await fetch('combat_encounter.json');
    const encounter = await encRes.json();
    
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
        // Create a completely new object based on the template
      const enemyInstance = {
        id: template.id,
        name: template.name,
        gender: template.gender || 'm', // Include gender, default to male if not specified
        hp: template.hp, // Use the HP from the template (priestess = 10)
        attackPower: template.attackPower,
        sanityDamage: template.sanityDamage,
        init: template.init,
        alive: true,
        position: slot.position
      };
      
      console.log(`Created enemy: ${enemyInstance.name} with HP: ${enemyInstance.hp}`);
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
  
  // Build array with all combatants:
  //  1) Player object with type 'player'
  //  2) Companion object with type 'companion'
  //  3) Each enemy (mapped to type 'enemy')
  combatants = [
    { type: 'player', data: player },
    { type: 'companion', data: companion },
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
  nextTurn();
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
  
  // Update UI before the current combatant acts
  updateUI();
  
  // Decide actions based on the combatant 'type'
  if (current.type === 'player') {
    log("Your turn! Choose an action...");
    enableActions(); // Allows user to click Attack / Defend / etc.
  } else if (current.type === 'companion') {
    disableActions(); // Hide player controls
    // Check if companion is actually alive
    if (!companion.alive || companion.hp <= 0) {
      log(`${companion.name || "Companion"} is incapacitated and skips their turn.`);
      return setTimeout(nextTurn, 1000);
    }
    // Wait 1 second, then let the companion AI act
    setTimeout(companionTurn, 1000);
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
  
  // Update player info
  document.getElementById('player-name').textContent = player.name || "Cryptonaut";
  document.getElementById('player-hp').textContent = player.hp;
  document.getElementById('player-sanity').textContent = player.sanity;
  const playerImg = document.querySelector('#player-portrait img');
  if (playerImg && player.portrait) {
    playerImg.src = player.portrait;
    playerImg.alt = player.name || 'Player';
  }
  
  // Show or hide the ally portrait depending on whether they're alive
  document.getElementById('ally-portrait').style.display = companion.alive ? 'block' : 'none';
  
  // Update companion info
  document.getElementById('companion-name').textContent = companion.name || "Companion";
  document.getElementById('ally-hp').textContent = companion.hp;
  document.getElementById('ally-sanity').textContent = companion.sanity;
  const companionImg = document.querySelector('#ally-portrait img');
  if (companionImg && companion.portrait) {
    companionImg.src = companion.portrait;
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
    // Each enemy's portrait has an ID like "enemy-portrait-0"
    const card = document.getElementById(`enemy-portrait-${i}`);
    const hpSpan = document.getElementById(`enemy-hp-${i}`);
    if (card && hpSpan) {
      // Force the HP display text to update with current enemy HP value
      hpSpan.textContent = `${enemy.hp}`;
      
      // Show the card only if enemy is alive
      const shouldDisplay = enemy.alive !== false && enemy.hp > 0;
      card.style.display = shouldDisplay ? 'block' : 'none';
      
      // Debug logging to track enemy HP updates in UI
      console.log(`Enemy ${enemy.name} (index ${i}): HP=${enemy.hp}, alive=${enemy.alive}, display=${card.style.display}, element text=${hpSpan.textContent}`);
    }
  });
  
  // Highlight the portrait of whoever's turn it is
  document.querySelectorAll(".portrait").forEach(el => el.classList.remove("active-turn"));
  if (combatants.length > 0 && currentTurn < combatants.length) {
    const current = combatants[currentTurn];
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
    }
  }
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
    
    // The ID is used elsewhere for updating HP, etc.
    // We assume there's an image at "assets/img/enemy_portrait/<enemy.id>.png"
    card.innerHTML = `
      <img src="assets/img/enemy_portrait/${enemy.id}.png" alt="${enemy.name}">
      <div class="stats">
        <div class="character-name"><span>${enemy.name}</span></div>
        <div>HP: <span id="enemy-hp-${i}">${enemy.hp}</span></div>
      </div>
    `;
    
    // Only show the card if the enemy is alive
    card.style.display = enemy.alive !== false && enemy.hp > 0 ? 'block' : 'none';
    
    // Append the card to the enemy area in the DOM
    enemyArea.appendChild(card);
    
    console.log(`Generated card for ${enemy.name} (id: ${enemy.id}) with HP: ${enemy.hp}, alive: ${enemy.alive}`);
  });
}


// ========================
// Companion (Ally) AI
// ========================
// This function is called when the companion's turn starts.
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
    targetEnemy.hp -= dmg;
    log(`${companion.name} attacks ${targetEnemy.name} for ${dmg} damage!`);
    
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
      targetEnemy.alive = false;
      console.log(`Enemy defeated by companion: ${targetEnemy.name}`);
      
      // Immediately update the enemy's display status in the UI
      const enemyIndex = enemies.indexOf(targetEnemy);
      if (enemyIndex >= 0) {
        const card = document.getElementById(`enemy-portrait-${enemyIndex}`);
        if (card) {
          card.style.display = 'none';
          console.log(`Hide UI card for enemy defeated by companion at index ${enemyIndex}`);
        }
      }
      
      // Play death sound for the enemy with delay
      setTimeout(() => {
        const deathSoundArray = targetEnemy.gender === 'f' ? enemy_death_female_sound : 
                               targetEnemy.gender === 'm' ? enemy_death_male_sound : enemy_death_monster_sound;
        playRandomSound(deathSoundArray);
      }, 1000);
    } else {
      // Play hurt sound if the enemy was damaged but not defeated (with delay)
      setTimeout(() => {
        const hurtSoundArray = targetEnemy.gender === 'f' ? enemy_hurt_female_sound : 
                              targetEnemy.gender === 'm' ? enemy_hurt_male_sound : enemy_hurt_monster_sound;
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
  
  // Calculate damage for the attack
  const dmg = Math.floor(Math.random() * (enemy.attackPower || 5) + 1);
    if (targetIsPlayer) {
    // Attacking player
    const sanityDmg = enemy.sanityDamage || 2; // Some enemies also deal sanity damage
    player.hp -= dmg;
    player.sanity -= sanityDmg;
    log(`☠ The ${enemy.name} strikes you for ${dmg} damage, sanity -${sanityDmg}.`);
    
    // Flash player portrait red to indicate damage
    flashDamage('player-portrait');
      
    // Play hurt sound for player with delay
    setTimeout(() => {
      // Get player gender from player data or default to male
      const playerSounds = player.gender === 'f' ? cryptonaut_female_hurt_sounds : 
                          player.gender === 'm' ? cryptonaut_male_hurt_sounds : cryptonaut_monster_hurt_sounds;
      playRandomSound(playerSounds);
      
      // Check if player is defeated (only play death sound if actually dying)
      if (player.hp <= 0 && player.alive) {
        player.alive = false; // Mark as dead
        // Play death sound for player
        const playerDeathSounds = player.gender === 'f' ? party_death_female_sound : 
                                 player.gender === 'm' ? party_death_male_sound : party_death_monster_sound;
        playRandomSound(playerDeathSounds);
      }
    }, 1000);
  } else {
    // Attacking companion
    companion.hp -= dmg;
    log(`☠ The ${enemy.name} attacks ${companion.name} for ${dmg} damage!`);
    
    // Flash companion portrait red to indicate damage
    flashDamage('ally-portrait');
      
    // Play hurt sound for companion with delay
    setTimeout(() => {
      // Get companion gender from data
      const companionSounds = companion.gender === 'f' ? cryptonaut_female_hurt_sounds : 
                             companion.gender === 'm' ? cryptonaut_male_hurt_sounds : cryptonaut_monster_hurt_sounds;
      playRandomSound(companionSounds);
      
      // Check if companion is defeated (only play death sound if actually dying)
      if (companion.hp <= 0 && companion.alive) {
        // Play death sound for companion
        const companionDeathSounds = companion.gender === 'f' ? party_death_female_sound : 
                                    companion.gender === 'm' ? party_death_male_sound : party_death_monster_sound;
        playRandomSound(companionDeathSounds);
      }
    }, 1000);
  }
  
  updateUI();
  
  // Check if the player or companion got defeated here
  if (player.hp <= 0 || player.sanity <= 0) {
    stopCombatMusic();
    combatEnded = true;
    log("💀 You collapse from injuries or madness. Game over.");
    disableActions(); // Player can no longer act
    return;
  }
  
  if (companion.hp <= 0 && companion.alive) {
    companion.alive = false;
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
    // Only proceed to next turn if combat hasn't ended
  if (!combatEnded) {
    setTimeout(nextTurn, 2000); // Move to the next turn after 2 seconds
  }
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
  
  // If none are defeated, return false (no changes)
  if (!defeated.length) return false;
  
  // Debug info
  console.log(`checkEnemyStatus found ${defeated.length} newly defeated enemies`);
  
  // Mark each one as dead, log a message
  defeated.forEach(dead => {
    log(`🎉 The ${dead.name} is defeated!`);
    dead.alive = false;
    console.log(`Marked enemy as defeated: ${dead.name}, HP: ${dead.hp}, alive: ${dead.alive}`);
    
    // Find the corresponding UI element and hide it immediately
    const deadIndex = enemies.indexOf(dead);
    if (deadIndex >= 0) {
      const card = document.getElementById(`enemy-portrait-${deadIndex}`);
      if (card) {
        card.style.display = 'none';
        console.log(`Hide UI card for defeated enemy at index ${deadIndex}`);
      }
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
  
  // Show victory screen
  setTimeout(() => {
    document.getElementById('victory-screen')?.classList.add('visible');
  }, 1500);
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
  logDiv.innerHTML += `<div>> ${text}</div>`; // Append a new line
  logDiv.scrollTop = logDiv.scrollHeight;     // Auto-scroll to bottom
}


// ========================
// UI Helpers
// ========================
// enableActions() makes the player's action buttons clickable,
// disableActions() disables them (for enemy turns, etc.)
function enableActions() {
  document.querySelectorAll("#actions button").forEach(b => b.disabled = false);
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
