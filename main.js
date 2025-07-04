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
let victorySound = new Audio('./music/victory_music.mp3');

//adding sound effects for combat
let attackSound = new Audio('./sound/attack.mp3');
let defendSound = new Audio('./sound/defend.mp3');
let potion_sound = new Audio('./sound/potion.mp3');

// Character hurt sound effects (arrays for randomization)

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

// character win soubnds, dialogue

let cryptonaut_male_win_sounds = [
  new Audio('./sound/cryptonaut_male_win_01.mp3'),
  new Audio('./sound/cryptonaut_male_win_02.mp3')
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

// Character sounds effects for start of combat:

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
  new Audio('./sound/enemy_male_combat_start_01.mp3'),
  new Audio('./sound/enemy_male_combat_start_02.mp3')
];

//let hurtSoundsMale = [
//  new Audio('./sound/hurt_m1.mp3'),
//  new Audio('./sound/hurt_m2.mp3'),
//  new Audio('./sound/hurt_m3.mp3')
//];

//let hurtSoundsFemale = [
//  new Audio('./sound/hurt_f1.mp3'),
//  new Audio('./sound/hurt_f2.mp3')
//];

// Character death sound effects for party characters
//let deathSoundsMale = [
//  new Audio('./sound/death_m1.mp3')
//];
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

// Character death sound effects for enemies:

let enemy_death_male_sound = [
  new Audio('./sound/enemy_male_death_01.mp3'),
  new Audio('./sound/enemy_male_death_02.mp3'),
  new Audio('./sound/enemy_male_death_03.mp3'),
  new Audio('./sound/enemy_male_death_04.mp3')
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
      // Play attack sound
      attackSound.play().catch(e => console.log("Sound error:", e));
      break;
    case "defend":
      // Simple defend: regains sanity
      player.sanity += 5;
      log("You defend and regain 5 sanity.");
      // Play defend sound
      defendSound.play().catch(e => console.log("Sound error:", e));
      break;
    case "element":
      // Elemental ability: higher damage, cost some sanity
      dmg = Math.floor(Math.random() * 12 + 8);
      targetEnemy.hp -= dmg;
      player.sanity -= 5;
      log(`Elemental strike! ${dmg} damage dealt, sanity -5.`);
      // Play attack sound for elemental attack too
      attackSound.play().catch(e => console.log("Sound error:", e));
      break;
    case "item":
      // Using an item: raises HP & sanity
      player.hp += 10;
      player.sanity += 10;
      log("You use a Tincture of Lucidity. HP +10, Sanity +10.");
      // Play potion sound for healing item
      potion_sound.play().catch(e => console.log("Sound error:", e));
      break;
    default:
      // Unknown or unhandled action
      log("Unknown action.");
      return;
  }
  
  // Log the new state of the target after action
  console.log(`After attack: ${targetEnemy.name}, HP: ${targetEnemy.hp}`);
  
  // Check if enemy was damaged and flash their portrait
  if (dmg > 0) {
    // Find the enemy index for portrait flashing
    const enemyIndex = enemies.indexOf(targetEnemy);
    if (enemyIndex >= 0) {
      // Update this specific enemy's HP in the UI immediately
      updateEnemyHP(enemyIndex);
      flashDamage(`enemy-portrait-${enemyIndex}`);
    }
    
    // Check if enemy was defeated
    if (targetEnemy.hp <= 0) {
      targetEnemy.alive = false;
      console.log(`Enemy defeated: ${targetEnemy.name}, setting alive to false`);
      // Play death sound for the enemy with a delay
      setTimeout(() => {
        const deathSoundArray = targetEnemy.gender === 'f' ? deathSoundsFemale : deathSoundsMale;
        playRandomSound(deathSoundArray);
      }, 1000);
    } else {
      // Play hurt sound if the enemy was damaged but not defeated (with delay)
      setTimeout(() => {
        const hurtSoundArray = targetEnemy.gender === 'f' ? hurtSoundsFemale : hurtSoundsMale;
        playRandomSound(hurtSoundArray);
      }, 1000);
    }
  }
  
  // Full UI update
  updateUI();
  
  checkEnemyStatus(); // See if that action killed the enemy
  saveGameState();    // Save the updated stats/HP
  
  // Only proceed to next turn if combat hasn't ended
  if (!combatEnded) {
    setTimeout(nextTurn, 2000); // Move on to the next turn after 2 seconds
  }
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
    attackSound.play().catch(e => console.log("Sound error:", e));
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
        const deathSoundArray = targetEnemy.gender === 'f' ? deathSoundsFemale : deathSoundsMale;
        playRandomSound(deathSoundArray);
      }, 1000);
    } else {
      // Play hurt sound if the enemy was damaged but not defeated (with delay)
      setTimeout(() => {
        const hurtSoundArray = targetEnemy.gender === 'f' ? hurtSoundsFemale : hurtSoundsMale;
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
  attackSound.play().catch(e => console.log("Sound error:", e));
  
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
      const playerSounds = player.gender === 'f' ? hurtSoundsFemale : hurtSoundsMale;
      playRandomSound(playerSounds);
      
      // Check if player is defeated (only play death sound if actually dying)
      if (player.hp <= 0 && player.alive) {
        player.alive = false; // Mark as dead
        // Play death sound for player
        const playerDeathSounds = player.gender === 'f' ? deathSoundsFemale : deathSoundsMale;
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
      const companionSounds = companion.gender === 'f' ? hurtSoundsFemale : hurtSoundsMale;
      playRandomSound(companionSounds);
      
      // Check if companion is defeated (only play death sound if actually dying)
      if (companion.hp <= 0 && companion.alive) {
        // Play death sound for companion
        const companionDeathSounds = companion.gender === 'f' ? deathSoundsFemale : deathSoundsMale;
        playRandomSound(companionDeathSounds);
      }
    }, 1000);
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
    setTimeout(nextTurn, 2000); // Move to the next turn after 2 seconds
  }
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
