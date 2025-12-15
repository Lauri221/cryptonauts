// ========================
// Cryptonauts Exploration System
// ========================

// ========================
// Game Mode & Phase Enums
// ========================
// ========================
// Cryptonauts Exploration System
// ========================

// ========================
// Game Mode & Phase Enums
// ========================
const GameMode = {
  EXPLORATION: 'EXPLORATION',
  COMBAT: 'COMBAT',
  REST: 'REST',
  GAME_OVER: 'GAME_OVER',
  BOSS: 'BOSS',
  VICTORY: 'VICTORY'
};

const ExplorationPhase = {
  ROOM_ENTRY: 'ROOM_ENTRY',
  AWAITING_CHOICE: 'AWAITING_CHOICE',
  PROCESSING: 'PROCESSING',
  AFTERMATH: 'AFTERMATH'
};

const SANITY_STATES = {
  STABLE: 'stable',
  SHAKEN: 'shaken',
  BROKEN: 'broken'
};

const VALID_STATUS_EFFECT_IDS = [
  'stun',
  'poison',
  'fire',
  'bleeding',
  'charmed',
  'attack_up',
  'defense_up',
  'sanity_regen'
];

// ========================
// Status Effect Emoji Mapping
// ========================
const STATUS_EFFECT_EMOJIS = {
  stun: '💫',
  poison: '🧪',
  fire: '🔥',
  bleeding: '🩸',
  charmed: '🌀',
  attack_up: '⚔️',
  defense_up: '🛡️',
  sanity_regen: '💚'
};

/**
 * Get emoji representation for a status effect
 * @param {string} effectId - The status effect ID
 * @returns {string} The emoji or empty string if not found
 */
function getStatusEffectEmoji(effectId) {
  return STATUS_EFFECT_EMOJIS[effectId] || '';
}

/**
 * Generate HTML for status effect emoji display
 * @param {Array} statusEffects - Array of status effect objects or strings
 * @returns {string} HTML string with emoji badges
 */
function renderStatusEffectEmojis(statusEffects) {
  if (!statusEffects || !statusEffects.length) return '';
  
  const emojis = statusEffects
    .map(effect => {
      const id = typeof effect === 'string' ? effect : (effect.id || effect);
      const emoji = getStatusEffectEmoji(id);
      if (!emoji) return '';
      
      const name = typeof effect === 'object' ? (effect.name || id) : id;
      const stacks = typeof effect === 'object' && effect.stacks > 1 ? `×${effect.stacks}` : '';
      const duration = typeof effect === 'object' && effect.duration ? `(${effect.duration}t)` : '';
      
      return `<span class="status-emoji" title="${name} ${stacks}${duration}">${emoji}${stacks ? `<sub>${typeof effect === 'object' ? effect.stacks : ''}</sub>` : ''}</span>`;
    })
    .filter(e => e)
    .join('');
  
  return emojis || '';
}

const ROOM_OPTION_COUNT = 6;
const ROOM_SELECTION_LIMIT = 4;
const ROOM_HISTORY_MAX_ENTRIES = 50;
const FORCED_COMBAT_FLAG_PREFIX = 'forcedCombatResolved_';
const FORCED_COMBAT_ROOMS = {
  room_02_gallery: { 
    enemyIds: ['astral_creeper', 'astral_creeper'], 
    reason: 'The gallery guardians ambush you!' 
  },
  room_04_flooded_stair: { 
    enemyIds: ['drowned_acolyte', 'mossleech'], 
    reason: 'The waters churn with hostile shapes!' 
  },
  room_06_dreaming_vault: { 
    enemyIds: ['astral_summoner'], 
    reason: 'The vault warden awakens immediately!' 
  }
};

// Multi-enemy encounter configuration based on dungeon depth
const ENCOUNTER_CONFIG = {
  // Enemy count ranges by depth bracket
  enemyCountByDepth: {
    1: { min: 1, max: 1 },   // Depth 1-2: 1 enemy
    2: { min: 1, max: 1 },
    3: { min: 1, max: 2 },   // Depth 3-4: 1-2 enemies
    4: { min: 1, max: 2 },
    5: { min: 2, max: 3 },   // Depth 5-6: 2-3 enemies
    6: { min: 2, max: 3 },
    7: { min: 1, max: 1 }    // Boss depth: just the boss (summoner handles minions)
  },
  // Item drop chance per enemy, scaling with depth
  dropRateByDepth: {
    1: 0.15,  // 15% base drop rate
    2: 0.18,
    3: 0.22,
    4: 0.25,
    5: 0.30,
    6: 0.35,
    7: 0.40   // Higher drop rate for boss encounters
  },
  // Item pools by depth tier (common items early, rarer items later)
  itemPoolByDepth: {
    low: ['herbal_tonic', 'coagulant_seal_tonic', 'purging_bitter_tincture'],
    mid: ['herbal_tonic', 'vial_vital_humours', 'tincture_of_lucidity', 'coagulant_seal_bandages', 'berserker_blood'],
    high: ['vial_vital_humours', 'tincture_of_lucidity', 'nightshade_resin', 'black_tar_pitch', 'sigil_of_warding', 'chains_of_old']
  },
  // Max enemies to display (leave room for mid-combat summons)
  maxEnemiesPerEncounter: 3
};

// Get item pool based on depth
function getItemPoolForDepth(depth) {
  if (depth <= 2) return ENCOUNTER_CONFIG.itemPoolByDepth.low;
  if (depth <= 4) return ENCOUNTER_CONFIG.itemPoolByDepth.mid;
  return ENCOUNTER_CONFIG.itemPoolByDepth.high;
}

// Roll for enemy count based on current depth
function rollEnemyCount(depth) {
  const config = ENCOUNTER_CONFIG.enemyCountByDepth[depth] || { min: 1, max: 1 };
  const count = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
  return Math.min(count, ENCOUNTER_CONFIG.maxEnemiesPerEncounter);
}

// Generate multiple enemies for an encounter
function generateEncounterEnemies(room, overrideCount = null) {
  const depth = room.depth || 1;
  const count = overrideCount !== null ? overrideCount : rollEnemyCount(depth);
  const enemyIds = [];
  
  for (let i = 0; i < count; i++) {
    const enemyId = getRandomEnemyForRoom(room);
    if (enemyId) {
      enemyIds.push(enemyId);
    }
  }
  
  // Ensure at least one enemy
  if (enemyIds.length === 0) {
    enemyIds.push('cultist');
  }
  
  return enemyIds;
}

// Roll for item drops after combat (called per enemy defeated)
function rollItemDrop(depth) {
  const dropChance = ENCOUNTER_CONFIG.dropRateByDepth[depth] || 0.15;
  if (Math.random() > dropChance) return null;
  
  const pool = getItemPoolForDepth(depth);
  return pool[Math.floor(Math.random() * pool.length)];
}

const SUPPLEMENTAL_CHOICE_BLUEPRINTS = [
  { id: 'observe_shadows', label: 'Observe the shifting shadows', type: 'lore', description: 'Watch for subtle movement in the dark.' },
  { id: 'check_wards', label: 'Inspect warding sigils', type: 'action', description: 'Examine any remaining protective runes.' },
  { id: 'study_floor', label: 'Study the floor markings', type: 'lore', description: 'Look for footprints or ritual circles.' },
  { id: 'listen_silence', label: 'Listen to the silence', type: 'lore', description: 'Hold still to hear distant echoes.' },
  { id: 'map_route', label: 'Sketch a quick map', type: 'action', description: 'Record the chamber to avoid getting lost.' }
];

const AUTOSAVE_INTERVAL_MS = 60000;

// Optional overrides for bespoke backgrounds; defaults fall back to room.image
const ROOM_IMAGES = {
  room_01_entrance: 'assets/img/environment/crypt_entrance.png',
  room_02_gallery: 'assets/img/environment/crypt_corridor_.png',
  room_02a_side_cellar: 'assets/img/environment/storage_room.png',
  room_03_ossuary: 'assets/img/environment/dirty_room.png',
  room_04_flooded_stair: 'assets/img/environment/flooded_stairs.png',
  room_05_chanting_hall: 'assets/img/environment/chanting_hall.png',
  room_06_dreaming_vault: 'assets/img/environment/dreaming_vault.png',
  room_boss_sanctum: 'assets/img/environment/boss_sanctum.png'
};

const DEFAULT_ROOM_IMAGE = 'assets/img/environment/dungeon1.png';

const GEMINI_SYSTEM_PROMPT = `You are the narrative engine for a Lovecraft-inspired expedition crawler called Cryptonauts.
Always respond with valid JSON matching this TypeScript type:
interface GeminiExplorationResponse {
  narration: string;
  logMessages: string[];
  choices: Array<{ id: string; label: string; type?: 'move' | 'action' | 'rest' | 'lore' | 'combat'; description?: string; targetRoom?: string }>;
  effects: {
    hpChanges?: Array<{ target: 'player' | 'companion' | 'party'; amount: number; reason?: string }>;
    sanityChanges?: Array<{ target: 'player' | 'companion' | 'party'; amount: number; reason?: string }>;
    inventoryChanges?: Array<{ itemId: string; amount: number; reason?: string }>;
    statusEffects?: Array<{ target: 'player' | 'companion' | 'party'; effectId: string; action: 'add' | 'remove'; reason?: string }>;
    triggerCombat?: { enemyId: string; reason: string } | null;
    moveToRoom?: string | null;
    gameOver?: boolean;
  };
}`;

const LOCAL_SERVER_HINT = 'Run a local web server (for example: "python -m http.server 8000") from the project folder, then open http://localhost:8000/start_screen.html to play without browser file restrictions.';

let gameState = {
  mode: GameMode.EXPLORATION,
  explorationPhase: ExplorationPhase.ROOM_ENTRY,
  currentRoomId: 'room_01_entrance',
  depth: 1,
  roomsVisited: {},
  roomHistory: [],
  player: null,
  companion: null,
  inventory: {},
  flags: {},
  roomActionTracker: {},
  currentSanityState: SANITY_STATES.STABLE,
  geminiAvailable: true,
  geminiFailCount: 0,
  adventureLog: [],
  stats: {
    roomsExplored: 0,
    battlesFought: 0,
    enemiesDefeated: 0,
    itemsUsed: 0
  }
};

let creationState = {
  playerName: '',
  playerClassId: null,
  playerGender: 'm',
  companionId: null
};

let menuState = {
  isPaused: false,
  optionsOpenedFrom: 'pause',
  pendingConfirmAction: null
};

let gameSettings = {
  musicVolume: 60,
  sfxVolume: 60,
  sanityJitterEnabled: true,
  textScrambleEnabled: true,
  geminiEnabled: false,
  geminiApiKey: ''
};

let roomsData = null;
let enemiesData = null;
let charactersData = null;
let inventoryCatalog = { items: [] };
let autosaveInterval = null;
let playerInitWarned = false;
let navigationLocked = false;

function cloneData(data) {
  if (!data) return null;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(data);
    } catch (error) {
      // Fall back to JSON method below
    }
  }
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    return null;
  }
}

function getEmbeddedFallbackData(key) {
  const scope = typeof window !== 'undefined' ? window : globalThis;
  const fallback = scope?.__CRYPTONAUTS_FALLBACKS__?.[key];
  return cloneData(fallback);
}

function showDataLoadError(message) {
  if (document.querySelector('.fatal-alert')) return;
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay fatal-alert';
  const container = document.createElement('div');
  container.className = 'modal-container confirm-container';
  const heading = document.createElement('h3');
  heading.textContent = 'Data Unavailable';
  const body = document.createElement('p');
  body.textContent = message;
  const hint = document.createElement('p');
  hint.textContent = LOCAL_SERVER_HINT;
  container.append(heading, body, hint);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
}

async function loadJsonResource(path, fallbackKey) {
  const isFileProtocol = window.location.protocol === 'file:';

  if (!isFileProtocol) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`[Exploration] Failed to fetch ${path}, falling back if possible:`, error);
    }
  } else {
    console.warn(`[Exploration] Running via file://, using embedded fallback for ${path} if available.`);
  }

  const fallback = getEmbeddedFallbackData(fallbackKey);
  if (fallback) {
    console.log(`[Exploration] Loaded ${fallbackKey} data from embedded fallback`);
    return fallback;
  }

  return null;
}

// ========================
// Audio System
// ========================
let currentMusicTrack = null;

function getRandomTrack(type) {
  const rand = Math.random() < 0.5 ? 1 : 2;
  return type === 'exploration' 
    ? document.getElementById(`exploration-music-${rand}`)
    : document.getElementById(`boss-music-${rand}`);
}

