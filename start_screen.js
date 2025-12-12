// ========================
// Start Screen Logic
// ========================

const CLASS_ICONS = {
  monk: '🧘',
  warrior: '⚔️',
  alchemist: '⚗️',
  cleric: '✝️',
  aberration: '👁️'
};

const CHARACTER_DATA_FALLBACK = window.__CRYPTONAUTS_FALLBACKS__?.characters || null;

let characterDataErrorShown = false;

function cloneCharacterData(data) {
  if (!data) return null;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(data);
    } catch (error) {
      // Fallback to JSON technique below
    }
  }
  return JSON.parse(JSON.stringify(data));
}

const LOCAL_SERVER_HINT = 'Run a local web server (for example: "python -m http.server 8000" or "npx http-server .") inside the project folder, then open http://localhost:8000/experimental/start_screen.html.';

let charactersData = null;
let creationState = {
  playerName: '',
  playerClassId: 'warrior',
  playerGender: 'm',
  companionId: 'eleanor'
};

let gameSettings = {
  musicVolume: 70,
  sfxVolume: 80,
  sanityJitterEnabled: true,
  textScrambleEnabled: true,
  geminiEnabled: true,
  geminiApiKey: ''
};

const menuState = {
  pendingConfirmAction: null
};

function isMonsterClass(classOrId) {
  const id = typeof classOrId === 'string' ? classOrId : classOrId?.id;
  return id === 'aberration' || Boolean(classOrId?.tags?.includes?.('monster'));
}

function getCurrentClassData() {
  if (!charactersData?.characters) return null;
  return charactersData.characters.find(c => c.id === creationState.playerClassId) || null;
}

function getAvailableGenders(classData) {
  if (!classData?.gender_variants) return [];
  return Object.keys(classData.gender_variants);
}

function refreshGenderControls() {
  const classData = getCurrentClassData();
  if (!classData) return;
  const availableGenders = getAvailableGenders(classData);
  if (availableGenders.length === 0) {
    creationState.playerGender = 'm';
  } else if (!availableGenders.includes(creationState.playerGender)) {
    creationState.playerGender = availableGenders[0];
  }

  const monsterLock = isMonsterClass(classData);
  document.querySelectorAll('.gender-btn').forEach(btn => {
    const isAllowed = availableGenders.includes(btn.dataset.gender);
    const shouldDisable = monsterLock || !isAllowed;
    btn.disabled = shouldDisable;
    btn.classList.toggle('disabled', shouldDisable);
    btn.classList.toggle('selected', btn.dataset.gender === creationState.playerGender);
    if (monsterLock) {
      btn.title = 'Monstrous forms heed no mortal genders.';
    } else if (!isAllowed) {
      btn.title = 'Unavailable for this class.';
    } else {
      btn.title = '';
    }
  });

  const lockNote = document.getElementById('gender-lock-note');
  if (lockNote) {
    lockNote.textContent = monsterLock ? 'Monstrous forms heed no mortal genders.' : '';
  }
}

function getEmbeddedCharacterData() {
  const inlineEl = document.getElementById('characters-data');
  if (inlineEl?.textContent?.trim()) {
    try {
      return JSON.parse(inlineEl.textContent);
    } catch (error) {
      console.warn('[StartScreen] Failed to parse inline character JSON:', error);
    }
  }

  if (window.__CRYPTONAUTS_CHARACTER_DATA__) {
    return cloneCharacterData(window.__CRYPTONAUTS_CHARACTER_DATA__);
  }

  if (typeof CHARACTER_DATA_FALLBACK !== 'undefined' && CHARACTER_DATA_FALLBACK) {
    return cloneCharacterData(CHARACTER_DATA_FALLBACK);
  }

  return null;
}

function disableNewGameButton(reason) {
  const btn = document.getElementById('btn-new-game');
  if (btn) {
    btn.disabled = true;
    if (reason) {
      btn.title = reason;
    }
  }
}

