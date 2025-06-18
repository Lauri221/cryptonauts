// Game state variables
let player, ally;
let enemies = [];
let turn = 'player';  
let battleBackground = 'combat';
let gameState = {};

// Combat turn order system
let turnOrder = [];
let currentTurnIndex = 0;
let firstEnemyPortrait; // Reference to the existing enemy portrait

// Load game state and initialize
window.addEventListener('DOMContentLoaded', () => {
  // Get reference to first enemy portrait
  firstEnemyPortrait = document.getElementById('enemy-portrait');
  const enemyArea = document.getElementById('enemy-area');

  // Load game state data
  fetch('game-state.json')
    .then(r => r.json())
    .then(state => {
      gameState = state;
      player = gameState.player;
      ally = gameState.ally;
      loadEncounter(gameState.currentEncounter);
    })
    .catch(err => console.error('Failed to load data:', err));
});

/**
 * Loads a specific encounter from the game state
 * @param {number} idx - The encounter index to load
 */
function loadEncounter(idx) {
  const enc = gameState.encounters[idx];
  battleBackground = enc.backdrop;
  
  // Ensure player and ally status is current
  player.alive = player.hp > 0;
  ally.alive = ally.hp > 0;
  
  // Set up enemies (maximum 3)
  enemies = enc.enemies.slice(0, 3);
  
  // Initialize combat
  updateUI();
  startRound();
}

/**
 * Updates all UI elements to match current game state
 */
function updateUI() {
  // Update stats display
  document.getElementById('player-hp').textContent = player.hp;
  document.getElementById('player-sanity').textContent = player.sanity;
  document.getElementById('ally-hp').textContent = ally.hp;
  document.getElementById('ally-sanity').textContent = ally.sanity;
  
  // Update background
  const backdropElement = document.getElementById('backdrop');
  backdropElement.className = '';
  backdropElement.classList.add(`${battleBackground}-bg`);
  
  // Show/hide ally based on status
  const allyPortrait = document.getElementById('ally-portrait');
  allyPortrait.style.display = ally.alive ? 'block' : 'none';
  
  // Update enemy portraits
  const enemyArea = document.getElementById('enemy-area');
  
  // Clear existing enemy portraits except the first one
  while (enemyArea.children.length > 1) {
    enemyArea.removeChild(enemyArea.lastChild);
  }
  
  // Update or create enemy portraits
  enemies.forEach((e, i) => {
    let enemyPortrait;
    
    if (i === 0) {
      // Use existing portrait for first enemy
      enemyPortrait = firstEnemyPortrait;
      document.getElementById('enemy-hp').textContent = e.hp;
    } else {
      // Create new portraits for additional enemies
      enemyPortrait = document.createElement('div');
      enemyPortrait.className = 'portrait enemy';
      enemyPortrait.innerHTML = `
        <img src="assets/img/enemy_portrait/${e.type}.png" alt="${e.type}">
        <div class="stats">
          <div>HP: <span id="enemy-${i}-hp">${e.hp}</span></div>
        </div>
      `;
      enemyArea.appendChild(enemyPortrait);
    }
    
    // Update portrait image
    const enemyImg = enemyPortrait.querySelector('img');
    enemyImg.src = `assets/img/enemy_portrait/${e.type}.png`;
    enemyImg.alt = e.type.charAt(0).toUpperCase() + e.type.slice(1);
    
    // Show/hide based on alive status
    enemyPortrait.style.display = e.alive ? 'block' : 'none';
  });
}

/**
 * Adds a message to the combat log
 * @param {string} text - Message to display
 */
function log(text) {
  const logDiv = document.getElementById('combat-log');
  logDiv.innerHTML += `<div>> ${text}</div>`;
  logDiv.scrollTop = logDiv.scrollHeight;
}

/**
 * Handles player action selection
 * @param {string} action - The chosen action
 */
function chooseAction(action) {
  if (turn !== 'player') return;
  
  // Find first living enemy as target
  const target = enemies.find(e => e.alive);
  if (!target) return endCombat(true);
  
  switch (action) {
    case 'attack':
      const dmg = Math.floor(Math.random() * 10 + 5);
      target.hp -= dmg;
      if (target.hp <= 0) {
        target.alive = false;
        target.hp = 0;
      }
      log(`You slash the ${target.type} for ${dmg} damage.`);
      break;
    case 'defend':
      player.sanity += 5;
      log("You take a defensive stance. Sanity restored by 5.");
      break;
    case 'element':
      const edmg = Math.floor(Math.random() * 12 + 8);
      target.hp -= edmg;
      if (target.hp <= 0) {
        target.alive = false;
        target.hp = 0;
      }
      player.sanity -= 5;
      log(`You unleash elemental fury! ${edmg} damage dealt, -5 sanity.`);
      break;
    case 'item':
      player.hp += 10;
      player.sanity += 10;
      log("You drink a Tincture of Lucidity. HP +10, Sanity +10.");
      break;
  }
  
  updateUI();
  
  // Check for enemy defeat
  if (enemies.every(e => !e.alive)) {
    endCombat(true);
    return;
  }
  
  // Disable buttons and advance to next combatant
  disableActions();
  currentTurnIndex++;
  setTimeout(nextTurn, 800);
}