function playExplorationMusic() {
  stopAllMusic();
  const music = getRandomTrack('exploration');
  if (!music) {
    console.warn('[Exploration] Exploration music element not found');
    return;
  }
  
  const volume = (gameSettings.musicVolume || 60) / 100;
  music.volume = volume;
  currentMusicTrack = music;
  
  music.play().catch(e => {
    console.log('[Exploration] Music autoplay blocked, will play on user interaction:', e);
    document.addEventListener('click', function startMusic() {
      if (currentMusicTrack) {
        currentMusicTrack.play().catch(() => {});
      }
      document.removeEventListener('click', startMusic);
    }, { once: true });
  });
  
  console.log('[Exploration] Playing exploration music');
}

function playBossMusic() {
  stopAllMusic();
  const music = getRandomTrack('boss');
  if (!music) {
    console.warn('[Exploration] Boss music element not found');
    return;
  }
  
  const volume = (gameSettings.musicVolume || 60) / 100;
  music.volume = volume;
  currentMusicTrack = music;
  
  music.play().catch(e => {
    console.log('[Exploration] Boss music autoplay blocked:', e);
  });
  
  console.log('[Exploration] Playing boss music');
}

function stopAllMusic() {
  const tracks = [
    document.getElementById('exploration-music-1'),
    document.getElementById('exploration-music-2'),
    document.getElementById('boss-music-1'),
    document.getElementById('boss-music-2')
  ];
  
  tracks.forEach(track => {
    if (track) {
      track.pause();
      track.currentTime = 0;
    }
  });
  
  currentMusicTrack = null;
}

const OPTION_SFX_FILES = [
  './sound/door_open_1.mp3',
  './sound/door_open_2.mp3',
  './sound/door_open_3.mp3',
  './sound/door_open_4.mp3'
];
const explorationOptionSounds = OPTION_SFX_FILES.map(path => {
  const audio = new Audio(path);
  audio.preload = 'auto';
  return audio;
});

const combatEventSound = (() => {
  const audio = new Audio('./sound/event_combat.mp3');
  audio.preload = 'auto';
  return audio;
})();

function playExplorationSfx(audio) {
  if (!audio) return;
  const volume = (gameSettings.sfxVolume || 60) / 100;
  audio.volume = volume;
  audio.currentTime = 0;
  audio.play().catch(err => console.warn('[Exploration] Failed to play SFX:', err));
}

function playRandomExplorationOptionSound() {
  if (!explorationOptionSounds.length) return;
  const clip = explorationOptionSounds[Math.floor(Math.random() * explorationOptionSounds.length)];
  playExplorationSfx(clip);
}

function playCombatEventSfx() {
  playExplorationSfx(combatEventSound);
}

function updateMusicVolume() {
  const volume = (gameSettings.musicVolume || 60) / 100;
  if (currentMusicTrack) {
    currentMusicTrack.volume = volume;
  }
}

function syncInventoryFromSystem() {
  if (typeof getInventoryState === 'function') {
    gameState.inventory = getInventoryState();
  }
}

function setInventoryState(newState = {}) {
  if (typeof initInventoryState === 'function' && typeof getInventoryState === 'function') {
    initInventoryState({ ...newState });
    syncInventoryFromSystem();
  } else {
    gameState.inventory = { ...newState };
  }
}

function getInventorySnapshot() {
  if (typeof getInventoryState === 'function') {
    return getInventoryState();
  }
  return { ...gameState.inventory };
}

// ========================
// Initialization
// ========================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Exploration] Initializing...');

  // Initialize config from .env file first
  if (typeof initConfig === 'function') {
    await initConfig();
  }

  loadSettings();
  initGameUI();
  const dataReady = await loadGameData();
  if (!dataReady) {
    setNarration('Unable to load essential expedition data. Please check the console for details.');
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const isNewGame = params.get('newGame') === 'true';
  const newGameConfig = sessionStorage.getItem('cryptonautsNewGame');
  const combatResult = sessionStorage.getItem('explorationCombatResult');
  const hasSave = checkForExistingSave();

  if (!isNewGame && hasSave) {
    loadGameState();
  }

  await checkGeminiAvailability();

  if (combatResult) {
    // Start with screen blacked out (we faded to black from combat)
    let overlay = document.getElementById('room-transition-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'room-transition-overlay';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('fade-in');
    
    startGame(false);
    const result = JSON.parse(combatResult);
    sessionStorage.removeItem('explorationCombatResult');
    updateUI();
    
    // Short delay then fade in from black after returning from combat
    setTimeout(() => {
      hideRoomTransition();
    }, 500);
    
    await handleCombatReturn(result);
    return;
  }

  if (isNewGame && newGameConfig) {
    creationState = JSON.parse(newGameConfig);
    sessionStorage.removeItem('cryptonautsNewGame');
    await startNewExpedition();
    return;
  }

  if (hasSave) {
    updateUI();
    startGame(false);
    await enterRoom(gameState.currentRoomId, true);
    return;
  }

  window.location.href = 'start_screen.html';
});

// ========================
// In-game Menu & Pause Controls
// ========================
function initGameUI() {
  const bind = (id, event, handler) => {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`[Exploration] Missing element #${id} when binding ${event}`);
      return;
    }
    el.addEventListener(event, handler);
  };

  bind('btn-resume', 'click', handleResume);
  bind('btn-save-game', 'click', handleManualSave);
  bind('btn-options-pause', 'click', () => openOptions('pause'));
  bind('btn-main-menu', 'click', handleMainMenu);
  bind('btn-options-save', 'click', saveOptions);
  bind('btn-options-cancel', 'click', cancelOptions);
  bind('btn-toggle-key', 'click', toggleApiKeyVisibility);
  bind('btn-test-gemini', 'click', testGeminiConnection);
  bind('btn-confirm-yes', 'click', confirmYes);
  bind('btn-confirm-no', 'click', confirmNo);
  bind('btn-pause', 'click', openPauseMenu);

  bind('music-volume', 'input', (e) => {
    const label = document.getElementById('music-volume-value');
    if (label) {
      label.textContent = `${e.target.value}%`;
    }
  });
  bind('sfx-volume', 'input', (e) => {
    const label = document.getElementById('sfx-volume-value');
    if (label) {
      label.textContent = `${e.target.value}%`;
    }
  });
  bind('sanity-jitter', 'change', (e) => {
    if (e.target.nextElementSibling) {
      e.target.nextElementSibling.textContent = e.target.checked ? 'Enabled' : 'Disabled';
    }
  });
  bind('text-scramble', 'change', (e) => {
    if (e.target.nextElementSibling) {
      e.target.nextElementSibling.textContent = e.target.checked ? 'Enabled' : 'Disabled';
    }
  });
  bind('enable-gemini', 'change', (e) => {
    if (e.target.nextElementSibling) {
      e.target.nextElementSibling.textContent = e.target.checked ? 'Enabled' : 'Disabled';
    }
  });

  document.addEventListener('keydown', handleGameKeyboard);
}

function handleGameKeyboard(e) {
  if (e.key !== 'Escape') return;

  if (!document.getElementById('options-modal').classList.contains('hidden')) {
    cancelOptions();
  } else if (!document.getElementById('confirm-dialog').classList.contains('hidden')) {
    confirmNo();
  } else if (!document.getElementById('pause-menu').classList.contains('hidden')) {
    handleResume();
  } else {
    openPauseMenu();
  }
}

// ========================
// New Expedition Flow
// ========================
async function startNewExpedition() {
  if (!creationState.playerClassId || !creationState.companionId) {
    console.error('[Creation] Missing creation data, returning to start screen');
    window.location.href = 'start_screen.html';
    return;
  }

  const playerName = (creationState.playerName || '').trim();
  if (!playerName) {
    const classData = charactersData?.characters?.find(c => c.id === creationState.playerClassId);
    creationState.playerName = classData ? `The ${classData.class}` : 'Cryptonaut';
  }

  console.log('[Menu] Beginning expedition with:', creationState);

  resetGameState();
  await createPartyFromSelections();
  await checkGeminiAvailability();
  updateUI();
  startGame(true);
  await enterRoom(gameState.currentRoomId);
  saveGameState();
}

async function createPartyFromSelections() {
  if (!charactersData) {
    throw new Error('Character data not loaded');
  }

  const classData = charactersData.characters.find(c => c.id === creationState.playerClassId);
  if (!classData) {
    throw new Error(`Player class ${creationState.playerClassId} not found`);
  }

  const genderKey = creationState.playerGender || 'm';
  const genderVariants = classData.gender_variants || {};
  const genderData = genderVariants[genderKey] || Object.values(genderVariants)[0] || {};

  gameState.player = {
    name: creationState.playerName || `The ${classData.class}`,
    classId: classData.id,
    className: classData.class,
    gender: genderKey,
    level: 0,
    xp: 0,
    xpToNextLevel: 50,
    hp: classData.base_stats.hp,
    maxHp: classData.base_stats.hp,
    sanity: classData.base_stats.sanity,
    maxSanity: classData.base_stats.sanity,
    attack: classData.base_stats.basic_attack,
    defense: classData.base_stats.defense,
    speed: classData.base_stats.speed,
    ability1: classData.base_stats.ability1,
    ability2: classData.base_stats.ability2,
    resistance: classData.base_stats.resistance,
    weakness: classData.base_stats.weakness,
    portrait: resolvePortraitPath(genderData.portrait) || genderData.portrait || 'assets/img/ally_portrait/warrior_male.png',
    audio: genderData.audio,
    base_stats: classData.base_stats,
    statusEffects: [],
    isPlayer: true
  };

  const companionData = charactersData.companions.find(c => c.id === creationState.companionId) || charactersData.companions[0];
  if (!companionData) {
    throw new Error('No companion data available');
  }

  gameState.companion = {
    name: companionData.name,
    classId: companionData.id,
    className: companionData.class,
    gender: companionData.gender,
    level: 0,
    xp: 0,
    xpToNextLevel: 50,
    hp: companionData.base_stats.hp,
    maxHp: companionData.base_stats.hp,
    sanity: companionData.base_stats.sanity,
    maxSanity: companionData.base_stats.sanity,
    attack: companionData.base_stats.basic_attack,
    defense: companionData.base_stats.defense,
    speed: companionData.base_stats.speed,
    ability1: companionData.base_stats.ability1,
    ability2: companionData.base_stats.ability2,
    resistance: companionData.base_stats.resistance,
    weakness: companionData.base_stats.weakness,
    portrait: companionData.portrait || 'assets/img/ally_portrait/warrior_male.png',
    audio: companionData.audio,
    base_stats: companionData.base_stats,
    statusEffects: [],
    isPlayer: false
  };

  const startingInventory = {};
  (classData.starting_inventory || []).forEach(item => {
    startingInventory[item] = (startingInventory[item] || 0) + 1;
  });
  (companionData.starting_inventory || []).forEach(item => {
    startingInventory[item] = (startingInventory[item] || 0) + 1;
  });

  gameState.inventory = startingInventory;
  setInventoryState(startingInventory);

  console.log('[Creation] Created player:', gameState.player.name, gameState.player.className);
  console.log('[Creation] Created companion:', gameState.companion.name, gameState.companion.className);
}

function startGame(isFreshStart = false) {
  document.getElementById('exploration-screen').classList.remove('hidden');
  document.getElementById('pause-menu').classList.add('hidden');
  document.getElementById('options-modal').classList.add('hidden');

  startAutosave();
  
  // Start appropriate music based on game mode
  if (gameState.mode === GameMode.BOSS) {
    playBossMusic();
  } else {
    playExplorationMusic();
  }

  if (isFreshStart) {
    logEvent('📜 Your expedition begins...', 'system');
  }
}

function openPauseMenu() {
  if (gameState.mode === GameMode.GAME_OVER || gameState.mode === GameMode.VICTORY) {
    return; // Don't allow pause during end states
  }
  
  menuState.isPaused = true;
  document.getElementById('pause-menu').classList.remove('hidden');
}

function handleResume() {
  menuState.isPaused = false;
  document.getElementById('pause-menu').classList.add('hidden');
}

function handleManualSave() {
  saveGameState();
  showAutosaveIndicator('Game Saved!');
  logEvent('💾 Game saved.', 'system');
}

function handleMainMenu() {
  showConfirmDialog(
    'Return to Main Menu?',
    'Your progress will be saved. Continue?',
    () => {
      saveGameState();
      stopAutosave();
      stopAllMusic();
      menuState.isPaused = false;
      document.getElementById('pause-menu').classList.add('hidden');
      window.location.href = 'start_screen.html';
    }
  );
}

function openOptions(from) {
  menuState.optionsOpenedFrom = from;
  populateOptionsForm();
  document.getElementById('options-modal').classList.remove('hidden');
}