function showCharacterDataError(message) {
  if (characterDataErrorShown) return;
  characterDataErrorShown = true;
  disableNewGameButton(message);
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay fatal-alert';
  overlay.innerHTML = `
    <div class="modal-container confirm-container">
      <h3>Character Data Unavailable</h3>
      <p>${message}</p>
      <p>${LOCAL_SERVER_HINT}</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

// ========================
// Initialization
// ========================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[StartScreen] Initializing...');
  loadSettings();
  const charactersReady = await loadCharacterData();
  initStartScreen();
  updateContinueButton(checkForExistingSave());
  if (!charactersReady) {
    disableNewGameButton('Character data unavailable. See on-screen instructions.');
  }
  playMainScreenMusic();
});

// ========================
// Audio
// ========================
function playMainScreenMusic() {
  const music = document.getElementById('main-screen-music');
  if (!music) {
    console.warn('[StartScreen] Main screen music element not found');
    return;
  }
  
  // Apply volume from settings
  const volume = (gameSettings.musicVolume || 70) / 100;
  music.volume = volume;
  
  music.play().catch(e => {
    console.log('[StartScreen] Music autoplay blocked, will play on user interaction:', e);
    // Add click listener to start music on first user interaction
    document.addEventListener('click', function startMusic() {
      music.play().catch(() => {});
      document.removeEventListener('click', startMusic);
    }, { once: true });
  });
}

function stopMainScreenMusic() {
  const music = document.getElementById('main-screen-music');
  if (music) {
    music.pause();
    music.currentTime = 0;
  }
}

async function loadCharacterData() {
  const isFileProtocol = window.location.protocol === 'file:';

  if (!isFileProtocol) {
    try {
      const response = await fetch('characters.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      charactersData = await response.json();
      console.log('[StartScreen] Loaded characters:', charactersData.characters.length, 'classes');
      return true;
    } catch (error) {
      console.warn('[StartScreen] Fetch for character data failed, attempting embedded fallback:', error);
    }
  } else {
    console.warn('[StartScreen] Detected file:// protocol; using embedded character data to avoid browser CORS restrictions.');
  }

  const embedded = getEmbeddedCharacterData();
  if (embedded) {
    charactersData = embedded;
    console.log('[StartScreen] Loaded embedded character data:', charactersData.characters.length, 'classes');
    return true;
  }
  
  const errorMessage = 'Unable to load character data because the browser blocked local file requests.';
  console.error('[StartScreen] ' + errorMessage);
  showCharacterDataError(errorMessage);
  return false;
}

function initStartScreen() {
  document.getElementById('btn-new-game').addEventListener('click', handleNewGame);
  document.getElementById('btn-continue').addEventListener('click', handleContinue);
  document.getElementById('btn-options-start').addEventListener('click', () => openOptions());
  document.getElementById('btn-back-to-menu').addEventListener('click', showStartMenu);
  document.getElementById('btn-begin-expedition').addEventListener('click', beginExpedition);
  
  document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.addEventListener('click', () => selectGender(btn.dataset.gender));
  });
  
  document.getElementById('player-name-input').addEventListener('input', (e) => {
    creationState.playerName = e.target.value;
  });
  
  document.getElementById('btn-options-save').addEventListener('click', saveOptions);
  document.getElementById('btn-options-cancel').addEventListener('click', cancelOptions);
  document.getElementById('btn-toggle-key').addEventListener('click', toggleApiKeyVisibility);
  document.getElementById('btn-test-gemini').addEventListener('click', testGeminiConnection);
  document.getElementById('btn-confirm-yes').addEventListener('click', confirmYes);
  document.getElementById('btn-confirm-no').addEventListener('click', confirmNo);
  
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
  
  document.addEventListener('keydown', handleStartScreenKeyboard);
}

function handleStartScreenKeyboard(e) {
  if (e.key !== 'Escape') return;
  
  if (!document.getElementById('character-creation').classList.contains('hidden')) {
    showStartMenu();
  } else if (!document.getElementById('options-modal').classList.contains('hidden')) {
    cancelOptions();
  } else if (!document.getElementById('confirm-dialog').classList.contains('hidden')) {
    confirmNo();
  }
}

function updateContinueButton(hasSave) {
  const btn = document.getElementById('btn-continue');
  btn.disabled = !hasSave;
  btn.title = hasSave ? 'Continue your last expedition' : 'No save data found';
}

function handleNewGame() {
  if (checkForExistingSave()) {
    showConfirmDialog(
      'Start New Game?',
      'This will overwrite your existing save. Continue?',
      () => {
        clearSaveData();
        prepareCharacterCreation();
      }
    );
  } else {
    prepareCharacterCreation();
  }
}

function prepareCharacterCreation() {
  if (!charactersData) {
    showCharacterDataError('Character data is still loading. Please resolve the issue before starting a new expedition.');
    return;
  }

  creationState = {
    playerName: '',
    playerClassId: 'warrior',
    playerGender: 'm',
    companionId: 'eleanor'
  };
  
  document.getElementById('player-name-input').value = '';
  document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.gender === 'm');
  });
  
  populateClassSelector();
  refreshGenderControls();
  populateCompanionSelector();
  updatePlayerPreview();
  updateCompanionPreview();
  
  document.getElementById('start-menu').classList.add('hidden');
  document.getElementById('character-creation').classList.remove('hidden');
}

function showStartMenu() {
  document.getElementById('character-creation').classList.add('hidden');
  document.getElementById('options-modal').classList.add('hidden');
  document.getElementById('confirm-dialog').classList.add('hidden');
  document.getElementById('start-menu').classList.remove('hidden');
}

function populateClassSelector() {
  const container = document.getElementById('player-class-select');
  container.innerHTML = '';
  
  const availableClasses = charactersData?.characters || [];
  availableClasses.forEach(charClass => {
    const card = document.createElement('div');
    card.className = 'class-card' + (charClass.id === creationState.playerClassId ? ' selected' : '');
    card.dataset.classId = charClass.id;
    card.innerHTML = `
      <div class="class-icon">${CLASS_ICONS[charClass.id] || '❓'}</div>
      <div class="class-name">${charClass.class}</div>
    `;
    card.addEventListener('click', () => selectClass(charClass.id));
    container.appendChild(card);
  });
}

function populateCompanionSelector() {
  const container = document.getElementById('companion-select');
  container.innerHTML = '';
  
  charactersData.companions.forEach(companion => {
    const card = document.createElement('div');
    card.className = 'companion-card' + (companion.id === creationState.companionId ? ' selected' : '');
    card.dataset.companionId = companion.id;
    card.innerHTML = `
      <img src="${companion.portrait}" alt="${companion.name}">
      <div class="companion-info">
        <div class="companion-name">${companion.name}</div>
        <div class="companion-class">${companion.class}</div>
      </div>
    `;
    card.addEventListener('click', () => selectCompanion(companion.id));
    container.appendChild(card);
  });
}

function selectClass(classId) {
  creationState.playerClassId = classId;
  document.querySelectorAll('.class-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.classId === classId);
  });
  refreshGenderControls();
  updatePlayerPreview();
}

function selectGender(gender) {
  const classData = getCurrentClassData();
  if (!classData || isMonsterClass(classData)) {
    return;
  }
  const available = getAvailableGenders(classData);
  if (!available.includes(gender)) {
    return;
  }
  creationState.playerGender = gender;
  refreshGenderControls();
  updatePlayerPreview();
}

function selectCompanion(companionId) {
  creationState.companionId = companionId;
  document.querySelectorAll('.companion-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.companionId === companionId);
  });
  updateCompanionPreview();
}

function updatePlayerPreview() {
  const classData = getCurrentClassData();
  if (!classData) return;
  const variants = classData.gender_variants || {};
  const variantKeys = Object.keys(variants);
  const genderData = variants[creationState.playerGender] || variants[variantKeys[0]] || null;
  const portraitSrc = genderData?.portrait || 'assets/img/ally_portrait/warrior_male.png';
  document.getElementById('player-preview-portrait').src = portraitSrc;

  const stats = classData.base_stats || {};
  const basicAttack = stats.basic_attack || {};
  const attackText = (basicAttack.dice && basicAttack.sides)
    ? `${basicAttack.dice}d${basicAttack.sides}`
    : '—';
  document.getElementById('preview-player-hp').textContent = stats.hp ?? '—';
  document.getElementById('preview-player-sanity').textContent = stats.sanity ?? '—';
  document.getElementById('preview-player-attack').textContent = attackText;
  document.getElementById('preview-player-defense').textContent = stats.defense ?? '—';

  const abilityOne = stats.ability1 || { name: 'Ability 1', description: '—' };
  const abilityTwo = stats.ability2 || { name: 'Ability 2', description: '—' };
  document.getElementById('player-preview-abilities').innerHTML = `
    <div class="ability">
      <span class="ability-name">${abilityOne.name}:</span> ${abilityOne.description}
    </div>
    <div class="ability">
      <span class="ability-name">${abilityTwo.name}:</span> ${abilityTwo.description}
    </div>
  `;
}

function updateCompanionPreview() {
  const companion = charactersData.companions.find(c => c.id === creationState.companionId);
  if (!companion) return;
  const stats = companion.base_stats;
  
  document.getElementById('companion-preview-portrait').src = companion.portrait;
  document.getElementById('companion-preview-name').textContent = companion.name;
  document.getElementById('companion-preview-class').textContent = companion.class;
  document.getElementById('companion-preview-backstory').textContent = companion.backstory;
  document.getElementById('preview-companion-hp').textContent = stats.hp;
  document.getElementById('preview-companion-sanity').textContent = stats.sanity;
  document.getElementById('preview-companion-attack').textContent = `${stats.basic_attack.dice}d${stats.basic_attack.sides}`;
  document.getElementById('preview-companion-defense').textContent = stats.defense;
}

function beginExpedition() {
  const classData = charactersData.characters.find(c => c.id === creationState.playerClassId);
  if (!classData) return;
  
  const playerName = creationState.playerName.trim() || `The ${classData.class}`;
  creationState.playerName = playerName;
  
  stopMainScreenMusic();
  sessionStorage.setItem('cryptonautsNewGame', JSON.stringify(creationState));
  localStorage.removeItem('cryptonautsExplorationState');
  window.location.href = 'exploration.html?newGame=true';
}

function handleContinue() {
  if (!checkForExistingSave()) return;
  stopMainScreenMusic();
  window.location.href = 'exploration.html?continue=true';
}

// ========================
// Options & Settings
// ========================
function openOptions() {
  populateOptionsForm();
  document.getElementById('options-modal').classList.remove('hidden');
}

function populateOptionsForm() {
  document.getElementById('music-volume').value = gameSettings.musicVolume;
  document.getElementById('music-volume-value').textContent = `${gameSettings.musicVolume}%`;
  document.getElementById('sfx-volume').value = gameSettings.sfxVolume;
  document.getElementById('sfx-volume-value').textContent = `${gameSettings.sfxVolume}%`;
  document.getElementById('sanity-jitter').checked = gameSettings.sanityJitterEnabled;
  document.getElementById('sanity-jitter').nextElementSibling.textContent = gameSettings.sanityJitterEnabled ? 'Enabled' : 'Disabled';
  document.getElementById('text-scramble').checked = gameSettings.textScrambleEnabled;
  document.getElementById('text-scramble').nextElementSibling.textContent = gameSettings.textScrambleEnabled ? 'Enabled' : 'Disabled';
  document.getElementById('enable-gemini').checked = gameSettings.geminiEnabled;
  document.getElementById('enable-gemini').nextElementSibling.textContent = gameSettings.geminiEnabled ? 'Enabled' : 'Disabled';
  document.getElementById('gemini-api-key').value = gameSettings.geminiApiKey;
  document.getElementById('gemini-api-key').type = 'password';
  document.getElementById('btn-toggle-key').textContent = 'Show';
  document.getElementById('gemini-test-result').textContent = '';
}

function saveOptions() {
  gameSettings.musicVolume = parseInt(document.getElementById('music-volume').value, 10);
  gameSettings.sfxVolume = parseInt(document.getElementById('sfx-volume').value, 10);
  gameSettings.sanityJitterEnabled = document.getElementById('sanity-jitter').checked;
  gameSettings.textScrambleEnabled = document.getElementById('text-scramble').checked;
  gameSettings.geminiEnabled = document.getElementById('enable-gemini').checked;
  gameSettings.geminiApiKey = document.getElementById('gemini-api-key').value;
  
  saveSettings();
  applySettings();
  document.getElementById('options-modal').classList.add('hidden');
}

function cancelOptions() {
  document.getElementById('options-modal').classList.add('hidden');
}

function toggleApiKeyVisibility() {
  const input = document.getElementById('gemini-api-key');
  const btn = document.getElementById('btn-toggle-key');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.textContent = show ? 'Hide' : 'Show';
}

async function testGeminiConnection() {
  const resultEl = document.getElementById('gemini-test-result');
  const apiKey = document.getElementById('gemini-api-key').value;
  if (!apiKey) {
    resultEl.textContent = 'No API key entered';
    resultEl.className = 'test-result error';
    return;
  }
  
  resultEl.textContent = 'Testing...';
  resultEl.className = 'test-result';
  document.getElementById('btn-test-gemini').disabled = true;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with only the word: connected' }] }] })
    });
    if (response.ok) {
      resultEl.textContent = '✓ Connected!';
      resultEl.className = 'test-result success';
    } else {
      const data = await response.json();
      resultEl.textContent = '✗ ' + (data.error?.message || 'Connection failed');
      resultEl.className = 'test-result error';
    }
  } catch (error) {
    resultEl.textContent = '✗ Network error';
    resultEl.className = 'test-result error';
  }
  
  document.getElementById('btn-test-gemini').disabled = false;
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
      gameSettings = { ...gameSettings, ...JSON.parse(saved) };
    }
    if (!gameSettings.geminiApiKey && window.CONFIG?.GEMINI_API_KEY) {
      gameSettings.geminiApiKey = window.CONFIG.GEMINI_API_KEY;
    }
  } catch (error) {
    console.warn('[StartScreen] Failed to load settings:', error);
  }
  applySettings();
}

function saveSettings() {
  try {
    localStorage.setItem('cryptonautsSettings', JSON.stringify(gameSettings));
  } catch (error) {
    console.warn('[StartScreen] Failed to save settings:', error);
  }
}

function applySettings() {
  if (window.CONFIG) {
    window.CONFIG.USE_GEMINI = gameSettings.geminiEnabled;
    if (gameSettings.geminiApiKey) {
      window.CONFIG.GEMINI_API_KEY = gameSettings.geminiApiKey;
    }
  }
  document.body.dataset.sanityEffects = gameSettings.sanityJitterEnabled ? 'enabled' : 'disabled';
  document.body.dataset.textScramble = gameSettings.textScrambleEnabled ? 'enabled' : 'disabled';
  
  // Update music volume
  const music = document.getElementById('main-screen-music');
  if (music) {
    music.volume = (gameSettings.musicVolume || 70) / 100;
  }
}

// ========================
// Save helpers
// ========================
function checkForExistingSave() {
  return localStorage.getItem('cryptonautsExplorationState') !== null;
}

function clearSaveData() {
  localStorage.removeItem('cryptonautsExplorationState');
}