/**
 * Builds a new combat round with randomized turn order
 */
function startRound() {
  turnOrder = [];
  log("--- New Round ---");

  // Add living combatants to turn order
  if (player.alive) turnOrder.push({ role: 'player', entity: player });
  if (ally.alive) turnOrder.push({ role: 'ally', entity: ally });
  
  enemies.forEach((e, i) => {
    if (e.alive) turnOrder.push({ role: 'enemy', entity: e, index: i });
  });

  // Check for game over conditions
  if (turnOrder.length === 0 || !player.alive) {
    endCombat(false);
    return;
  }

  // Randomize turn order
  shuffle(turnOrder);
  currentTurnIndex = 0;
  nextTurn();
}

/**
 * Advances to the next turn in the current round
 */
function nextTurn() {
  if (currentTurnIndex >= turnOrder.length) {
    // Round complete, start new round
    startRound();
    return;
  }

  const { role, entity, index } = turnOrder[currentTurnIndex];
  turn = role;

  switch (role) {
    case 'player':
      log("Your turn!");
      enableActions();
      break;
      
    case 'ally':
      log("Ally's turn!");
      performAllyAction(entity);
      break;
      
    case 'enemy':
      log(`${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}'s turn!`);
      performEnemyAction(entity, index);
      break;
  }
}

/**
 * Enables player action buttons
 */
function enableActions() {
  document.querySelectorAll('#actions button').forEach(b => b.disabled = false);
}

/**
 * Disables player action buttons
 */
function disableActions() {
  document.querySelectorAll('#actions button').forEach(b => b.disabled = true);
}

/**
 * Performs automated ally action
 * @param {Object} allyEnt - The ally entity
 */
function performAllyAction(allyEnt) {
  // Find first living enemy
  const target = enemies.find(e => e.alive);
  if (!target) {
    endCombat(true);
    return;
  }

  // Perform attack
  const dmg = Math.floor(Math.random() * 8 + 4);
  target.hp -= dmg;
  
  if (target.hp <= 0) {
    target.alive = false;
    target.hp = 0;
  }
  
  log(`Ally attacks ${target.type} for ${dmg} damage!`);
  updateUI();

  // Check for enemy defeat
  if (enemies.every(e => !e.alive)) {
    endCombat(true);
    return;
  }

  // Continue to next turn
  currentTurnIndex++;
  setTimeout(nextTurn, 800);
}

/**
 * Performs automated enemy action
 * @param {Object} enemyEnt - The enemy entity
 */
function performEnemyAction(enemyEnt) {
  // Target player most of the time, occasionally ally
  const target = Math.random() > 0.7 && ally.alive ? ally : player;
  const targetName = target === player ? "you" : "ally";
  
  const dmg = Math.floor(Math.random() * 10 + 3);
  target.hp -= dmg;
  
  // Reduce sanity only if attacking player
  if (target === player) {
    target.sanity -= 3;
  }
  
  if (target.hp <= 0) {
    target.alive = false;
    target.hp = 0;
  }
  
  log(`${enemyEnt.type.charAt(0).toUpperCase() + enemyEnt.type.slice(1)} attacks ${targetName} for ${dmg} damage!`);
  
  if (target === player) {
    log(`You lose 3 sanity from the horrific attack!`);
  }
  
  updateUI();
  
  // Check for player/ally defeat
  if (!player.alive) {
    endCombat(false);
    return;
  }
  
  // Continue to next turn
  currentTurnIndex++;
  setTimeout(nextTurn, 800);
}

/**
 * Ends the combat encounter
 * @param {boolean} victory - Whether the player won
 */
function endCombat(victory) {
  disableActions();
  
  if (victory) {
    log("Victory! All enemies have been defeated!");
    // Here you could add rewards, XP, etc.
  } else {
    log("Defeat! You have fallen...");
  }
}

/**
 * Shuffles an array in place
 * @param {Array} array - Array to shuffle
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Log starting message when game loads
log("Combat initiated! Prepare for battle...");