function populateOptionsForm() {
  document.getElementById('music-volume').value = gameSettings.musicVolume;
  document.getElementById('music-volume-value').textContent = gameSettings.musicVolume + '%';
  
  document.getElementById('sfx-volume').value = gameSettings.sfxVolume;
  document.getElementById('sfx-volume-value').textContent = gameSettings.sfxVolume + '%';
  
  document.getElementById('sanity-jitter').checked = gameSettings.sanityJitterEnabled;
  document.getElementById('sanity-jitter').nextElementSibling.textContent = 
    gameSettings.sanityJitterEnabled ? 'Enabled' : 'Disabled';
  
  document.getElementById('text-scramble').checked = gameSettings.textScrambleEnabled;
  document.getElementById('text-scramble').nextElementSibling.textContent = 
    gameSettings.textScrambleEnabled ? 'Enabled' : 'Disabled';
  
  document.getElementById('enable-gemini').checked = gameSettings.geminiEnabled;
  document.getElementById('enable-gemini').nextElementSibling.textContent = 
    gameSettings.geminiEnabled ? 'Enabled' : 'Disabled';
  
  document.getElementById('gemini-api-key').value = gameSettings.geminiApiKey;
  document.getElementById('gemini-api-key').type = 'password';
  document.getElementById('btn-toggle-key').textContent = 'Show';
  document.getElementById('gemini-test-result').textContent = '';
}

function saveOptions() {
  // Read values from form
  gameSettings.musicVolume = parseInt(document.getElementById('music-volume').value);
  gameSettings.sfxVolume = parseInt(document.getElementById('sfx-volume').value);
  gameSettings.sanityJitterEnabled = document.getElementById('sanity-jitter').checked;
  gameSettings.textScrambleEnabled = document.getElementById('text-scramble').checked;
  gameSettings.geminiEnabled = document.getElementById('enable-gemini').checked;
  gameSettings.geminiApiKey = document.getElementById('gemini-api-key').value;
  
  // Persist settings
  saveSettings();
  
  // Apply settings immediately
  applySettings();
  
  // Close modal
  document.getElementById('options-modal').classList.add('hidden');
  
  console.log('[Settings] Saved:', gameSettings);
}

function cancelOptions() {
  document.getElementById('options-modal').classList.add('hidden');
}

function toggleApiKeyVisibility() {
  const input = document.getElementById('gemini-api-key');
  const btn = document.getElementById('btn-toggle-key');
  
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
}

async function testGeminiConnection() {
  const resultEl = document.getElementById('gemini-test-result');
  const testBtn = document.getElementById('btn-test-gemini');
  const apiKey = document.getElementById('gemini-api-key').value;
  
  if (!apiKey) {
    resultEl.textContent = 'No API key entered';
    resultEl.className = 'test-result error';
    return;
  }
  
  resultEl.textContent = 'Testing...';
  resultEl.className = 'test-result';
  testBtn.disabled = true;
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with only the word: connected' }] }]
        })
      }
    );
    
    if (response.ok) {
      resultEl.textContent = '✓ Connected!';
      resultEl.className = 'test-result success';
    } else {
      const data = await response.json();
      resultEl.textContent = '✗ ' + (data.error?.message || 'Connection failed');
      resultEl.className = 'test-result error';
    }
  } catch (e) {
    resultEl.textContent = '✗ Network error';
    resultEl.className = 'test-result error';
  }
  
  testBtn.disabled = false;
}

// ========================
// Confirm Dialog
// ========================
function showConfirmDialog(title, message, onConfirm) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  menuState.pendingConfirmAction = onConfirm;
  document.getElementById('confirm-dialog').classList.remove('hidden');
}

function confirmYes() {
  document.getElementById('confirm-dialog').classList.add('hidden');
  if (menuState.pendingConfirmAction) {
    menuState.pendingConfirmAction();
    menuState.pendingConfirmAction = null;
  }
}

function confirmNo() {
  document.getElementById('confirm-dialog').classList.add('hidden');
  menuState.pendingConfirmAction = null;
}

// ========================
// Settings Persistence
// ========================
function loadSettings() {
  try {
    const saved = localStorage.getItem('cryptonautsSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      gameSettings = { ...gameSettings, ...parsed };
      console.log('[Settings] Loaded settings');
    }
    
    // Also check for API key in config.js
    if (!gameSettings.geminiApiKey && window.CONFIG?.GEMINI_API_KEY) {
      gameSettings.geminiApiKey = window.CONFIG.GEMINI_API_KEY;
    }
  } catch (e) {
    console.warn('[Settings] Failed to load settings:', e);
  }
  
  applySettings();
}

function saveSettings() {
  try {
    localStorage.setItem('cryptonautsSettings', JSON.stringify(gameSettings));
    
    // Also save API key to dedicated storage for .env fallback
    if (gameSettings.geminiApiKey && typeof saveApiKeyToStorage === 'function') {
      saveApiKeyToStorage(gameSettings.geminiApiKey);
    }
  } catch (e) {
    console.warn('[Settings] Failed to save settings:', e);
  }
}

function applySettings() {
  // Apply Gemini settings to window.CONFIG
  if (window.CONFIG) {
    window.CONFIG.USE_GEMINI = gameSettings.geminiEnabled;
    if (gameSettings.geminiApiKey) {
      window.CONFIG.GEMINI_API_KEY = gameSettings.geminiApiKey;
    }
  }
  
  // Apply visual effect settings
  document.body.dataset.sanityEffects = gameSettings.sanityJitterEnabled ? 'enabled' : 'disabled';
  document.body.dataset.textScramble = gameSettings.textScrambleEnabled ? 'enabled' : 'disabled';
  
  // Apply audio volume settings
  updateMusicVolume();
}

function getGeminiConfig() {
  const apiKey = gameSettings.geminiApiKey || window.CONFIG?.GEMINI_API_KEY || '';
  const apiUrl = window.CONFIG?.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const timeout = window.CONFIG?.GEMINI_TIMEOUT || 15000;
  const useGemini = (gameSettings.geminiEnabled ?? window.CONFIG?.USE_GEMINI ?? false) && !!apiKey;

  return {
    apiKey,
    apiUrl,
    timeout,
    useGemini
  };
}

// ========================
// Save/Load Game State
// ========================
function checkForExistingSave() {
  return localStorage.getItem('cryptonautsExplorationState') !== null;
}

function clearSaveData() {
  localStorage.removeItem('cryptonautsExplorationState');
  console.log('[Save] Cleared save data');
}

function resetGameState() {
  gameState = {
    mode: GameMode.EXPLORATION,
    explorationPhase: ExplorationPhase.ROOM_ENTRY,
    currentRoomId: 'room_01_entrance',
    depth: 1,
    roomsVisited: {},
    roomHistory: [],
    player: null,
    companion: null,
    inventory: {},
    flags: {},
    roomActionTracker: {},
    currentSanityState: SANITY_STATES.STABLE,
    geminiAvailable: true,
    geminiFailCount: 0
  };
  setInventoryState({});
}

function startAutosave() {
  stopAutosave(); // Clear any existing interval
  
  autosaveInterval = setInterval(() => {
    if (!menuState.isPaused && gameState.mode === GameMode.EXPLORATION) {
      saveGameState();
      showAutosaveIndicator();
    }
  }, AUTOSAVE_INTERVAL_MS);
  
  console.log('[Autosave] Started autosave interval');
}

function stopAutosave() {
  if (autosaveInterval) {
    clearInterval(autosaveInterval);
    autosaveInterval = null;
    console.log('[Autosave] Stopped autosave');
  }
}

function showAutosaveIndicator(customText) {
  const indicator = document.getElementById('autosave-indicator');
  if (customText) {
    indicator.innerHTML = `<span class="save-icon">💾</span> ${customText}`;
  } else {
    indicator.innerHTML = '<span class="save-icon">💾</span> Saving...';
  }
  indicator.classList.remove('hidden');
  
  // Re-trigger animation
  indicator.style.animation = 'none';
  indicator.offsetHeight; // Trigger reflow
  indicator.style.animation = 'fade-in-out 2s ease-in-out';
  
  setTimeout(() => {
    indicator.classList.add('hidden');
  }, 2000);
}

async function loadGameData() {
  try {
    roomsData = await loadJsonResource('rooms.json', 'rooms');
    enemiesData = await loadJsonResource('enemies.json', 'enemies');
    charactersData = await loadJsonResource('characters.json', 'characters');

    if (!roomsData || !enemiesData || !charactersData) {
      showDataLoadError('Unable to load essential data files.');
      logEvent('⚠️ Failed to load exploration data files', 'warning');
      return false;
    }

    try {
      const itemDb = await loadItemDatabase('inventory.json');
      const itemsArray = Object.values(itemDb || {});
      inventoryCatalog = { items: itemsArray };
      console.log(`[Exploration] Loaded inventory catalog (${itemsArray.length} items)`);
    } catch (e) {
      console.warn('[Exploration] Failed to load inventory catalog, using empty set');
      inventoryCatalog = { items: [] };
    }

    console.log('[Exploration] Game data ready (rooms, enemies, characters loaded)');
    return true;
  } catch (error) {
    console.error('[Exploration] Failed to load game data:', error);
    showDataLoadError('A fatal error occurred while loading expedition data.');
    logEvent('⚠️ Error loading game data', 'warning');
    return false;
  }
}

// loadPartyData is now replaced by createPartyFromSelections for new games
// For continuing games, party is loaded from saved state
async function loadPartyData() {
  // This function is kept for backward compatibility but is mostly unused now
  // Party data comes from character creation or saved state
  if (!gameState.player) {
    // Create default party if needed (fallback)
    console.log('[Exploration] Creating default party...');
    const defaultClass = charactersData?.characters?.find(c => c.id === 'warrior');
    const defaultCompanion = charactersData?.companions?.find(c => c.id === 'eleanor');
    
    if (defaultClass && defaultCompanion) {
      creationState.playerClassId = 'warrior';
      creationState.playerGender = 'm';
      creationState.playerName = 'The Warrior';
      creationState.companionId = 'eleanor';
      await createPartyFromSelections();
    } else {
      // Ultimate fallback
      gameState.player = createDefaultCharacter('Cryptonaut', 'player');
      gameState.companion = createDefaultCharacter('Companion', 'companion');
    }
  }

  if (!gameState.inventory) {
    gameState.inventory = {};
  }
  setInventoryState(gameState.inventory);
}

async function hydrateCharacter(config, role) {
  // If character_file is specified, load from character spec
  if (config.character_file && config.character_id) {
    try {
      const specRes = await fetch(config.character_file);
      const specFile = await specRes.json();
      const spec = specFile.characters?.find(c => c.id === config.character_id);
      
      if (spec) {
        const baseStats = spec.base_stats || {};
        const genderKey = config.gender || 'm';
        const genderVariants = spec.gender_variants || {};
        const genderData = genderVariants[genderKey] || Object.values(genderVariants)[0] || {};
        
        const level = Number(config.level) || 0;
        const hpMultiplier = 1 + (0.15 * level);
        const sanityMultiplier = 1 + (0.15 * level);
        
        const baseHp = baseStats.hp ?? config.hp ?? 20;
        const baseSanity = baseStats.sanity ?? config.sanity ?? 15;
        
        return {
          id: role,
          name: config.name || spec.class || role,
          hp: Math.floor(baseHp * hpMultiplier),
          maxHp: Math.floor(baseHp * hpMultiplier),
          sanity: Math.floor(baseSanity * sanityMultiplier),
          maxSanity: Math.floor(baseSanity * sanityMultiplier),
          defense: baseStats.defense ?? config.defense ?? 0,
          level: level,
          xp: Number(config.xp) || 0,
          xpToNextLevel: Number(config.xpToNextLevel) || 50,
          statusEffects: [],
          portrait: resolvePortraitPath(genderData.portrait) || config.portrait || `assets/img/ally_portrait/warrior_male.png`,
          gender: genderKey
        };
      }
    } catch (e) {
      console.warn(`[Exploration] Could not load character spec:`, e);
    }
  }
  
  // Fallback to config values directly
  return {
    id: role,
    name: config.name || role,
    hp: config.hp ?? 20,
    maxHp: config.maxHp ?? config.hp ?? 20,
    sanity: config.sanity ?? 15,
    maxSanity: config.maxSanity ?? config.sanity ?? 15,
    defense: config.defense ?? 0,
    level: Number(config.level) || 0,
    xp: Number(config.xp) || 0,
    xpToNextLevel: Number(config.xpToNextLevel) || 50,
    statusEffects: [],
    portrait: config.portrait || `assets/img/ally_portrait/warrior_male.png`,
    gender: config.gender || 'm'
  };
}

function createDefaultCharacter(name, role) {
  return {
    id: role,
    name: name,
    hp: 20,
    maxHp: 20,
    sanity: 15,
    maxSanity: 15,
    defense: 2,
    level: 0,
    xp: 0,
    xpToNextLevel: 50,
    statusEffects: [],
    portrait: 'assets/img/ally_portrait/warrior_male.png',
    gender: 'm'
  };
}

function resolvePortraitPath(portraitId) {
  if (!portraitId) return null;
  if (portraitId.includes('/') || portraitId.includes('.')) {
    return portraitId;
  }
  return `assets/img/ally_portrait/${portraitId}.png`;
}

