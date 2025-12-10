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

// ========================
// Initialization
// ========================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[StartScreen] Initializing...');
  loadSettings();
  await loadCharacterData();
  initStartScreen();
  updateContinueButton(checkForExistingSave());
});

async function loadCharacterData() {
  try {
    const response = await fetch('characters.json');
    charactersData = await response.json();
    console.log('[StartScreen] Loaded characters:', charactersData.characters.length, 'classes');
  } catch (error) {
    console.error('[StartScreen] Failed to load character data:', error);
  }
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
  
  const availableClasses = charactersData.characters.filter(c => c.id !== 'aberration');
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
  updatePlayerPreview();
}

function selectGender(gender) {
  creationState.playerGender = gender;
  document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.gender === gender);
  });
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
  const classData = charactersData.characters.find(c => c.id === creationState.playerClassId);
  if (!classData) return;
  const genderData = classData.gender_variants[creationState.playerGender];
  
  document.getElementById('player-preview-portrait').src = genderData?.portrait || 'assets/img/ally_portrait/default.png';
  const stats = classData.base_stats;
  document.getElementById('preview-player-hp').textContent = stats.hp;
  document.getElementById('preview-player-sanity').textContent = stats.sanity;
  document.getElementById('preview-player-attack').textContent = `${stats.basic_attack.dice}d${stats.basic_attack.sides}`;
  document.getElementById('preview-player-defense').textContent = stats.defense;
  document.getElementById('player-preview-abilities').innerHTML = `
    <div class="ability">
      <span class="ability-name">${stats.ability1.name}:</span> ${stats.ability1.description}
    </div>
    <div class="ability">
      <span class="ability-name">${stats.ability2.name}:</span> ${stats.ability2.description}
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
  
  sessionStorage.setItem('cryptonautsNewGame', JSON.stringify(creationState));
  localStorage.removeItem('cryptonautsExplorationState');
  window.location.href = 'exploration.html?newGame=true';
}

function handleContinue() {
  if (!checkForExistingSave()) return;
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
