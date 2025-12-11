// ========================
// Cryptonauts Game End Screen
// ========================

// Game end state
let endState = {
  outcome: 'defeat', // 'victory' or 'defeat'
  player: null,
  companion: null,
  adventureLog: [],
  combatLog: [],
  stats: {
    roomsExplored: 0,
    battlesFought: 0,
    enemiesDefeated: 0,
    itemsUsed: 0
  },
  geminiApiKey: ''
};

// ========================
// Initialization
// ========================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[GameEnd] Initializing...');
  
  // Load end state from sessionStorage
  loadEndState();
  
  // Apply visual theme based on outcome
  applyOutcomeTheme();
  
  // Update UI with party status
  updatePartyStatus();
  
  // Update statistics
  updateStatistics();
  
  // Play appropriate music
  playEndMusic();
  
  // Generate narrative
  await generatePostMortem();
  
  // Set up button handlers
  setupEventHandlers();
});

// ========================
// State Loading
// ========================
function loadEndState() {
  try {
    // Load outcome
    const outcomeData = sessionStorage.getItem('gameEndOutcome');
    if (outcomeData) {
      const parsed = JSON.parse(outcomeData);
      endState.outcome = parsed.outcome || 'defeat';
      endState.player = parsed.player || null;
      endState.companion = parsed.companion || null;
      endState.stats = parsed.stats || endState.stats;
    }
    
    // Load adventure log
    const adventureLog = sessionStorage.getItem('adventureLog');
    if (adventureLog) {
      endState.adventureLog = JSON.parse(adventureLog);
    }
    
    // Load combat log
    const combatLog = sessionStorage.getItem('combatLog');
    if (combatLog) {
      endState.combatLog = JSON.parse(combatLog);
    }
    
    // Load Gemini API key from settings
    const settings = localStorage.getItem('cryptonautsSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      endState.geminiApiKey = parsed.geminiApiKey || '';
    }
    
    console.log('[GameEnd] Loaded state:', endState);
  } catch (e) {
    console.warn('[GameEnd] Failed to load state:', e);
  }
}

// ========================
// UI Updates
// ========================
function applyOutcomeTheme() {
  const body = document.body;
  const title = document.getElementById('end-title');
  const subtitle = document.getElementById('end-subtitle');
  
  if (endState.outcome === 'victory') {
    body.classList.add('victory');
    body.classList.remove('defeat');
    title.textContent = 'Victory';
    subtitle.textContent = 'The darkness recedes. Your expedition has triumphed.';
  } else {
    body.classList.add('defeat');
    body.classList.remove('victory');
    title.textContent = 'Defeat';
    subtitle.textContent = 'The crypt claims another soul. Your tale ends here.';
  }
}

function updatePartyStatus() {
  // Player status
  const playerImg = document.getElementById('player-final-img');
  const playerName = document.getElementById('player-final-name');
  const playerStatus = document.getElementById('player-final-status');
  const playerPortrait = document.getElementById('player-final');
  
  if (endState.player) {
    playerImg.src = endState.player.portrait || 'assets/img/ally_portrait/default.png';
    playerName.textContent = endState.player.name || 'Cryptonaut';
    
    const playerAlive = endState.player.hp > 0;
    playerStatus.textContent = playerAlive ? 'Survived' : 'Fallen';
    playerStatus.className = `final-status ${playerAlive ? 'alive' : 'fallen'}`;
    playerPortrait.classList.toggle('deceased', !playerAlive);
  } else {
    playerImg.src = 'assets/img/ally_portrait/default.png';
    playerName.textContent = 'Unknown';
    playerStatus.textContent = 'Unknown';
    playerStatus.className = 'final-status';
  }
  
  // Companion status
  const companionImg = document.getElementById('companion-final-img');
  const companionName = document.getElementById('companion-final-name');
  const companionStatus = document.getElementById('companion-final-status');
  const companionPortrait = document.getElementById('companion-final');
  
  if (endState.companion) {
    companionImg.src = endState.companion.portrait || 'assets/img/ally_portrait/default.png';
    companionName.textContent = endState.companion.name || 'Companion';
    
    const companionAlive = endState.companion.hp > 0;
    companionStatus.textContent = companionAlive ? 'Survived' : 'Fallen';
    companionStatus.className = `final-status ${companionAlive ? 'alive' : 'fallen'}`;
    companionPortrait.classList.toggle('deceased', !companionAlive);
  } else {
    document.getElementById('companion-final').style.display = 'none';
  }
}

function updateStatistics() {
  document.getElementById('stat-rooms').textContent = endState.stats.roomsExplored || 0;
  document.getElementById('stat-battles').textContent = endState.stats.battlesFought || 0;
  document.getElementById('stat-enemies').textContent = endState.stats.enemiesDefeated || 0;
  document.getElementById('stat-items').textContent = endState.stats.itemsUsed || 0;
}