async function checkGeminiAvailability() {
  const config = getGeminiConfig();
  
  if (!config.useGemini || !config.apiKey) {
    gameState.geminiAvailable = false;
    updateGeminiStatus(false, 'Fallback Mode');
    console.log('[Exploration] Gemini disabled, using fallback mode');
    return;
  }
  
  // Quick ping test to Gemini
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${config.apiUrl}?key=${config.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'test' }] }],
        generationConfig: { maxOutputTokens: 10 }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    gameState.geminiAvailable = response.ok;
    updateGeminiStatus(response.ok, response.ok ? 'AI Connected' : 'AI Unavailable');
    
  } catch (error) {
    gameState.geminiAvailable = false;
    updateGeminiStatus(false, 'Fallback Mode');
    console.warn('[Exploration] Gemini unavailable:', error.message);
  }
}

function updateGeminiStatus(available, text) {
  const statusEl = document.getElementById('gemini-status');
  if (statusEl) {
    statusEl.textContent = text;
    statusEl.className = `gemini-status ${available ? 'online' : 'offline'}`;
  }
}

// ========================
// Room Navigation
// ========================

// Show room transition fade overlay
function showRoomTransition() {
  return new Promise((resolve) => {
    let overlay = document.getElementById('room-transition-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'room-transition-overlay';
      document.body.appendChild(overlay);
    }
    overlay.classList.remove('fade-out');
    overlay.classList.add('fade-in');
    setTimeout(resolve, 800); // Wait for fade-in to complete
  });
}

// Hide room transition fade overlay
function hideRoomTransition() {
  const overlay = document.getElementById('room-transition-overlay');
  if (overlay) {
    // Clear inline overrides so CSS classes control opacity
    overlay.style.opacity = '';
    overlay.style.pointerEvents = '';
    overlay.classList.remove('fade-in');
    overlay.classList.add('fade-out');
  }
}

async function enterRoom(roomId, softEntry = false, options = {}) {
  const { fromHistory = false, skipFade = false } = options;
  const room = getRoomById(roomId);
  if (!room) {
    console.error(`[Exploration] Room not found: ${roomId}`);
    logEvent(`⚠️ Unknown path ahead...`, 'warning');
    return;
  }
  
  // Show fade transition for non-soft entries (actual room navigation)
  if (!softEntry && !skipFade) {
    await showRoomTransition();
  }
  
  recordRoomHistoryTransition(roomId, { softEntry, fromHistory });
  
  gameState.mode = GameMode.EXPLORATION;
  gameState.explorationPhase = ExplorationPhase.ROOM_ENTRY;
  gameState.currentRoomId = roomId;
  gameState.depth = room.depth;
  ensureRoomActionTracker(roomId, softEntry);
  
  // Only increment visit counter on fresh entries
  if (!softEntry) {
    gameState.roomsVisited[roomId] = (gameState.roomsVisited[roomId] || 0) + 1;
    // Track rooms explored stat
    if (!gameState.stats) gameState.stats = { roomsExplored: 0, battlesFought: 0, enemiesDefeated: 0, itemsUsed: 0 };
    if (gameState.roomsVisited[roomId] === 1) {
      gameState.stats.roomsExplored++;
    }
  }
  
  // Update UI for new room
  updateRoomDisplay(room);
  updateUI();
  
  // Check for boss room
  if (room.type === 'boss') {
    gameState.mode = GameMode.BOSS;
    logEvent('⚔️ You have reached the Sanctum of the Old One!', 'warning');
    playBossMusic(); // Switch to boss music
  }

  if (!softEntry && shouldTriggerImmediateCombat(roomId)) {
    const combatConfig = FORCED_COMBAT_ROOMS[roomId];
    if (combatConfig) {
      gameState.flags[FORCED_COMBAT_FLAG_PREFIX + roomId] = true;
      triggerCombatTransition({
        enemyId: combatConfig.enemyId,
        reason: combatConfig.reason
      });
      return;
    }
  }
  
  // For soft entry (continuing game), just show the room with basic choices
  if (softEntry) {
    handleFallbackRoomEntry(room);
    return;
  }
  
  // Call Gemini for room description and choices
  showLoading(true);
  const response = await callGeminiExploration('ROOM_ENTRY', null);
  showLoading(false);
  
  if (response) {
    handleGeminiResponse(response);
  } else {
    // Fallback if Gemini fails
    handleFallbackRoomEntry(room);
  }
  
  // Hide fade transition after room is loaded
  if (!skipFade) {
    hideRoomTransition();
  }
  
  saveGameState();
}

function getRoomById(roomId) {
  if (!roomsData) return null;
  return roomsData.rooms.find(r => r.id === roomId);
}

function updateRoomDisplay(room) {
  document.getElementById('room-title').textContent = room.name;
  document.getElementById('current-depth').textContent = room.depth;
  
  const backdrop = document.getElementById('room-backdrop');
  // Use mapped image or room's specified image
  const imagePath = ROOM_IMAGES[room.id] || room.image || DEFAULT_ROOM_IMAGE;
  
  if (imagePath) {
    backdrop.style.backgroundImage = `url('${imagePath}')`;
  } else {
    backdrop.style.backgroundImage = '';
    backdrop.style.backgroundColor = '#1a1a2e';
  }
}

