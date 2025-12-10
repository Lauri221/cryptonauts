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

const AUTOSAVE_INTERVAL_MS = 60000;

// Optional overrides for bespoke backgrounds; defaults fall back to room.image
const ROOM_IMAGES = {
  room_01_entrance: 'assets/img/environment/dungeon1.png',
  room_02_gallery: 'assets/img/environment/ComfyUI_00895_.png',
  room_02a_side_cellar: 'assets/img/environment/ComfyUI_00896_.png',
  room_03_ossuary: 'assets/img/environment/ComfyUI_00897_.png',
  room_04_flooded_stair: 'assets/img/environment/ComfyUI_00898_.png',
  room_05_chanting_hall: 'assets/img/environment/ComfyUI_00899_.png',
  room_06_dreaming_vault: 'assets/img/environment/ComfyUI_00900_.png',
  room_boss_sanctum: 'assets/img/environment/ComfyUI_00901_.png'
};

const DEFAULT_ROOM_IMAGE = 'assets/img/environment/dungeon1.png';

const GEMINI_SYSTEM_PROMPT = `You are the narrative engine for a Lovecraft-inspired expedition crawler called Cryptonauts.
Always respond with valid JSON matching this TypeScript type:
interface GeminiExplorationResponse {
  narration: string;
  logMessages: string[];
  choices: Array<{ id: string; label: string; type?: 'move' | 'action' | 'rest' | 'lore'; description?: string; targetRoom?: string }>;
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

let gameState = {
  mode: GameMode.EXPLORATION,
  explorationPhase: ExplorationPhase.ROOM_ENTRY,
  currentRoomId: 'room_01_entrance',
  depth: 1,
  roomsVisited: {},
  player: null,
  companion: null,
  inventory: {},
  flags: {},
  currentSanityState: SANITY_STATES.STABLE,
  geminiAvailable: true,
  geminiFailCount: 0
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

  loadSettings();
  initGameUI();
  await loadGameData();

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
    startGame(false);
    const result = JSON.parse(combatResult);
    sessionStorage.removeItem('explorationCombatResult');
    updateUI();
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
  document.getElementById('btn-resume').addEventListener('click', handleResume);
  document.getElementById('btn-save-game').addEventListener('click', handleManualSave);
  document.getElementById('btn-options-pause').addEventListener('click', () => openOptions('pause'));
  document.getElementById('btn-main-menu').addEventListener('click', handleMainMenu);
  document.getElementById('btn-options-save').addEventListener('click', saveOptions);
  document.getElementById('btn-options-cancel').addEventListener('click', cancelOptions);
  document.getElementById('btn-toggle-key').addEventListener('click', toggleApiKeyVisibility);
  document.getElementById('btn-test-gemini').addEventListener('click', testGeminiConnection);
  document.getElementById('btn-confirm-yes').addEventListener('click', confirmYes);
  document.getElementById('btn-confirm-no').addEventListener('click', confirmNo);
  document.getElementById('btn-pause').addEventListener('click', openPauseMenu);
  document.getElementById('music-volume').addEventListener('input', (e) => {
    document.getElementById('music-volume-value').textContent = `${e.target.value}%`;
  });
  document.getElementById('sfx-volume').addEventListener('input', (e) => {
    document.getElementById('sfx-volume-value').textContent = `${e.target.value}%`;
  });
  document.getElementById('sanity-jitter').addEventListener('change', (e) => {
    e.target.nextElementSibling.textContent = e.target.checked ? 'Enabled' : 'Disabled';
  });
  document.getElementById('text-scramble').addEventListener('change', (e) => {
    e.target.nextElementSibling.textContent = e.target.checked ? 'Enabled' : 'Disabled';
  });
  document.getElementById('enable-gemini').addEventListener('change', (e) => {
    e.target.nextElementSibling.textContent = e.target.checked ? 'Enabled' : 'Disabled';
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
  
  // TODO: Apply audio volume settings when audio system is implemented
  // setMusicVolume(gameSettings.musicVolume / 100);
  // setSfxVolume(gameSettings.sfxVolume / 100);
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
    player: null,
    companion: null,
    inventory: {},
    flags: {},
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
    // Load rooms
    const roomsResponse = await fetch('rooms.json');
    roomsData = await roomsResponse.json();
    console.log('[Exploration] Loaded rooms:', roomsData.rooms.length);
    
    // Load enemies (for combat transitions)
    const enemiesResponse = await fetch('enemies.json');
    enemiesData = await enemiesResponse.json();
    console.log('[Exploration] Loaded enemies data');
    
    // Load characters (player classes and companion presets)
    const charactersResponse = await fetch('characters.json');
    charactersData = await charactersResponse.json();
    console.log('[Exploration] Loaded characters:', charactersData.characters.length, 'classes,', charactersData.companions.length, 'companions');
    
    // Load inventory catalog via shared item system
    try {
      const itemDb = await loadItemDatabase('inventory.json');
      const itemsArray = Object.values(itemDb || {});
      inventoryCatalog = { items: itemsArray };
      console.log(`[Exploration] Loaded inventory catalog (${itemsArray.length} items)`);
    } catch (e) {
      console.warn('[Exploration] Failed to load inventory catalog, using empty set');
      inventoryCatalog = { items: [] };
    }
  } catch (error) {
    console.error('[Exploration] Failed to load game data:', error);
    logEvent('⚠️ Error loading game data', 'warning');
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
        
        const level = config.level ?? 0;
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
    level: config.level ?? 0,
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
async function enterRoom(roomId, softEntry = false) {
  const room = getRoomById(roomId);
  if (!room) {
    console.error(`[Exploration] Room not found: ${roomId}`);
    logEvent(`⚠️ Unknown path ahead...`, 'warning');
    return;
  }
  
  gameState.mode = GameMode.EXPLORATION;
  gameState.explorationPhase = ExplorationPhase.ROOM_ENTRY;
  gameState.currentRoomId = roomId;
  gameState.depth = room.depth;
  
  // Only increment visit counter on fresh entries
  if (!softEntry) {
    gameState.roomsVisited[roomId] = (gameState.roomsVisited[roomId] || 0) + 1;
  }
  
  // Update UI for new room
  updateRoomDisplay(room);
  updateUI();
  
  // Check for boss room
  if (room.type === 'boss') {
    gameState.mode = GameMode.BOSS;
    logEvent('⚔️ You have reached the Sanctum of the Old One!', 'warning');
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
    'antechamber': 'Reality feels thin here, like parchment stretched too tight.',
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
  
  // Rest option (if room allows)
  if (room.allowRest) {
    choices.push({
      id: 'rest_here',
      label: 'Rest and recover',
      type: 'rest',
      description: 'Take a moment to regain your strength'
    });
  }
  
  // Movement options to next rooms
  if (room.nextRooms && room.nextRooms.length > 0) {
    room.nextRooms.forEach((nextId, index) => {
      const nextRoom = getRoomById(nextId);
      const isSideRoom = nextRoom && nextRoom.type === 'side_room';
      
      choices.push({
        id: `move_${nextId}`,
        label: isSideRoom ? `Investigate ${nextRoom?.name || 'side passage'}` : `Proceed to ${nextRoom?.name || 'the next area'}`,
        type: 'move',
        description: nextRoom ? `Depth ${nextRoom.depth}` : '',
        targetRoom: nextId
      });
    });
  }
  
  return choices;
}

// ========================
// Effect Application
// ========================
function applyEffects(effects) {
  if (!effects) return;
  
  // HP changes
  if (effects.hpChanges) {
    effects.hpChanges.forEach(change => {
      applyHpChange(change.target, change.delta, change.reason);
    });
  }
  
  // Sanity changes
  if (effects.sanityChanges) {
    effects.sanityChanges.forEach(change => {
      applySanityChange(change.target, change.delta, change.reason);
    });
  }
  
  // Inventory changes
  if (effects.inventoryChanges) {
    effects.inventoryChanges.forEach(change => {
      const delta = (typeof change.delta === 'number')
        ? change.delta
        : (typeof change.amount === 'number' ? change.amount : 0);
      if (change.itemId && delta !== 0) {
        applyInventoryChange(change.itemId, delta, change.reason);
      }
    });
  }
  
  // Status effects
  if (effects.statusEffects) {
    effects.statusEffects.forEach(change => {
      applyStatusEffect(change.target, change.effectId, change.addOrRemove, change.reason);
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
  const targets = getTargets(target);
  targets.forEach(char => {
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
  document.getElementById('explorer-player-hp').textContent = gameState.player.hp;
  document.getElementById('explorer-player-maxhp').textContent = gameState.player.maxHp;
  document.getElementById('explorer-player-sanity').textContent = gameState.player.sanity;
  document.getElementById('explorer-player-maxsanity').textContent = gameState.player.maxSanity;
  
  const playerStatusEl = document.getElementById('explorer-player-status');
  playerStatusEl.textContent = gameState.player.statusEffects.join(', ') || '';
  
  // Companion stats
  if (gameState.companion) {
    document.getElementById('explorer-companion-name').textContent = gameState.companion.name;
    document.getElementById('explorer-companion-hp').textContent = gameState.companion.hp;
    document.getElementById('explorer-companion-maxhp').textContent = gameState.companion.maxHp;
    document.getElementById('explorer-companion-sanity').textContent = gameState.companion.sanity;
    document.getElementById('explorer-companion-maxsanity').textContent = gameState.companion.maxSanity;
    
    const companionStatusEl = document.getElementById('explorer-companion-status');
    companionStatusEl.textContent = gameState.companion.statusEffects.join(', ') || '';
  }
  
  // Inventory
  renderInventory();
  
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

function setNarration(text) {
  const narrationEl = document.getElementById('narration-text');
  // Split into paragraphs if there are line breaks
  const paragraphs = text.split('\n').filter(p => p.trim());
  narrationEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
}

function renderChoices(choices) {
  const container = document.getElementById('choice-buttons');
  container.innerHTML = '';
  
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    
    // Add type-based styling
    if (choice.type) {
      btn.classList.add(`choice-${choice.type}`);
    }
    
    btn.textContent = choice.label;
    btn.dataset.choiceId = choice.id;
    
    if (choice.description) {
      btn.title = choice.description;
    }
    
    // Handle move choices with target room
    if (choice.targetRoom) {
      btn.dataset.targetRoom = choice.targetRoom;
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
}

function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.toggle('hidden', !show);
}

// ========================
// Choice Handling
// ========================
async function onChoiceClicked(choice) {
  // Disable all choices during processing
  document.querySelectorAll('.choice-btn').forEach(btn => btn.disabled = true);
  gameState.explorationPhase = ExplorationPhase.PROCESSING;
  
  logEvent(`You chose: ${choice.label}`, 'action');
  
  // Handle special fallback choices
  if (choice.id === 'rest_here') {
    handleRest();
    return;
  }
  
  if (choice.id.startsWith('move_') && choice.targetRoom) {
    await enterRoom(choice.targetRoom);
    return;
  }
  
  // Call Gemini for choice resolution
  showLoading(true);
  const response = await callGeminiExploration('AWAITING_CHOICE', choice.id);
  showLoading(false);
  
  if (response) {
    handleGeminiResponse(response);
  } else {
    // Fallback choice handling
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
  } else if (choice.id.startsWith('move_')) {
    // Movement is handled elsewhere
    return;
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

function handleRest() {
  const room = getRoomById(gameState.currentRoomId);
  
  if (!room.allowRest) {
    logEvent('This place is too unsettling to rest.', 'warning');
    handleFallbackRoomEntry(room);
    return;
  }
  
  // Restore HP and sanity
  const hpRestore = Math.floor(gameState.player.maxHp * 0.3);
  const sanityRestore = Math.floor(gameState.player.maxSanity * 0.2);
  
  applyHpChange('party', hpRestore, 'Resting');
  applySanityChange('party', sanityRestore, 'Moment of peace');
  
  setNarration('You find a shadowed alcove and take a moment to catch your breath. The darkness presses in, but for now, you are safe.');
  
  updateUI();
  handleFallbackRoomEntry(room);
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
  
  // Save current state before combat
  saveGameState();
  
  // Store combat data for the combat screen
  sessionStorage.setItem('explorationCombat', JSON.stringify({
    enemyId: combatData.enemyId,
    returnRoom: gameState.currentRoomId,
    player: gameState.player,
    companion: gameState.companion,
    inventory: getInventorySnapshot()
  }));
  
  // Transition to combat after animation
  setTimeout(() => {
    window.location.href = `index.html?fromExploration=true&enemy=${encodeURIComponent(combatData.enemyId)}`;
  }, 2000);
}

// ========================
// Game Over / Victory
// ========================
function handleGameOver() {
  gameState.mode = GameMode.GAME_OVER;
  setNarration('The darkness claims you. Your journey ends here, another soul lost to the crypt\'s eternal hunger.');
  logEvent('💀 GAME OVER', 'damage');
  
  document.getElementById('choice-buttons').innerHTML = `
    <button class="choice-btn" onclick="restartGame()">Try Again</button>
  `;
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
      console.log('[Save] Loaded saved state from:', new Date(parsed.savedAt || 0).toLocaleString());
    }
  } catch (e) {
    console.warn('[Save] Failed to load state:', e);
  }
}

async function handleCombatReturn(result) {
  console.log('[Exploration] Handling combat return:', result);
  
  if (result.inventory) {
    setInventoryState(result.inventory);
  } else {
    syncInventoryFromSystem();
  }
  
  // Apply combat result to game state
  if (result.player) {
    gameState.player.hp = result.player.hp;
    gameState.player.sanity = result.player.sanity;
    gameState.player.statusEffects = result.player.statusEffects || [];
  }
  
  if (result.companion && gameState.companion) {
    gameState.companion.hp = result.companion.hp;
    gameState.companion.sanity = result.companion.sanity;
    gameState.companion.statusEffects = result.companion.statusEffects || [];
  }
  
  updateUI();
  updateSanityState();
  
  if (result.victory) {
    gameState.explorationPhase = ExplorationPhase.AFTERMATH;
    logEvent('⚔️ Victory! The enemy falls.', 'action');
    
    // Award XP if any
    if (result.xpGained > 0) {
      logEvent(`✨ Gained ${result.xpGained} XP from the encounter.`, 'item');
    }
    
    // Mark that combat occurred in this room
    gameState.flags[`combat_${gameState.currentRoomId}`] = true;
    
    // Call Gemini for aftermath narration
    showLoading(true);
    const response = await callGeminiExploration('AFTERMATH', null);
    showLoading(false);
    
    if (response) {
      handleGeminiResponse(response);
    } else {
      // Fallback aftermath
      const room = getRoomById(gameState.currentRoomId);
      const aftermathNarrations = [
        'The battle is over. You stand victorious, though the victory feels hollow in this forsaken place. The echoes of combat fade into oppressive silence.',
        'Silence returns to the chamber. Your enemy lies defeated, but you know this place holds more horrors yet.',
        'You catch your breath as the adrenaline fades. The darkness presses close once more, patient and eternal.',
        'The threat is ended, for now. You take stock of your wounds and steel yourself for what lies ahead.'
      ];
      setNarration(aftermathNarrations[Math.floor(Math.random() * aftermathNarrations.length)]);
      handleFallbackRoomEntry(room);
    }
  } else {
    handleGameOver();
  }
  
  saveGameState();
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