// ========================
// Audio
// ========================
function playEndMusic() {
  const endMusic = document.getElementById('end-screen-music');
  
  if (!endMusic) {
    console.warn('[GameEnd] End screen music element not found');
    return;
  }
  
  // Load volume setting
  let volume = 0.6;
  try {
    const settings = localStorage.getItem('cryptonautsSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      volume = (parsed.musicVolume || 60) / 100;
    }
  } catch (e) {
    console.warn('[GameEnd] Could not load volume setting');
  }
  
  endMusic.volume = volume;
  endMusic.play().catch(e => console.log('[GameEnd] Music playback blocked:', e));
}

// ========================
// Narrative Generation
// ========================
async function generatePostMortem() {
  const loadingEl = document.getElementById('narrative-loading');
  const contentEl = document.getElementById('narrative-content');
  const errorEl = document.getElementById('narrative-error');
  const textEl = document.getElementById('narrative-text');
  
  // Check if Gemini is available
  if (!endState.geminiApiKey) {
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    console.log('[GameEnd] No Gemini API key available');
    return;
  }
  
  // Build the prompt
  const prompt = buildNarrativePrompt();
  
  try {
    const narrative = await callGeminiForNarrative(prompt);
    
    if (narrative) {
      loadingEl.classList.add('hidden');
      textEl.textContent = narrative;
      contentEl.classList.remove('hidden');
    } else {
      loadingEl.classList.add('hidden');
      errorEl.classList.remove('hidden');
    }
  } catch (e) {
    console.error('[GameEnd] Narrative generation failed:', e);
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
  }
}

function buildNarrativePrompt() {
  const playerName = endState.player?.name || 'the Cryptonaut';
  const companionName = endState.companion?.name || 'their companion';
  const outcome = endState.outcome === 'victory' ? 'triumphant victory' : 'tragic defeat';
  
  // Combine and summarize logs
  const allEvents = [];
  
  // Add exploration events
  if (endState.adventureLog && endState.adventureLog.length > 0) {
    endState.adventureLog.forEach(event => {
      allEvents.push(`[Exploration] ${event}`);
    });
  }
  
  // Add combat events
  if (endState.combatLog && endState.combatLog.length > 0) {
    endState.combatLog.forEach(event => {
      allEvents.push(`[Combat] ${event}`);
    });
  }
  
  // Limit to most recent/important events
  const recentEvents = allEvents.slice(-30);
  const eventSummary = recentEvents.length > 0 
    ? recentEvents.join('\n')
    : 'The expedition descended into the crypt, facing unknown horrors.';
  
  const statsText = `
Rooms explored: ${endState.stats.roomsExplored}
Battles fought: ${endState.stats.battlesFought}
Enemies defeated: ${endState.stats.enemiesDefeated}
Items used: ${endState.stats.itemsUsed}`;
  
  const prompt = `You are the chronicler for a Lovecraft-inspired expedition crawler called Cryptonauts.

Write a brief, evocative post-mortem narrative (2-3 paragraphs, max 200 words) summarizing the expedition of ${playerName} and ${companionName}. Their journey ended in ${outcome}.

The expedition's key events:
${eventSummary}

Statistics:${statsText}

Write in a dramatic, Lovecraftian style befitting an explorer's final journal entry or a chronicler's account. Focus on atmosphere and the emotional arc of the journey. Do not use headers or bullet points - write flowing prose only.`;
  
  return prompt;
}

async function callGeminiForNarrative(prompt) {
  const apiKey = endState.geminiApiKey;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 400
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[GameEnd] Gemini API error:', errorData);
      return null;
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      return text.trim();
    }
    
    return null;
  } catch (e) {
    console.error('[GameEnd] Gemini request failed:', e);
    return null;
  }
}

// ========================
// Event Handlers
// ========================
function setupEventHandlers() {
  document.getElementById('btn-new-game').addEventListener('click', startNewGame);
  document.getElementById('btn-main-menu').addEventListener('click', goToMainMenu);
}

function startNewGame() {
  // Clear all game data
  clearGameData();
  
  // Go to start screen for new game setup
  window.location.href = 'start_screen.html';
}

function goToMainMenu() {
  // Clear session data but keep settings
  clearGameData();
  
  window.location.href = 'start_screen.html';
}

function clearGameData() {
  // Clear session storage
  sessionStorage.removeItem('gameEndOutcome');
  sessionStorage.removeItem('adventureLog');
  sessionStorage.removeItem('combatLog');
  sessionStorage.removeItem('explorationCombat');
  sessionStorage.removeItem('explorationCombatResult');
  sessionStorage.removeItem('cryptonautsNewGame');
  
  // Clear exploration save
  localStorage.removeItem('cryptonautsExplorationState');
}