// ========================
// Gemini API Integration
// ========================
async function callGeminiExploration(phase, choiceId) {
  const config = getGeminiConfig();
  
  // Check if Gemini is available and enabled
  if (!config.useGemini || !config.apiKey || !gameState.geminiAvailable) {
    console.log('[Exploration] Using fallback (Gemini unavailable)');
    return null;
  }
  
  // If we've had too many failures, switch to fallback
  if (gameState.geminiFailCount >= 3) {
    console.log('[Exploration] Too many Gemini failures, using fallback');
    gameState.geminiAvailable = false;
    updateGeminiStatus(false, 'Fallback Mode');
    return null;
  }
  
  const room = getRoomById(gameState.currentRoomId);
  if (!room) return null;
  
  // Build the prompt
  const userPrompt = buildGeminiPrompt(phase, choiceId, room);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    const response = await fetch(`${config.apiUrl}?key=${config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${GEMINI_SYSTEM_PROMPT}\n\n${userPrompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Empty response from Gemini');
    }
    
    // Parse and validate the response
    const parsed = JSON.parse(text);
    
    // Reset fail count on success
    gameState.geminiFailCount = 0;
    
    return validateGeminiResponse(parsed, room);
    
  } catch (error) {
    console.error('[Exploration] Gemini API error:', error);
    gameState.geminiFailCount++;
    
    if (error.name === 'AbortError') {
      logEvent('⏳ AI response timed out, using fallback...', 'warning');
    }
    
    return null;
  }
}

function buildGeminiPrompt(phase, choiceId, room) {
  const stateContext = {
    player: {
      hp: gameState.player.hp,
      maxHp: gameState.player.maxHp,
      sanity: gameState.player.sanity,
      maxSanity: gameState.player.maxSanity,
      statusEffects: gameState.player.statusEffects
    },
    companion: gameState.companion ? {
      hp: gameState.companion.hp,
      maxHp: gameState.companion.maxHp,
      sanity: gameState.companion.sanity,
      maxSanity: gameState.companion.maxSanity,
      statusEffects: gameState.companion.statusEffects
    } : null,
    inventory: gameState.inventory,
    flags: gameState.flags,
    depth: gameState.depth,
    timesVisited: gameState.roomsVisited[room.id] || 1
  };
  
  const roomContext = {
    id: room.id,
    name: room.name,
    type: room.type,
    tags: room.tags,
    baseDescription: room.baseDescription,
    environmentFeatures: room.environmentFeatures,
    nextRooms: room.nextRooms,
    maxThreatLevel: room.maxThreatLevel,
    allowRest: room.allowRest,
    guaranteedEvents: room.guaranteedEvents,
    optionalEvents: room.optionalEvents
  };
  
  let prompt = `Current game state:\n${JSON.stringify(stateContext, null, 2)}\n\n`;
  prompt += `Current room:\n${JSON.stringify(roomContext, null, 2)}\n\n`;
  prompt += `Valid item IDs: ${JSON.stringify(roomsData.validItemIds)}\n`;
  prompt += `Valid enemy IDs: ${JSON.stringify(roomsData.validEnemyIds)}\n\n`;
  prompt += `Valid status effect IDs: ${JSON.stringify(VALID_STATUS_EFFECT_IDS)}\n\n`;
  prompt += `The UI will present 8 options per room. Provide as many rich, distinct choices as possible (we will pad if needed) and ensure at least one option could plausibly trigger combat (use type "combat" when appropriate). Each option is single-use per visit, so vary the intent and stakes.\n\n`;
  
  if (phase === 'ROOM_ENTRY') {
    prompt += `Phase: ROOM_ENTRY\n`;
    prompt += `The player just entered this room. Create atmospheric narration and 2-4 meaningful choices.\n`;
    prompt += `Consider the room's tags and features. If this is the player's first visit, include introductory elements.\n`;
  } else if (phase === 'AWAITING_CHOICE') {
    prompt += `Phase: AWAITING_CHOICE\n`;
    prompt += `Last choice selected: "${choiceId}"\n`;
    prompt += `Describe the outcome of this choice. Apply appropriate HP/sanity changes, items, or status effects.\n`;
    prompt += `If the choice was dangerous, consider triggering combat or a trap.\n`;
  } else if (phase === 'AFTERMATH') {
    prompt += `Phase: AFTERMATH\n`;
    prompt += `Combat just ended in victory. Narrate the aftermath and potentially offer loot or rest.\n`;
  }
  
  prompt += `\nReturn a valid GeminiExplorationResponse JSON object. No extra text.`;
  
  return prompt;
}

function validateGeminiResponse(response, room) {
  // Ensure required fields exist
  if (!response.narration) response.narration = room.baseDescription;
  if (!response.logMessages) response.logMessages = [];
  if (!response.choices) response.choices = [];
  if (!response.effects) response.effects = {};
  
  // Validate moveToRoom
  if (response.effects.moveToRoom) {
    const validRooms = room.nextRooms || [];
    if (!validRooms.includes(response.effects.moveToRoom)) {
      console.warn(`[Exploration] Invalid moveToRoom: ${response.effects.moveToRoom}`);
      response.effects.moveToRoom = null;
    }
  }
  
  // Validate triggerCombat
  if (response.effects.triggerCombat) {
    const validEnemies = roomsData.validEnemyIds || [];
    if (!validEnemies.includes(response.effects.triggerCombat.enemyId)) {
      console.warn(`[Exploration] Invalid enemyId: ${response.effects.triggerCombat.enemyId}`);
      response.effects.triggerCombat = null;
    }
  }
  
  // Validate inventory changes
  if (response.effects.inventoryChanges) {
    const validItems = roomsData.validItemIds || [];
    response.effects.inventoryChanges = response.effects.inventoryChanges.filter(change => {
      if (!validItems.includes(change.itemId)) {
        console.warn(`[Exploration] Invalid itemId: ${change.itemId}`);
        return false;
      }
      return true;
    });
  }

  if (response.effects.statusEffects) {
    response.effects.statusEffects = response.effects.statusEffects
      .map(entry => {
        if (!entry || !entry.effectId) {
          return null;
        }
        if (!VALID_STATUS_EFFECT_IDS.includes(entry.effectId)) {
          console.warn(`[Exploration] Invalid status effect: ${entry.effectId}`);
          return null;
        }
        const action = (entry.addOrRemove || entry.action || 'add').toLowerCase() === 'remove'
          ? 'remove'
          : 'add';
        return { ...entry, action, addOrRemove: action };
      })
      .filter(Boolean);
  }
  
  // Ensure at least one choice exists
  if (response.choices.length === 0) {
    const nextRoom = room.nextRooms?.[0];
    if (nextRoom) {
      response.choices.push({
        id: 'move_on',
        label: 'Continue onward',
        type: 'move'
      });
    }
  }
  
  return response;
}

// ========================
// Response Handling
// ========================
function handleGeminiResponse(response) {
  // 1. Update narration panel
  setNarration(response.narration);
  
  // 2. Push log messages
  response.logMessages.forEach(msg => logEvent(msg, 'narration'));
  
  // 3. Apply mechanical effects
  applyEffects(response.effects);
  
  // 4. Update UI after effects
  updateUI();
  
  // 5. Handle branching
  if (response.effects.gameOver) {
    handleGameOver();
    return;
  }
  
  if (response.effects.triggerCombat) {
    triggerCombatTransition(response.effects.triggerCombat);
    return;
  }
  
  if (response.effects.moveToRoom) {
    setTimeout(() => enterRoom(response.effects.moveToRoom), 500);
    return;
  }
  
  // 6. Show new choices
  renderChoices(response.choices);
  gameState.explorationPhase = ExplorationPhase.AWAITING_CHOICE;
}

function handleFallbackRoomEntry(room) {
  // Enhanced fallback with room-specific narration
  const narration = generateFallbackNarration(room);
  setNarration(narration);
  logEvent(`📜 You enter ${room.name}.`, 'narration');
  
  // Generate contextual choices based on room properties
  const choices = generateFallbackChoices(room);
  renderChoices(choices);
  gameState.explorationPhase = ExplorationPhase.AWAITING_CHOICE;
}

function generateFallbackNarration(room) {
  // Room-specific atmospheric additions
  const atmosphereByType = {
    'entrance': 'Cold air rises from the depths below, carrying whispers of forgotten ages.',
    'hall': 'Your footsteps echo against ancient stone, disturbing dust that has lain undisturbed for centuries.',
    'side_room': 'The cramped space presses close, shadows dancing at the edge of your torchlight.',
    'chamber': 'The weight of countless dead seems to press down from above.',
    'corridor': 'Water drips in unseen corners, each drop counting down to something unspeakable.',
    'ritual_hall': 'The air itself seems to vibrate with residual power from rituals long past.',
    'antechamber': 'Reality feels thin here, ready to break and spill forth true madness.',
    'boss': 'The darkness here is alive, pulsing with malevolent intent.'
  };
  
  const atmosphere = atmosphereByType[room.type] || 'An oppressive silence hangs over this place.';
  
  // Add random environmental detail from room features
  let featureDetail = '';
  if (room.environmentFeatures && room.environmentFeatures.length > 0) {
    const feature = room.environmentFeatures[Math.floor(Math.random() * room.environmentFeatures.length)];
    featureDetail = `\n\nYou notice ${feature}.`;
  }
  
  return `${room.baseDescription}\n\n${atmosphere}${featureDetail}`;
}

function generateFallbackChoices(room) {
  const choices = [];
  
  // Search option (always available)
  choices.push({
    id: 'search_room',
    label: 'Search the area carefully',
    type: 'search',
    description: 'Look for useful items or hidden secrets'
  });
  
  // Examine option based on room features
  if (room.environmentFeatures && room.environmentFeatures.length > 0) {
    const feature = room.environmentFeatures[Math.floor(Math.random() * room.environmentFeatures.length)];
    choices.push({
      id: 'examine_feature',
      label: `Examine the ${feature}`,
      type: 'interact',
      description: 'Investigate more closely',
      feature: feature
    });
  }
  
  choices.push({
    id: 'rest_here',
    label: 'Rest and recover',
    type: 'rest',
    description: 'Take a moment to regain your strength'
  });
  
  return choices;
}

// ========================
// Effect Application
// ========================
function normalizeEffectDelta(entry) {
  if (!entry) return 0;
  const raw = entry.delta ?? entry.amount ?? entry.value ?? 0;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
}

function applyEffects(effects) {
  if (!effects) return;
  
  // HP changes
  if (effects.hpChanges) {
    effects.hpChanges.forEach(change => {
      const delta = normalizeEffectDelta(change);
      if (delta !== 0) {
        applyHpChange(change.target, delta, change.reason);
      }
    });
  }
  
  // Sanity changes
  if (effects.sanityChanges) {
    effects.sanityChanges.forEach(change => {
      const delta = normalizeEffectDelta(change);
      if (delta !== 0) {
        applySanityChange(change.target, delta, change.reason);
      }
    });
  }
  
  // Inventory changes
  if (effects.inventoryChanges) {
    effects.inventoryChanges.forEach(change => {
      const delta = normalizeEffectDelta(change);
      if (change.itemId && delta !== 0) {
        applyInventoryChange(change.itemId, delta, change.reason);
      }
    });
  }
  
  // Status effects
  if (effects.statusEffects) {
    effects.statusEffects.forEach(change => {
      const action = change.addOrRemove || change.action || 'add';
      applyStatusEffect(change.target, change.effectId, action, change.reason);
    });
  }
  
  // Flags
  if (effects.flagsSet) {
    effects.flagsSet.forEach(flag => {
      gameState.flags[flag] = true;
      console.log(`[Exploration] Flag set: ${flag}`);
    });
  }
  
  if (effects.flagsCleared) {
    effects.flagsCleared.forEach(flag => {
      delete gameState.flags[flag];
      console.log(`[Exploration] Flag cleared: ${flag}`);
    });
  }
  
  // Update sanity state
  updateSanityState();
}

function applyHpChange(target, delta, reason) {
  const targets = getTargets(target);
  targets.forEach(char => {
    const before = char.hp;
    char.hp = Math.max(0, Math.min(char.maxHp, char.hp + delta));
    const actual = char.hp - before;
    
    if (actual !== 0) {
      const prefix = actual > 0 ? '💚' : '💔';
      const verb = actual > 0 ? 'recovers' : 'loses';
      logEvent(`${prefix} ${char.name} ${verb} ${Math.abs(actual)} HP${reason ? ` (${reason})` : ''}.`, actual > 0 ? 'heal' : 'damage');
    }
  });
}

function applySanityChange(target, delta, reason) {
  const targets = getTargets(target);
  targets.forEach(char => {
    const before = char.sanity;
    char.sanity = Math.max(0, Math.min(char.maxSanity, char.sanity + delta));
    const actual = char.sanity - before;
    
    if (actual !== 0) {
      const prefix = actual > 0 ? '🧠' : '🌀';
      const verb = actual > 0 ? 'steadies their mind' : 'feels their grip on reality slip';
      logEvent(`${prefix} ${char.name} ${verb} (${actual > 0 ? '+' : ''}${actual} sanity)${reason ? ` - ${reason}` : ''}.`, actual > 0 ? 'heal' : 'damage');
    }
  });
}

function applyInventoryChange(itemId, delta, reason) {
  const changeAmount = Number(delta);
  if (!itemId || !Number.isFinite(changeAmount) || changeAmount === 0) {
    return;
  }

  syncInventoryFromSystem();
  const before = gameState.inventory[itemId] || 0;
  let actualDelta = 0;

  if (changeAmount > 0) {
    if (typeof addToInventory === 'function') {
      addToInventory(itemId, changeAmount);
    } else {
      gameState.inventory[itemId] = before + changeAmount;
    }
  } else {
    const removable = Math.min(before, Math.abs(changeAmount));
    if (removable > 0) {
      if (typeof removeFromInventory === 'function') {
        removeFromInventory(itemId, removable);
      } else {
        gameState.inventory[itemId] = Math.max(0, before - removable);
      }
      // Track items used stat
      if (!gameState.stats) gameState.stats = { roomsExplored: 0, battlesFought: 0, enemiesDefeated: 0, itemsUsed: 0 };
      gameState.stats.itemsUsed += removable;
    } else {
      console.warn(`[Inventory] Attempted to remove ${itemId} but none available.`);
    }
  }

  syncInventoryFromSystem();
  const after = gameState.inventory[itemId] || 0;
  actualDelta = after - before;

  if (actualDelta !== 0) {
    const prefix = actualDelta > 0 ? '📦' : '📤';
    const verb = actualDelta > 0 ? 'Found' : 'Lost';
    const itemName = getItemName(itemId);
    logEvent(`${prefix} ${verb}: ${itemName} x${Math.abs(actualDelta)}${reason ? ` (${reason})` : ''}.`, 'item');
  }
}

function applyStatusEffect(target, effectId, addOrRemove, reason) {
  if (!effectId || !VALID_STATUS_EFFECT_IDS.includes(effectId)) {
    console.warn(`[Exploration] Ignoring unsupported status effect: ${effectId}`);
    return;
  }
  const targets = getTargets(target);
  targets.forEach(char => {
    if (!Array.isArray(char.statusEffects)) {
      char.statusEffects = [];
    }
    if (addOrRemove === 'add') {
      if (!char.statusEffects.includes(effectId)) {
        char.statusEffects.push(effectId);
        logEvent(`⚡ ${char.name} is now ${effectId}${reason ? ` (${reason})` : ''}.`, 'warning');
      }
    } else {
      const index = char.statusEffects.indexOf(effectId);
      if (index > -1) {
        char.statusEffects.splice(index, 1);
        logEvent(`✨ ${char.name} is no longer ${effectId}.`, 'heal');
      }
    }
  });
}

function getTargets(target) {
  const targets = [];
  const addPlayer = () => { if (gameState.player) targets.push(gameState.player); };
  const addCompanion = () => { if (gameState.companion) targets.push(gameState.companion); };
  
  switch (target) {
    case 'player':
      addPlayer();
      break;
    case 'companion':
      addCompanion();
      break;
    case 'party':
      addPlayer();
      addCompanion();
      break;
    default:
      break;
  }
  
  return targets;
}

function getItemName(itemId) {
  if (typeof getItemDef === 'function') {
    const def = getItemDef(itemId);
    if (def?.name) {
      return def.name;
    }
  }
  // Try to get friendly name from catalog, fallback to ID
  if (inventoryCatalog?.items) {
    const item = inventoryCatalog.items.find(i => i.item_id === itemId || i.id === itemId);
    if (item) return item.name;
  }
  // Convert snake_case to Title Case
  return itemId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ========================
// Sanity State System
// ========================
function updateSanityState() {
  if (!gameState.player) return;
  
  const sanityPercent = gameState.player.sanity / gameState.player.maxSanity;
  let newState;
  
  if (sanityPercent > 0.5) {
    newState = SANITY_STATES.STABLE;
  } else if (sanityPercent > 0.25) {
    newState = SANITY_STATES.SHAKEN;
  } else {
    newState = SANITY_STATES.BROKEN;
  }
  
  if (newState !== gameState.currentSanityState) {
    gameState.currentSanityState = newState;
    document.getElementById('exploration-screen').dataset.sanityState = newState;
    console.log(`[Exploration] Sanity state: ${newState}`);
    
    if (newState === SANITY_STATES.BROKEN && gameState.player.sanity === 0) {
      logEvent('🌀 Your mind shatters... but you press on through the madness!', 'warning');
    }
  }
}

// ========================
// UI Functions
// ========================
function updateUI() {
  if (!gameState.player) {
    if (!playerInitWarned) {
      console.warn('[Exploration] updateUI called before player initialization');
      playerInitWarned = true;
    }
    return;
  }
  playerInitWarned = false;
  // Player stats
  document.getElementById('explorer-player-name').textContent = gameState.player.name;
  const pLevel = document.getElementById('explorer-player-level');
  if (pLevel) pLevel.textContent = `Lv.${gameState.player.level || 0}`;
  const pXp = document.getElementById('explorer-player-xp');
  if (pXp) pXp.textContent = gameState.player.xp || 0;
  const pNextXp = document.getElementById('explorer-player-next-xp');
  if (pNextXp) pNextXp.textContent = gameState.player.xpToNextLevel || 50;

  document.getElementById('explorer-player-hp').textContent = gameState.player.hp;
  document.getElementById('explorer-player-maxhp').textContent = gameState.player.maxHp;
  document.getElementById('explorer-player-sanity').textContent = gameState.player.sanity;
  document.getElementById('explorer-player-maxsanity').textContent = gameState.player.maxSanity;
  
  // Update player HP and Sanity bars
  const playerHpPercent = Math.max(0, Math.min(100, (gameState.player.hp / gameState.player.maxHp) * 100));
  const playerSanityPercent = Math.max(0, Math.min(100, (gameState.player.sanity / gameState.player.maxSanity) * 100));
  const playerHpBar = document.getElementById('explorer-player-hp-bar');
  const playerSanityBar = document.getElementById('explorer-player-sanity-bar');
  if (playerHpBar) playerHpBar.style.width = playerHpPercent + '%';
  if (playerSanityBar) playerSanityBar.style.width = playerSanityPercent + '%';
  
  const playerPortraitImg = document.querySelector('#player-card img');
  if (playerPortraitImg) {
    const portraitSrc = gameState.player.portrait || 'assets/img/ally_portrait/warrior_male.png';
    if (playerPortraitImg.getAttribute('src') !== portraitSrc) {
      playerPortraitImg.setAttribute('src', portraitSrc);
    }
    playerPortraitImg.setAttribute('alt', gameState.player.name || 'Player');
  }
  
  const playerStatusEl = document.getElementById('explorer-player-status');
  playerStatusEl.innerHTML = renderStatusEffectEmojis(gameState.player.statusEffects) || '';
  
  // Companion stats
  if (gameState.companion) {
    document.getElementById('explorer-companion-name').textContent = gameState.companion.name;
    const cLevel = document.getElementById('explorer-companion-level');
    if (cLevel) cLevel.textContent = `Lv.${gameState.companion.level || 0}`;
    const cXp = document.getElementById('explorer-companion-xp');
    if (cXp) cXp.textContent = gameState.companion.xp || 0;
    const cNextXp = document.getElementById('explorer-companion-next-xp');
    if (cNextXp) cNextXp.textContent = gameState.companion.xpToNextLevel || 50;

    document.getElementById('explorer-companion-hp').textContent = gameState.companion.hp;
    document.getElementById('explorer-companion-maxhp').textContent = gameState.companion.maxHp;
    document.getElementById('explorer-companion-sanity').textContent = gameState.companion.sanity;
    document.getElementById('explorer-companion-maxsanity').textContent = gameState.companion.maxSanity;
    
    // Update companion HP and Sanity bars
    const compHpPercent = Math.max(0, Math.min(100, (gameState.companion.hp / gameState.companion.maxHp) * 100));
    const compSanityPercent = Math.max(0, Math.min(100, (gameState.companion.sanity / gameState.companion.maxSanity) * 100));
    const compHpBar = document.getElementById('explorer-companion-hp-bar');
    const compSanityBar = document.getElementById('explorer-companion-sanity-bar');
    if (compHpBar) compHpBar.style.width = compHpPercent + '%';
    if (compSanityBar) compSanityBar.style.width = compSanityPercent + '%';
    
    const companionPortraitImg = document.querySelector('#companion-card img');
    if (companionPortraitImg) {
      const companionSrc = gameState.companion.portrait || 'assets/img/ally_portrait/warrior_male.png';
      if (companionPortraitImg.getAttribute('src') !== companionSrc) {
        companionPortraitImg.setAttribute('src', companionSrc);
      }
      companionPortraitImg.setAttribute('alt', gameState.companion.name || 'Companion');
    }
    
    const companionStatusEl = document.getElementById('explorer-companion-status');
    companionStatusEl.innerHTML = renderStatusEffectEmojis(gameState.companion.statusEffects) || '';
  }
  
  // Inventory
  renderInventory();
  renderNavigationControls();
  
  // Sanity state visual
  document.getElementById('exploration-screen').dataset.sanityState = gameState.currentSanityState;
}

function renderInventory() {
  const listEl = document.getElementById('inventory-list');
  listEl.innerHTML = '';
  
  const items = Object.entries(gameState.inventory);
  if (items.length === 0) {
    listEl.innerHTML = '<div class="inventory-empty">Empty</div>';
    return;
  }
  
  items.forEach(([itemId, count]) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'inventory-item';
    itemEl.innerHTML = `
      <span class="item-name">${getItemName(itemId)}</span>
      <span class="item-count">x${count}</span>
    `;
    listEl.appendChild(itemEl);
  });
}

function renderNavigationControls() {
  const room = getRoomById(gameState.currentRoomId);
  if (!room) {
    return;
  }

  const backGroup = document.getElementById('nav-backtrack-group');
  const backBtn = document.getElementById('nav-back-btn');
  const previousRoomId = getPreviousRoomFromHistory();
  if (backGroup) {
    backGroup.classList.toggle('hidden', !previousRoomId);
  }
  if (backBtn) {
    if (previousRoomId) {
      const previousRoom = getRoomById(previousRoomId);
      backBtn.textContent = `Return to ${previousRoom?.name || 'the previous room'}`;
      backBtn.onclick = () => handleNavigationBack(previousRoomId);
    } else {
      backBtn.onclick = null;
    }
  }

  const forwardContainer = document.getElementById('nav-forward-buttons');
  if (!forwardContainer) {
    return;
  }
  forwardContainer.innerHTML = '';

  const nextRooms = Array.isArray(room.nextRooms) ? room.nextRooms : [];
  if (!nextRooms.length) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'nav-empty-message';
    emptyMessage.textContent = 'No routes onward.';
    forwardContainer.appendChild(emptyMessage);
    return;
  }

  nextRooms.forEach(nextRoomId => {
    if (!nextRoomId) return;
    const nextRoom = getRoomById(nextRoomId);
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.textContent = nextRoom ? `Advance to ${nextRoom.name}` : 'Proceed onward';
    if (nextRoom?.depth) {
      btn.title = `Depth ${nextRoom.depth}`;
    }
    btn.addEventListener('click', () => handleNavigationForward(nextRoomId));
    forwardContainer.appendChild(btn);
  });
}

async function handleNavigationForward(nextRoomId) {
  if (!nextRoomId || navigationLocked) {
    return;
  }
  navigationLocked = true;
  const nextRoom = getRoomById(nextRoomId);
  logEvent(`🚶 You press onward toward ${nextRoom?.name || 'the next chamber'}.`, 'action');
  try {
    await enterRoom(nextRoomId);
  } finally {
    navigationLocked = false;
  }
}

async function handleNavigationBack(targetRoomId) {
  if (!targetRoomId || navigationLocked) {
    return;
  }
  navigationLocked = true;
  const previousRoom = getRoomById(targetRoomId);
  logEvent(`↩️ You retrace your steps toward ${previousRoom?.name || 'familiar ground'}.`, 'action');
  try {
    await enterRoom(targetRoomId, false, { fromHistory: true });
  } finally {
    navigationLocked = false;
  }
}

function setNarration(text) {
  const narrationEl = document.getElementById('narration-text');
  // Split into paragraphs if there are line breaks
  const paragraphs = text.split('\n').filter(p => p.trim());
  narrationEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
}

function renderChoices(choices = []) {
  const container = document.getElementById('choice-buttons');
  container.innerHTML = '';

  const room = getRoomById(gameState.currentRoomId);
  const preparedChoices = normalizeRoomChoices(choices, room);
  const usage = getRoomActionUsage(gameState.currentRoomId);
  const limitReached = usage.totalSelections >= ROOM_SELECTION_LIMIT;

  preparedChoices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';

    if (choice.type) {
      btn.classList.add(`choice-${choice.type}`);
    }

    btn.textContent = choice.label;
    btn.dataset.choiceId = choice.id;

    if (choice.description) {
      btn.title = choice.description;
    }

    if (choice.targetRoom) {
      btn.dataset.targetRoom = choice.targetRoom;
    }

    const bypassLimit = choiceBypassesRoomLimit(choice, room);
    if (bypassLimit) {
      btn.dataset.ignoreRoomLimit = 'true';
    }

    const alreadyUsed = usage.usedChoices.includes(choice.id);
    const limitApplies = limitReached && !bypassLimit;
    if (alreadyUsed || limitApplies) {
      btn.disabled = true;
      btn.classList.add('choice-used');
    }

    btn.addEventListener('click', () => onChoiceClicked(choice));
    container.appendChild(btn);
  });

}

function logEvent(message, type = 'narration') {
  const logEl = document.getElementById('exploration-log');
  const entry = document.createElement('div');
  entry.className = `log-${type}`;
  entry.textContent = `> ${message}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
  
  // Store in adventure log for post-mortem (limit to 100 entries)
  if (!gameState.adventureLog) gameState.adventureLog = [];
  gameState.adventureLog.push(message);
  if (gameState.adventureLog.length > 100) {
    gameState.adventureLog.shift();
  }
}

function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.toggle('hidden', !show);
}

