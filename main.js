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

// Flag to indicate whether the combat is over (victory or loss)
let combatEnded = false;

// Audio for victory jingle; loaded from relative path
let victorySound = new Audio('./sound/win_m1.mp3');


// ========================
// Initial Setup
// ========================
// We add a single event listener for when the HTML document finishes loading.
// It calls 'loadCombatData()' to begin loading all necessary JSON data and start the game.
document.addEventListener("DOMContentLoaded", () => {
  loadCombatData();
});


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
    // 1) Load player data
    const playerRes = await fetch('player.json'); // Fetch local file
    player = await playerRes.json();              // Convert the response to JS object
    player.alive = player.hp > 0;                 // Mark player as alive if HP > 0
    
    // 2) Load companion data
    const companionRes = await fetch('companion.json');
    companion = await companionRes.json();
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
  
  // Sort in descending order of initiative: higher initiative goes earlier in the turn order.
  // If an enemy or player doesn't have 'init', we fallback to 0.
  combatants.sort((a, b) => (b.data.init || 0) - (a.data.init || 0));
  
  // Start at the first combatant (index 0) in the sorted array
  currentTurn = 0;
  
  // Log the turn order for debugging
  console.log("Combat turn order:", 
    combatants.map(c => `${c.type}: ${c.data.name || 'unnamed'} (init: ${c.data.init || 0})`));
  
  // Begin the first round of combat
  startRound();
}