// ========================
// Choice Handling
// ========================
function ensureRoomActionTracker(roomId, preserveExisting = true) {
  if (!gameState.roomActionTracker) {
    gameState.roomActionTracker = {};
  }
  const existing = gameState.roomActionTracker[roomId];
  if (!existing || !preserveExisting) {
    gameState.roomActionTracker[roomId] = {
      usedChoices: [],
      totalSelections: 0
    };
  }
  return gameState.roomActionTracker[roomId];
}

function shouldTriggerImmediateCombat(roomId) {
  if (!FORCED_COMBAT_ROOMS[roomId]) {
    return false;
  }
  return !gameState.flags?.[FORCED_COMBAT_FLAG_PREFIX + roomId];
}

function getRoomHistoryStack() {
  if (!Array.isArray(gameState.roomHistory)) {
    gameState.roomHistory = [];
  }
  return gameState.roomHistory;
}

function getPreviousRoomFromHistory() {
  const stack = getRoomHistoryStack();
  if (stack.length === 0) {
    return null;
  }
  return stack[stack.length - 1];
}

function recordRoomHistoryTransition(nextRoomId, options = {}) {
  const { softEntry = false, fromHistory = false } = options;
  if (softEntry) {
    return;
  }

  const stack = getRoomHistoryStack();
  const previousRoomId = gameState.currentRoomId;

  if (fromHistory) {
    if (stack.length === 0) {
      return;
    }
    const popped = stack.pop();
    if (popped !== nextRoomId) {
      const fallbackIndex = stack.lastIndexOf(nextRoomId);
      if (fallbackIndex >= 0) {
        stack.splice(fallbackIndex, 1);
      }
    }
    return;
  }

  if (!previousRoomId || previousRoomId === nextRoomId) {
    return;
  }

  stack.push(previousRoomId);

  if (stack.length > ROOM_HISTORY_MAX_ENTRIES) {
    gameState.roomHistory = stack.slice(-ROOM_HISTORY_MAX_ENTRIES);
  }
}

function isChoiceAlreadyUsed(roomId, choiceId) {
  const tracker = ensureRoomActionTracker(roomId);
  return tracker.usedChoices?.includes(choiceId);
}

function markChoiceUsed(roomId, choiceId, options = {}) {
  const { skipLimitIncrement = false } = options;
  const tracker = ensureRoomActionTracker(roomId);
  const previousCount = tracker.totalSelections || 0;
  if (!tracker.usedChoices.includes(choiceId)) {
    tracker.usedChoices.push(choiceId);
  }
  const updatedCount = skipLimitIncrement ? previousCount : previousCount + 1;
  tracker.totalSelections = Math.min(ROOM_SELECTION_LIMIT, updatedCount);
  return !skipLimitIncrement && previousCount < ROOM_SELECTION_LIMIT && tracker.totalSelections >= ROOM_SELECTION_LIMIT;
}

function roomSelectionLimitReached(roomId) {
  const tracker = ensureRoomActionTracker(roomId);
  return (tracker.totalSelections || 0) >= ROOM_SELECTION_LIMIT;
}

function getRoomActionUsage(roomId) {
  const tracker = ensureRoomActionTracker(roomId);
  return {
    usedChoices: tracker.usedChoices || [],
    totalSelections: tracker.totalSelections || 0
  };
}

function choiceBypassesRoomLimit(choice, room = getRoomById(gameState.currentRoomId)) {
  if (!choice) return false;
  if (choice.meta?.ignoreRoomLimit) {
    return true;
  }
  if (room?.type === 'boss') {
    const idText = (choice.id || '').toLowerCase();
    const labelText = (choice.label || '').toLowerCase();
    if (choice.type === 'boss') return true;
    if (idText.includes('boss') || idText.includes('old_one')) return true;
    if (labelText.includes('boss') || labelText.includes('old one')) return true;
  }
  return false;
}

function normalizeChoiceId(baseId, seen) {
  let safeId = baseId || 'choice_option';
  safeId = safeId.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  if (!safeId) {
    safeId = 'choice_option';
  }
  let suffix = 1;
  let uniqueId = safeId;
  while (seen.has(uniqueId)) {
    suffix += 1;
    uniqueId = `${safeId}_${suffix}`;
  }
  return uniqueId;
}

function normalizeRoomChoices(rawChoices = [], room = null) {
  const prepared = [];
  const seen = new Set();
  rawChoices.forEach((choice, index) => {
    if (!choice) return;
    if (choice.type === 'move' || choice.meta?.backtrack) {
      return;
    }
    const candidate = { ...choice };
    let candidateId = candidate.id;
    if (!candidateId) {
      const baseId = candidate.label || `choice_${index + 1}`;
      candidateId = normalizeChoiceId(baseId, seen);
    } else if (seen.has(candidateId)) {
      candidateId = normalizeChoiceId(candidateId, seen);
    }
    candidate.id = candidateId;
    if (seen.has(candidate.id) || prepared.length >= ROOM_OPTION_COUNT) {
      return;
    }
    seen.add(candidate.id);
    prepared.push(candidate);
  });

  if (!prepared.some(choice => choice?.type === 'rest')) {
    let restId = 'rest_here';
    if (seen.has(restId)) {
      restId = normalizeChoiceId(restId, seen);
    }
    const restChoice = {
      id: restId,
      label: 'Rest and recover',
      type: 'rest',
      description: 'Take a moment to regain your strength'
    };
    prepared.push(restChoice);
    seen.add(restId);
  }

  if (!prepared.some(isCombatChoice)) {
    const combatChoice = generateCombatChoice(room);
    if (!seen.has(combatChoice.id)) {
      prepared.push(combatChoice);
      seen.add(combatChoice.id);
    }
  }

  let supplementalIndex = 0;
  while (prepared.length < ROOM_OPTION_COUNT && supplementalIndex < SUPPLEMENTAL_CHOICE_BLUEPRINTS.length) {
    const blueprint = SUPPLEMENTAL_CHOICE_BLUEPRINTS[supplementalIndex++];
    if (!blueprint) break;
    if (seen.has(blueprint.id)) continue;
    prepared.push({ ...blueprint });
    seen.add(blueprint.id);
  }

  while (prepared.length < ROOM_OPTION_COUNT) {
    const fillerIndex = prepared.length + 1;
    const fillerChoice = generateSupplementalChoice(fillerIndex);
    if (seen.has(fillerChoice.id)) {
      continue;
    }
    prepared.push(fillerChoice);
    seen.add(fillerChoice.id);
  }

  if (prepared.length > ROOM_OPTION_COUNT) {
    const trimmed = prepared.slice(0, ROOM_OPTION_COUNT);
    const ensureChoiceIncluded = (predicate) => {
      const requiredIndex = prepared.findIndex(predicate);
      if (requiredIndex < 0 || requiredIndex < ROOM_OPTION_COUNT) {
        return;
      }
      if (trimmed.some(predicate)) {
        return;
      }
      for (let i = trimmed.length - 1; i >= 0; i--) {
        if (!predicate(trimmed[i])) {
          trimmed[i] = prepared[requiredIndex];
          return;
        }
      }
    };

    ensureChoiceIncluded(choice => choice?.type === 'rest');
    ensureChoiceIncluded(isCombatChoice);

    return trimmed;
  }

  return prepared;
}

function isCombatChoice(choice) {
  return choice?.type === 'combat' || choice?.meta?.forcesCombat;
}

function generateCombatChoice(room) {
  const label = room?.type === 'boss'
    ? 'Confront the looming horror'
    : 'Flush out whatever stalks you';
  return {
    id: 'forced_combat_option',
    label,
    type: 'combat',
    description: 'Force the hidden threat to reveal itself.',
    meta: { forcesCombat: true }
  };
}

function generateSupplementalChoice(index) {
  const fillerId = `supplemental_${index}`;
  return {
    id: fillerId,
    label: 'Maintain vigilance',
    type: 'lore',
    description: 'Keep watch for anything unusual.'
  };
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateChoiceButtonsState() {
  const roomId = gameState.currentRoomId;
  const usage = getRoomActionUsage(roomId);
  const limitReached = usage.totalSelections >= ROOM_SELECTION_LIMIT;
  document.querySelectorAll('.choice-btn').forEach(btn => {
    const choiceId = btn.dataset.choiceId;
    const bypassLimit = btn.dataset.ignoreRoomLimit === 'true';
    const alreadyUsed = usage.usedChoices.includes(choiceId);
    if (alreadyUsed || (limitReached && !bypassLimit)) {
      btn.disabled = true;
      btn.classList.add('choice-used');
    } else {
      btn.classList.remove('choice-used');
      btn.disabled = false;
    }
  });
}

async function onChoiceClicked(choice) {
  const roomId = gameState.currentRoomId;
  const room = getRoomById(roomId);
  const bypassLimit = choiceBypassesRoomLimit(choice, room);
  if (!bypassLimit && roomSelectionLimitReached(roomId)) {
    logEvent('You cannot take any more actions in this room.', 'warning');
    updateChoiceButtonsState();
    return;
  }
  if (isChoiceAlreadyUsed(roomId, choice.id)) {
    logEvent('That option has already been resolved in this room.', 'warning');
    updateChoiceButtonsState();
    return;
  }

  document.querySelectorAll('.choice-btn').forEach(btn => btn.disabled = true);
  gameState.explorationPhase = ExplorationPhase.PROCESSING;
  logEvent(`You chose: ${choice.label}`, 'action');

  playRandomExplorationOptionSound();
  await wait(2000);

  const limitReachedNow = markChoiceUsed(roomId, choice.id, { skipLimitIncrement: bypassLimit });
  updateChoiceButtonsState();
  if (limitReachedNow) {
    logEvent('You cannot take any more actions in this room.', 'warning');
  }

  const currentRoom = room;

  if (choice.meta?.forcesCombat) {
    const enemyId = getRandomEnemyForRoom(currentRoom) || 'cultist';
    triggerCombatTransition({
      enemyId,
      reason: choice.description || 'You call out the lurking foe!'
    });
    return;
  }

  if (choice.id === 'rest_here') {
    handleRest();
    return;
  }
  
  showLoading(true);
  const response = await callGeminiExploration('AWAITING_CHOICE', choice.id);
  showLoading(false);
  
  if (response) {
    handleGeminiResponse(response);
  } else {
    handleFallbackChoice(choice);
  }
  
  saveGameState();
}

function handleFallbackChoice(choice) {
  // Comprehensive fallback responses when Gemini is unavailable
  const room = getRoomById(gameState.currentRoomId);
  
  if (choice.id === 'search_room') {
    handleFallbackSearch(room);
  } else if (choice.id === 'examine_feature') {
    handleFallbackExamine(room, choice.feature);
  } else {
    setNarration('You proceed cautiously, senses alert for danger...');
  }
  
  // Check for random encounter
  if (shouldTriggerRandomEncounter(room)) {
    const enemyId = getRandomEnemyForRoom(room);
    if (enemyId) {
      triggerCombatTransition({
        enemyId: enemyId,
        reason: getRandomEncounterReason()
      });
      return;
    }
  }
  
  // Re-render choices
  setTimeout(() => {
    const choices = generateFallbackChoices(room);
    renderChoices(choices);
  }, 500);
}

function handleFallbackSearch(room) {
  const roll = Math.random();
  
  if (roll < 0.35) {
    // Found an item
    const validItems = roomsData?.validItemIds || ['herbal_tonic', 'vial_vital_humours'];
    const commonItems = ['herbal_tonic', 'coagulant_seal_bandages', 'purging_bitter_tincture'];
    const itemPool = commonItems.filter(i => validItems.includes(i));
    const foundItem = itemPool[Math.floor(Math.random() * itemPool.length)] || 'herbal_tonic';
    
    applyInventoryChange(foundItem, 1, 'Found while searching');
    setNarration('Your careful search reveals something useful hidden among the debris. A small victory in this forsaken place.');
    logEvent(`🔍 Your search proved fruitful.`, 'action');
    
  } else if (roll < 0.55) {
    // Found nothing, minor sanity loss
    applySanityChange('player', -1, 'Fruitless search in the dark');
    setNarration('You search thoroughly but find nothing of value. The oppressive darkness seems to mock your efforts, and doubt creeps into your mind.');
    logEvent(`🔍 The search yields nothing but growing unease.`, 'action');
    
  } else if (roll < 0.70) {
    // Trap or hazard
    const trapDamage = Math.floor(Math.random() * 4) + 2;
    applyHpChange('player', -trapDamage, 'Hidden trap');
    setNarration('Your hand brushes against something sharp hidden in the shadows. Pain flares as rusted metal bites into flesh.');
    logEvent(`⚠️ A hidden hazard wounds you!`, 'warning');
    
  } else {
    // Just atmosphere
    const atmosphericFinds = [
      'You find only dust, bones, and the remnants of lives long ended.',
      'Ancient scratches mark the walls here - perhaps claw marks, perhaps desperate fingernails.',
      'A faded journal page crumbles at your touch, its secrets lost forever.',
      'The shadows seem to shift and watch as you search. You find nothing material, but the feeling of being observed lingers.'
    ];
    setNarration(atmosphericFinds[Math.floor(Math.random() * atmosphericFinds.length)]);
    logEvent(`🔍 Your search reveals only echoes of the past.`, 'narration');
  }
  
  updateUI();
}

function handleFallbackExamine(room, feature) {
  const roll = Math.random();
  
  if (roll < 0.3) {
    // Interesting discovery with sanity cost
    applySanityChange('player', -2, `Disturbing discovery examining ${feature}`);
    setNarration(`Examining the ${feature} more closely reveals disturbing details that sear themselves into your memory. Some knowledge comes at a cost.`);
    
    // Maybe set a flag
    if (Math.random() < 0.3) {
      gameState.flags[`examined_${room.id}`] = true;
      logEvent(`📖 You've uncovered something significant here.`, 'item');
    }
  } else if (roll < 0.5) {
    // Found a clue or item
    const clueItems = ['tincture_of_lucidity', 'sigil_of_warding', 'dreamless_incense'];
    const validItems = roomsData?.validItemIds || [];
    const available = clueItems.filter(i => validItems.includes(i));
    
    if (available.length > 0 && Math.random() < 0.4) {
      const item = available[Math.floor(Math.random() * available.length)];
      applyInventoryChange(item, 1, `Hidden near ${feature}`);
    }
    setNarration(`Your examination of the ${feature} reveals more than expected. The ancients left their mark here in ways both subtle and sinister.`);
  } else {
    // Just flavor
    setNarration(`You study the ${feature} intently. Though it yields no immediate reward, understanding this place may prove valuable... or fatal.`);
  }
  
  updateUI();
}

function shouldTriggerRandomEncounter(room) {
  // Higher threat rooms have higher encounter chance
  const baseChance = (room.maxThreatLevel || 1) * 0.08;
  
  // Increase if player has been in room a while (more actions)
  const actionPenalty = (gameState.roomsVisited[room.id] || 1) > 1 ? 0.05 : 0;
  
  // Boss room always has encounter on certain actions
  if (room.type === 'boss' && !gameState.flags[`boss_${room.id}_fought`]) {
    return Math.random() < 0.5;
  }
  
  return Math.random() < (baseChance + actionPenalty);
}

function getRandomEnemyForRoom(room) {
  // Use room-specific enemy mapping
  const roomEnemies = roomsData?.enemyByRoom?.[room.id];
  
  if (roomEnemies && roomEnemies.length > 0) {
    return roomEnemies[Math.floor(Math.random() * roomEnemies.length)];
  }
  
  // Fallback to threat-appropriate enemies
  const validEnemies = roomsData?.validEnemyIds || [];
  const lowThreat = ['rat_man', 'mossleech', 'cultist'];
  const midThreat = ['aberrant_beast', 'sewer_centipede', 'corpse_eater'];
  const highThreat = ['drowned_acolyte', 'priestess', 'leech_swarm'];
  
  let pool;
  if (room.maxThreatLevel >= 3) {
    pool = highThreat;
  } else if (room.maxThreatLevel >= 2) {
    pool = midThreat;
  } else {
    pool = lowThreat;
  }
  
  const available = pool.filter(e => validEnemies.includes(e));
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
}

function getRandomEncounterReason() {
  const reasons = [
    'Something stirs in the darkness!',
    'You are not alone here...',
    'A shape lunges from the shadows!',
    'The scraping of claws on stone heralds danger!',
    'Your intrusion has been noticed!',
    'A guttural snarl echoes through the chamber!'
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

function applyRestRecovery(targetKey, hpPercent, sanityPercent, hpReason, sanityReason) {
  const target = targetKey === 'player' ? gameState.player : gameState.companion;
  if (!target) {
    return;
  }
  const hpDelta = Math.ceil(target.maxHp * hpPercent);
  if (hpDelta > 0) {
    applyHpChange(targetKey, hpDelta, hpReason);
  }
  const sanityDelta = Math.ceil(target.maxSanity * sanityPercent);
  if (sanityDelta > 0) {
    applySanityChange(targetKey, sanityDelta, sanityReason);
  }
}

function handleRest() {
  const room = getRoomById(gameState.currentRoomId);
  syncInventoryFromSystem();
  const incenseCount = gameState.inventory?.dreamless_incense || 0;
  const usedIncense = incenseCount > 0;
  const hpPercent = usedIncense ? 1 : 0.5;
  const sanityPercent = usedIncense ? 1 : 0.5;
  const hpReason = usedIncense ? 'Incense-fueled restoration' : 'Resting';
  const sanityReason = usedIncense ? 'Incense-fueled calm' : 'Moment of peace';

  if (usedIncense) {
    applyInventoryChange('dreamless_incense', -1, 'Used during rest');
    logEvent('🕯️ Dreamless incense burns away, washing you in soothing smoke.', 'item');
  }

  applyRestRecovery('player', hpPercent, sanityPercent, hpReason, sanityReason);
  applyRestRecovery('companion', hpPercent, sanityPercent, hpReason, sanityReason);

  const narration = usedIncense
    ? 'You ignite the dreamless incense. A rush of warmth seals every wound and stills every intrusive whisper.'
    : 'You steal a quiet moment to bind wounds and steady your breathing. Strength and clarity return by halves, but it is enough.';
  setNarration(narration);

  updateUI();
  if (room) {
    handleFallbackRoomEntry(room);
  }
}

// ========================
// Combat Transition
// ========================
function triggerCombatTransition(combatData) {
  const transitionEl = document.getElementById('combat-transition');
  const reasonEl = document.getElementById('combat-reason');
  
  reasonEl.textContent = combatData.reason || 'An enemy emerges from the shadows!';
  transitionEl.classList.remove('hidden');
  
  logEvent(`⚔️ ${combatData.reason || 'Combat begins!'}`, 'warning');
  playCombatEventSfx();
  
  // Stop exploration music when entering combat
  stopAllMusic();
  
  // Save current state before combat
  saveGameState();
  
  // Determine enemy list - support both single enemyId and multiple enemyIds
  let enemyIds = [];
  if (combatData.enemyIds && Array.isArray(combatData.enemyIds)) {
    enemyIds = combatData.enemyIds;
  } else if (combatData.enemyId) {
    // Legacy single enemy - expand to multi-enemy based on depth
    const room = getRoomById(gameState.currentRoomId);
    const depth = room?.depth || 1;
    const count = rollEnemyCount(depth);
    
    // First enemy is the specified one, rest are random from room pool
    enemyIds.push(combatData.enemyId);
    for (let i = 1; i < count; i++) {
      const additionalEnemy = getRandomEnemyForRoom(room);
      if (additionalEnemy) {
        enemyIds.push(additionalEnemy);
      }
    }
  }
  
  // Ensure at least one enemy
  if (enemyIds.length === 0) {
    enemyIds = ['cultist'];
  }
  
  // Store combat data for the combat screen (now with multiple enemies)
  sessionStorage.setItem('explorationCombat', JSON.stringify({
    enemyIds: enemyIds,
    enemyId: enemyIds[0], // Keep legacy field for backwards compatibility
    depth: gameState.depth || 1,
    returnRoom: gameState.currentRoomId,
    player: gameState.player,
    companion: gameState.companion,
    inventory: getInventorySnapshot()
  }));
  
  // Transition to combat after animation
  setTimeout(() => {
    // Pass all enemy IDs as comma-separated list
    const enemyParam = encodeURIComponent(enemyIds.join(','));
    window.location.href = `index.html?fromExploration=true&enemies=${enemyParam}`;
  }, 2000);
}

// ========================
// Game Over / Victory
// ========================
function handleGameOver() {
  gameState.mode = GameMode.GAME_OVER;
  setNarration('The darkness claims you. Your journey ends here, another soul lost to the crypt\'s eternal hunger.');
  logEvent('💀 GAME OVER', 'damage');
  
  // Redirect to game end screen after brief delay
  setTimeout(() => {
    redirectToGameEnd('defeat');
  }, 2500);
}

function handleBossVictory() {
  gameState.mode = GameMode.VICTORY;
  setNarration('Against all odds, you have triumphed! The Old One falls, and light returns to this forsaken place.');
  logEvent('🏆 VICTORY! The expedition succeeds!', 'action');
  
  // Mark boss as defeated
  gameState.flags[`boss_${gameState.currentRoomId}_defeated`] = true;
  
  // Redirect to game end screen after brief delay
  setTimeout(() => {
    redirectToGameEnd('victory');
  }, 3000);
}

function redirectToGameEnd(outcome) {
  // Stop exploration music before transition
  stopAllMusic();
  
  // Prepare end state data
  const endData = {
    outcome: outcome,
    player: gameState.player ? {
      name: gameState.player.name,
      hp: gameState.player.hp,
      maxHp: gameState.player.maxHp,
      portrait: gameState.player.portrait
    } : null,
    companion: gameState.companion ? {
      name: gameState.companion.name,
      hp: gameState.companion.hp,
      maxHp: gameState.companion.maxHp,
      portrait: gameState.companion.portrait
    } : null,
    stats: gameState.stats || {
      roomsExplored: Object.keys(gameState.roomsVisited || {}).length,
      battlesFought: 0,
      enemiesDefeated: 0,
      itemsUsed: 0
    }
  };
  
  // Store in sessionStorage
  sessionStorage.setItem('gameEndOutcome', JSON.stringify(endData));
  sessionStorage.setItem('adventureLog', JSON.stringify(gameState.adventureLog || []));
  
  // Navigate to game end screen
  window.location.href = 'game_end.html';
}

function restartGame() {
  localStorage.removeItem('cryptonautsExplorationState');
  window.location.reload();
}

// ========================
// Save/Load State
// ========================
function saveGameState() {
  try {
    syncInventoryFromSystem();
    // Add timestamp to save
    const saveData = {
      ...gameState,
      savedAt: Date.now()
    };
    localStorage.setItem('cryptonautsExplorationState', JSON.stringify(saveData));
    console.log('[Save] Game state saved');
  } catch (e) {
    console.warn('[Save] Failed to save state:', e);
  }
}

function loadGameState() {
  try {
    const saved = localStorage.getItem('cryptonautsExplorationState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle new fields
      gameState = { ...gameState, ...parsed };
      setInventoryState(gameState.inventory || {});
      if (!gameState.roomActionTracker) {
        gameState.roomActionTracker = {};
      }
      if (!Array.isArray(gameState.roomHistory)) {
        gameState.roomHistory = [];
      } else {
        gameState.roomHistory = gameState.roomHistory
          .filter(id => typeof id === 'string' && id)
          .slice(-ROOM_HISTORY_MAX_ENTRIES);
      }
      if (!gameState.flags) {
        gameState.flags = {};
      }
      
      // Ensure XP fields are initialized (migration for old saves)
      if (gameState.player) {
        gameState.player.xp = Number(gameState.player.xp) || 0;
        gameState.player.level = Number(gameState.player.level) || 0;
        gameState.player.xpToNextLevel = Number(gameState.player.xpToNextLevel) || 50;
      }
      if (gameState.companion) {
        gameState.companion.xp = Number(gameState.companion.xp) || 0;
        gameState.companion.level = Number(gameState.companion.level) || 0;
        gameState.companion.xpToNextLevel = Number(gameState.companion.xpToNextLevel) || 50;
      }
      console.log('[Save] Loaded saved state from:', new Date(parsed.savedAt || 0).toLocaleString());
    }
  } catch (e) {
    console.warn('[Save] Failed to load state:', e);
  }
}

async function handleCombatReturn(result) {
  console.log('[Exploration] Handling combat return:', result);
  if (result.player) {
    console.log(`[Exploration] Updating player XP from combat: ${gameState.player.xp} -> ${result.player.xp}`);
  }
  const currentRoom = getRoomById(gameState.currentRoomId);
  
  // Resume appropriate music after combat
  if (gameState.mode === GameMode.BOSS) {
    playBossMusic();
  } else {
    playExplorationMusic();
  }
  
  if (result.inventory) {
    setInventoryState(result.inventory);
  } else {
    syncInventoryFromSystem();
  }
  
  // Helper to process XP and level ups
  const processCharacterUpdate = (target, source, xpGained) => {
    // Update vital stats from combat result
    target.hp = source.hp;
    target.sanity = source.sanity;
    target.statusEffects = source.statusEffects || [];
    
    // Calculate XP and Level Up
    // We use the calculated xpGained from the battle and add it to the character's existing XP
    let currentXp = (target.xp || 0) + (xpGained || 0);
    let currentLevel = target.level || 0;
    let xpToNext = target.xpToNextLevel || 50;
    
    // Level Up Logic
    while (currentXp >= xpToNext && currentLevel < 10) {
      currentXp -= xpToNext;
      currentLevel++;
      
      // Calculate new stats
      // Use base_stats if available, otherwise default to standard values
      const baseStats = target.base_stats || { hp: 30, sanity: 20 }; 
      
      const hpMultiplier = 1 + (0.15 * currentLevel);
      const sanityMultiplier = 1 + (0.15 * currentLevel);
      
      const newMaxHp = Math.floor((baseStats.hp || 30) * hpMultiplier);
      const newMaxSanity = Math.floor((baseStats.sanity || 20) * sanityMultiplier);
      
      const hpGain = newMaxHp - target.maxHp;
      const sanityGain = newMaxSanity - target.maxSanity;
      
      target.maxHp = newMaxHp;
      target.maxSanity = newMaxSanity;
      target.hp = Math.min(target.hp + hpGain, newMaxHp);
      target.sanity = Math.min(target.sanity + sanityGain, newMaxSanity);
      
      xpToNext = Math.floor(50 * Math.pow(1.2, currentLevel));
      
      logEvent(`🎉 ${target.name} reached Level ${currentLevel}!`, 'success');
    }
    
    target.level = currentLevel;
    target.xp = currentXp;
    target.xpToNextLevel = xpToNext;
  };

  // Apply combat result to game state
  if (result.player) {
    processCharacterUpdate(gameState.player, result.player, result.xpGained);
  }
  
  if (result.companion && gameState.companion) {
    processCharacterUpdate(gameState.companion, result.companion, result.xpGained);
  }
  
  updateUI();
  updateSanityState();
  
  // Track battle stats
  if (!gameState.stats) gameState.stats = { roomsExplored: 0, battlesFought: 0, enemiesDefeated: 0, itemsUsed: 0 };
  gameState.stats.battlesFought++;
  
  // Retrieve combat log from sessionStorage if available
  const combatLogData = sessionStorage.getItem('combatLog');
  if (combatLogData) {
    try {
      const combatEvents = JSON.parse(combatLogData);
      // Merge important combat events into adventure log
      combatEvents.forEach(event => {
        if (!gameState.adventureLog) gameState.adventureLog = [];
        gameState.adventureLog.push(`[Combat] ${event}`);
      });
    } catch (e) {
      console.warn('[Exploration] Could not parse combat log');
    }
  }
  
  if (result.victory) {
    gameState.explorationPhase = ExplorationPhase.AFTERMATH;
    logEvent('⚔️ Victory! The enemy falls.', 'action');
    
    // Track enemies defeated
    if (result.enemiesDefeated) {
      gameState.stats.enemiesDefeated += result.enemiesDefeated;
    } else if (result.xpGained > 0) {
      gameState.stats.enemiesDefeated += Math.max(1, Math.floor(result.xpGained / 10));
    } else {
      gameState.stats.enemiesDefeated++;
    }
    
    // Award XP if any
    if (result.xpGained > 0) {
      logEvent(`✨ Gained ${result.xpGained} XP from the encounter.`, 'item');
    }
    
    // Process loot drops
    if (result.lootDrops && result.lootDrops.length > 0) {
      logEvent(`💎 Found ${result.lootDrops.length} item(s) from the battle!`, 'item');
      result.lootDrops.forEach(drop => {
        const itemName = drop.itemId.replace(/_/g, ' ');
        logEvent(`  📦 ${drop.fromEnemy} dropped: ${itemName}`, 'item');
        // Add item to inventory using the item system
        if (typeof addToInventory === 'function') {
          addToInventory(drop.itemId, 1);
        }
      });
    }
    
    // Mark that combat occurred in this room
    gameState.flags[`combat_${gameState.currentRoomId}`] = true;
    
    // Check if this was a boss fight victory
    if (currentRoom && currentRoom.type === 'boss') {
      gameState.flags[`boss_${currentRoom.id}_fought`] = true;
      handleBossVictory();
      return;
    }
    
    // Call Gemini for aftermath narration
    showLoading(true);
    const response = await callGeminiExploration('AFTERMATH', null);
    showLoading(false);
    
    if (response) {
      handleGeminiResponse(response);
    } else {
      // Fallback aftermath
      const aftermathNarrations = [
        'The battle is over. You stand victorious, though the victory feels hollow in this forsaken place. The echoes of combat fade into oppressive silence.',
        'Silence returns to the chamber. Your enemy lies defeated, but you know this place holds more horrors yet.',
        'You catch your breath as the adrenaline fades. The darkness presses close once more, patient and eternal.',
        'The threat is ended, for now. You take stock of your wounds and steel yourself for what lies ahead.'
      ];
      setNarration(aftermathNarrations[Math.floor(Math.random() * aftermathNarrations.length)]);
      if (currentRoom) {
        handleFallbackRoomEntry(currentRoom);
      }
    }
  } else if (result.fled) {
    handleFleeReturn(currentRoom, result);
  } else {
    handleGameOver();
  }
  
  saveGameState();
}

function handleFleeReturn(room, result) {
  const safeRoom = room || getRoomById(gameState.currentRoomId);
  gameState.explorationPhase = ExplorationPhase.AWAITING_CHOICE;
  const retreatNarrations = [
    'You stagger back into the corridor, hearts hammering as the echoes of pursuit fade.',
    'Flight triumphs over valor this once; blood drips with every hurried step.',
    'You slam a rusted gate behind you and lean against the stone, breath ragged and mind fraying.'
  ];
  const narration = retreatNarrations[Math.floor(Math.random() * retreatNarrations.length)];
  setNarration(narration);
  logEvent('🏃 You flee the confrontation, battered and ashamed.', 'warning');

  (result.fleeSummary || []).forEach(entry => {
    if (!entry) return;
    const hpChunk = entry.hpLost > 0 ? `${entry.hpLost} HP` : null;
    const sanityChunk = entry.sanityLost > 0 ? `${entry.sanityLost} sanity` : null;
    const detail = [hpChunk, sanityChunk].filter(Boolean).join(' & ');
    if (detail) {
      logEvent(`⚠️ ${entry.name} loses ${detail} while escaping.`, 'warning');
    }
  });

  if (safeRoom) {
    const choices = generateFallbackChoices(safeRoom);
    renderChoices(choices);
  } else {
    renderChoices([]);
  }
}

// ========================
// Debug Helpers
// ========================
window.debugExploration = {
  getState: () => gameState,
  setRoom: (roomId) => enterRoom(roomId),
  addItem: (itemId, count = 1) => applyInventoryChange(itemId, count, 'Debug'),
  setSanity: (value) => {
    gameState.player.sanity = value;
    updateSanityState();
    updateUI();
  },
  triggerCombat: (enemyId) => triggerCombatTransition({ enemyId, reason: 'Debug combat' })
};

console.log('[Exploration] Debug helpers available via window.debugExploration');