// ========================
// Starting the Combat Round
// ========================
// Logs the beginning of combat, then triggers 'nextTurn()' to handle the first turn.
function startRound() {
  log("Combat begins!");
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
function updateUI() {
  // Change the background image based on 'battleBackground'
  const backdrop = document.getElementById('backdrop');
  backdrop.className = ''; // Reset classes
  backdrop.classList.add(`${battleBackground}-bg`);
  
  // Update player info
  document.getElementById('player-name').textContent = player.name || "Cryptonaut";
  document.getElementById('player-hp').textContent = player.hp;
  document.getElementById('player-sanity').textContent = player.sanity;
  
  // Show or hide the ally portrait depending on whether they're alive
  document.getElementById('ally-portrait').style.display = companion.alive ? 'block' : 'none';
  
  // Update companion info
  document.getElementById('companion-name').textContent = companion.name || "Companion";
  document.getElementById('ally-hp').textContent = companion.hp;
  document.getElementById('ally-sanity').textContent = companion.sanity;
  
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
      // Update the HP display text
      hpSpan.textContent = enemy.hp;
      // Show the card only if enemy is alive
      card.style.display = enemy.alive !== false && enemy.hp > 0 ? 'block' : 'none';
      console.log(`Enemy ${enemy.name} (index ${i}): HP=${enemy.hp}, alive=${enemy.alive}, display=${card.style.display}`);
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
// Player Action Handler
// ========================
// Called by the UI buttons (Attack, Defend, Element, Item).
function chooseAction(action) {
  // If it's not the player's turn, ignore any clicks
  if (combatants[currentTurn]?.type !== 'player') return;
  
  // Filter enemies to get only those that are alive and have HP > 0
  const validTargets = enemies.filter(e => e.alive !== false && e.hp > 0);
  
  // If no valid targets, check victory immediately
  if (validTargets.length === 0) {
    log("No valid targets remaining!");
    handleVictory();
    return;
  }
  
  // Target the first valid enemy in the filtered array
  const targetEnemy = validTargets[0];
  let dmg = 0;
  
  // Log the current state of the target enemy before action
  console.log(`Targeting enemy: ${targetEnemy.name}, current HP: ${targetEnemy.hp}, alive: ${targetEnemy.alive}`);
  
  // Switch on the action type
  switch(action) {
    case "attack":
      // Basic attack: random damage from 5 to 14
      dmg = Math.floor(Math.random() * 10 + 5);
      targetEnemy.hp -= dmg;
      log(`You attack the ${targetEnemy.name} for ${dmg} damage.`);
      break;
    case "defend":
      // Simple defend: regains sanity
      player.sanity += 5;
      log("You defend and regain 5 sanity.");
      break;
    case "element":
      // Elemental ability: higher damage, cost some sanity
      dmg = Math.floor(Math.random() * 12 + 8);
      targetEnemy.hp -= dmg;
      player.sanity -= 5;
      log(`Elemental strike! ${dmg} damage dealt, sanity -5.`);
      break;
    case "item":
      // Using an item: raises HP & sanity
      player.hp += 10;
      player.sanity += 10;
      log("You use a Tincture of Lucidity. HP +10, Sanity +10.");
      break;
    default:
      // Unknown or unhandled action
      log("Unknown action.");
      return;
  }
  
  // Log the new state of the target after action
  console.log(`After attack: ${targetEnemy.name}, HP: ${targetEnemy.hp}`);
  
  updateUI();         // Reflect any changes in the UI immediately
  
  // Check if enemy was defeated by this action
  if (targetEnemy.hp <= 0) {
    targetEnemy.alive = false;
    console.log(`Enemy defeated: ${targetEnemy.name}, setting alive to false`);
  }
  
  checkEnemyStatus(); // See if that action killed the enemy
  saveGameState();    // Save the updated stats/HP
  
  // Only proceed to next turn if combat hasn't ended
  if (!combatEnded) {
    setTimeout(nextTurn, 1000); // Move on to the next turn after 1 second
  }
}


// ========================
// Companion (Ally) AI
// ========================
// This function is called when the companion's turn starts.
function companionTurn() {
  // If there are no enemies left, trigger victory and exit
  if (!enemies.length || !enemies.some(e => e.alive !== false && e.hp > 0)) {
    console.log("Companion found no valid enemies, triggering victory");
    handleVictory();
    return;
  }
  
  // Sort enemies by HP to find the one with the lowest HP (example AI)
  const targetEnemy = enemies.sort((a, b) => a.hp - b.hp)[0];
  
  // Check if the player or companion is in need of healing
  const playerLow = player.hp < (player.maxHp || 50) * 0.5;
  const companionLow = companion.hp < (companion.maxHp || 30) * 0.4;
  
  // If either is low, apply a heal
  if (playerLow || companionLow) {
    const healTarget = playerLow ? player : companion;
    const healAmt = Math.floor(Math.random() * (companion.support_power || 8) + 5);
    healTarget.hp += healAmt;
    log(`${companion.name} heals ${healTarget === player ? "you" : companion.name} for ${healAmt} HP!`);
  } else {
    // Otherwise, the companion attacks the weakest enemy
    const dmg = Math.floor(Math.random() * (companion.support_power || 8) + 5);
    targetEnemy.hp -= dmg;
    log(`${companion.name} attacks ${targetEnemy.name} for ${dmg} damage!`);
    
    // Check if this attack defeated the enemy
    if (targetEnemy.hp <= 0) {
      targetEnemy.alive = false;
      console.log(`Enemy defeated by companion: ${targetEnemy.name}`);
    }
  }
  
  updateUI();         // Refresh UI
  
  // Check if any enemies were defeated and handle victory if needed
  // If checkEnemyStatus returns true, it means victory was triggered
  if (checkEnemyStatus()) {
    return; // Stop here if victory was triggered
  }
  
  saveGameState();    // Save changes
  
  // Only move to next turn if combat hasn't ended
  if (!combatEnded) {
    setTimeout(nextTurn, 1000); // Move on after 1 second
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
  
  // Calculate damage for the attack
  const dmg = Math.floor(Math.random() * (enemy.attackPower || 5) + 1);
  
  if (targetIsPlayer) {
    // Attacking player
    const sanityDmg = enemy.sanityDamage || 2; // Some enemies also deal sanity damage
    player.hp -= dmg;
    player.sanity -= sanityDmg;
    log(`☠ The ${enemy.name} strikes you for ${dmg} damage, sanity -${sanityDmg}.`);
  } else {
    // Attacking companion
    companion.hp -= dmg;
    log(`☠ The ${enemy.name} attacks ${companion.name} for ${dmg} damage!`);
  }
  
  updateUI();
  
  // Check if the player or companion got defeated here
  if (player.hp <= 0 || player.sanity <= 0) {
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
    setTimeout(nextTurn, 1000); // Move to the next turn
  }
}


// ========================
// Checking for Enemy Defeat
// ========================
// This function checks if any enemies' HP <= 0, removes them from arrays, and triggers victory if all are defeated.
function checkEnemyStatus() {
  // Gather all enemies with zero or negative HP
  const defeated = enemies.filter(e => e.hp <= 0 && e.alive !== false);
  
  // If none are defeated, return false (no changes)
  if (!defeated.length) return false;
  
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
  
  // Log victory message
  log("🏆 Victory! All enemies have been defeated!");
  console.log("Combat victory triggered!");
  
  disableActions(); // Stop the player from clicking actions
  
  // Attempt to play a victory sound
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

// This function is used to leave the combat screen, e.g., after winning.
// It's up to you how you want to transition or reload the page.
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
  
  // Re-sort the combatants by initiative
  combatants.sort((a, b) => (b.data.init || 0) - (a.data.init || 0));
  
  // Log the new turn order for debugging purposes
  console.log("Rebuilt combatants array:", 
    combatants.map(c => `${c.type}: ${c.data.name || 'unnamed'} (init: ${c.data.init || 0})`));
}
