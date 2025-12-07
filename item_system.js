// ========================
// Item System Module
// ========================
// Unified item management for combat and exploration contexts.
// This module handles item definitions, inventory state, and effect application.

// Item database loaded from inventory.json (keyed by item_id)
let ItemDB = {};

// Runtime inventory state: { itemId: quantity, ... }
let inventoryState = {};

// Special effect handlers for items with complex behavior
const effectHandlers = {};

// ========================
// Initialization
// ========================

/**
 * Load item definitions from inventory.json and convert to a lookup map.
 * @param {string} jsonPath - Path to the inventory JSON file
 * @returns {Promise<Object>} - The loaded ItemDB
 */
async function loadItemDatabase(jsonPath = './inventory.json') {
  try {
    const response = await fetch(jsonPath);
    if (!response.ok) {
      throw new Error(`Failed to load item database from ${jsonPath}`);
    }
    const rawData = await response.json();
    
    // Convert array to map keyed by item_id
    if (Array.isArray(rawData)) {
      ItemDB = rawData.reduce((map, item) => {
        if (item?.item_id) {
          map[item.item_id] = item;
        }
        return map;
      }, {});
    } else if (rawData.items && Array.isArray(rawData.items)) {
      ItemDB = rawData.items.reduce((map, item) => {
        if (item?.item_id) {
          map[item.item_id] = item;
        }
        return map;
      }, {});
    } else {
      ItemDB = rawData;
    }
    
    console.log('Item database loaded:', Object.keys(ItemDB).length, 'items');
    return ItemDB;
  } catch (error) {
    console.error('Error loading item database:', error);
    return {};
  }
}

/**
 * Initialize inventory state from a saved state or default values.
 * @param {Object} savedState - Previous inventory state { itemId: quantity }
 */
function initInventoryState(savedState = {}) {
  inventoryState = { ...savedState };
  console.log('Inventory state initialized:', inventoryState);
}

/**
 * Add items to inventory (e.g., from loot, starting inventory).
 * @param {string} itemId - The item ID to add
 * @param {number} quantity - How many to add (default 1)
 */
function addToInventory(itemId, quantity = 1) {
  if (!ItemDB[itemId]) {
    console.warn(`Cannot add unknown item: ${itemId}`);
    return false;
  }
  inventoryState[itemId] = (inventoryState[itemId] || 0) + quantity;
  console.log(`Added ${quantity}x ${itemId} to inventory. Total: ${inventoryState[itemId]}`);
  return true;
}

/**
 * Remove items from inventory.
 * @param {string} itemId - The item ID to remove
 * @param {number} quantity - How many to remove (default 1)
 */
function removeFromInventory(itemId, quantity = 1) {
  if (!inventoryState[itemId] || inventoryState[itemId] < quantity) {
    return false;
  }
  inventoryState[itemId] -= quantity;
  if (inventoryState[itemId] <= 0) {
    delete inventoryState[itemId];
  }
  return true;
}

/**
 * Get the current inventory state.
 * @returns {Object} - Current inventory { itemId: quantity }
 */
function getInventoryState() {
  return { ...inventoryState };
}

// ========================
// Core Item API
// ========================

/**
 * Get item definition from the database.
 * @param {string} itemId - The item ID to look up
 * @returns {Object|null} - Item definition or null if not found
 */
function getItemDef(itemId) {
  return ItemDB[itemId] || null;
}

/**
 * Check if an item can be used in the given context.
 * @param {string} itemId - The item ID to check
 * @param {Object} context - The usage context { type, gameState, ... }
 * @returns {boolean} - Whether the item can be used
 */
function canUseItem(itemId, context) {
  const item = getItemDef(itemId);
  if (!item) return false;

  // Check quantity in inventory
  const qty = inventoryState[itemId] || 0;
  if (qty <= 0) return false;

  // Check if item is usable in this context type
  if (item.usableContexts && !item.usableContexts.includes(context.type)) {
    return false;
  }

  // Additional checks based on item requirements
  if (item.requirements) {
    // Example: can't use healing items on dead targets
    if (item.requirements.targetAlive && context.target && !context.target.alive) {
      return false;
    }
  }

  return true;
}

/**
 * Use an item, applying its effects and consuming it if appropriate.
 * @param {string} itemId - The item ID to use
 * @param {Object} context - The usage context
 * @returns {Object} - Result { success, reason?, messages? }
 */
function useItem(itemId, context) {
  if (!canUseItem(itemId, context)) {
    return { success: false, reason: 'not_usable' };
  }

  const item = getItemDef(itemId);
  const messages = [];

  // Apply data-driven effects
  if (item.effects && Array.isArray(item.effects)) {
    item.effects.forEach(effect => {
      const outcome = applyItemEffect(effect, context);
      if (outcome?.messages?.length) {
        messages.push(...outcome.messages);
      } else if (outcome?.message) {
        messages.push(outcome.message);
      }
    });
  }

  // Run special handler if defined
  if (item.effectHandler && effectHandlers[item.effectHandler]) {
    const handlerResult = effectHandlers[item.effectHandler](item, context);
    if (handlerResult?.message) {
      messages.push(handlerResult.message);
    }
  }

  // Consume item if it's consumable
  const itemType = item.type || 'consumable';
  if (itemType === 'consumable' || itemType === 'key') {
    removeFromInventory(itemId, 1);
  }

  return { 
    success: true, 
    messages,
    itemName: item.name
  };
}

/**
 * Get all items usable in the current context with quantity > 0.
 * @param {string} contextType - 'combat' or 'exploration'
 * @returns {Array} - Array of { itemId, quantity, def }
 */
function getUsableItemsForContext(contextType) {
  const result = [];

  for (const [itemId, qty] of Object.entries(inventoryState)) {
    if (qty <= 0) continue;
    
    const def = getItemDef(itemId);
    if (!def) continue;

    // If no usableContexts defined, item is usable everywhere
    if (!def.usableContexts || def.usableContexts.includes(contextType)) {
      result.push({ itemId, quantity: qty, def });
    }
  }

  return result;
}

// ========================
// Effect Resolution
// ========================

/**
 * Roll dice based on a dice specification string like "2d6" or "1d8+2".
 * @param {string} diceSpec - Dice specification (e.g., "2d6", "1d8+2")
 * @returns {number} - Total rolled value
 */
function rollDice(diceSpec) {
  if (typeof diceSpec === 'number') return diceSpec;
  if (!diceSpec || typeof diceSpec !== 'string') return 0;

  // Parse dice notation: XdY or XdY+Z or XdY-Z
  const match = diceSpec.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    // Try to parse as plain number
    const num = parseInt(diceSpec, 10);
    return isNaN(num) ? 0 : num;
  }

  const numDice = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  total += modifier;

  return Math.max(0, total); // Ensure non-negative
}

/**
 * Get the target character from the context.
 * @param {Object} context - Usage context
 * @returns {Object|null} - Target character object
 */
function getTargetCharacter(context) {
  // If explicit target is provided, use it
  if (context.target) {
    return context.target;
  }

  // Default to user (self-targeting)
  if (context.userId === 'player' || context.userId === 'hero') {
    return context.gameState?.player || context.player;
  }
  if (context.userId === 'companion' || context.userId === 'ally') {
    return context.gameState?.companion || context.companion;
  }

  // Check enemies
  if (context.targetId && context.gameState?.enemies) {
    return context.gameState.enemies.find(e => e.id === context.targetId);
  }

  return null;
}

function getSharedEffectEngine() {
  return (typeof window !== 'undefined' ? window.sharedEffectEngine : globalThis.sharedEffectEngine) || null;
}

function resolveMagnitudeSpec(effect) {
  if (effect.dice) return effect.dice;
  if (typeof effect.amount === 'number') return `${effect.amount}`;
  return '0';
}

function mapStatusIdFromItem(statusName) {
  if (!statusName) return null;
  const normalized = statusName.toLowerCase();
  switch (normalized) {
    case 'burning':
      return 'fire';
    case 'poisoned':
      return 'poison';
    case 'bleeding':
      return 'bleeding';
    default:
      return normalized;
  }
}

function convertItemEffectToAbilityEffect(effect) {
  if (!effect) return null;
  switch (effect.kind) {
    case 'hp':
      return {
        type: effect.mode === 'damage' ? 'damage' : 'heal',
        resource: 'hp',
        magnitude: resolveMagnitudeSpec(effect),
        damage_type: 'physical',
        skipLevelBonus: true
      };
    case 'sanity':
      return {
        type: effect.mode === 'loss' ? 'damage' : 'heal',
        resource: 'sanity',
        magnitude: resolveMagnitudeSpec(effect),
        damage_type: 'sanity',
        skipLevelBonus: true
      };
    case 'cure_status':
      return {
        type: 'cleanse',
        status_id: mapStatusIdFromItem(effect.status)
      };
    case 'cure_all':
      return {
        type: 'cure_all'
      };
    case 'buff': {
      const statusMap = {
        attackdamage: 'attack_up',
        attack: 'attack_up',
        defense: 'defense_up'
      };
      const statusId = statusMap[(effect.stat || '').toLowerCase()];
      if (!statusId) return null;
      return {
        type: 'status',
        status_id: statusId,
        duration_turns: effect.duration || 2,
        magnitude: resolveMagnitudeSpec(effect),
        skipLevelBonus: true
      };
    }
    case 'weapon_coating':
      return {
        type: 'weapon_coating',
        coating_type: effect.coatingType,
        duration_turns: effect.duration || 3,
        magnitude: effect.damagePerTurn || '1d6',
        skipLevelBonus: true
      };
    case 'barrier':
      return {
        type: 'barrier',
        duration_turns: effect.duration || 2
      };
    case 'immobilize':
      return {
        type: 'immobilize',
        duration_turns: effect.duration || 2
      };
    case 'confusion':
      return {
        type: 'confusion',
        duration_turns: effect.duration || 2
      };
    case 'rest':
      return {
        type: 'meta',
        meta_action: 'rest_party'
      };
    default:
      return null;
  }
}

function applyItemEffect(effect, context) {
  const shared = getSharedEffectEngine();
  const abilityEffect = convertItemEffectToAbilityEffect(effect);
  if (shared?.applyEffect && abilityEffect) {
    const caster = context.player || context.gameState?.player || context.target || null;
    const target = context.target || caster;
    const results = shared.applyEffect(abilityEffect, caster || target, target, null);
    return {
      messages: Array.isArray(results)
        ? results
            .filter(r => r?.success && r.amount)
            .map(r => `${r.target?.name || 'Target'} ${r.type === 'heal' ? 'recovers' : 'takes'} ${r.amount}`)
        : []
    };
  }
  return applyLegacyItemEffect(effect, context);
}

/**
 * Apply a single effect using the legacy item resolver.
 */
function applyLegacyItemEffect(effect, context) {
  const result = {};

  switch (effect.kind) {
    case 'hp': {
      const target = getTargetCharacter(context);
      if (!target) break;

      const amount = effect.dice ? rollDice(effect.dice) : (effect.amount || 0);
      const maxHp = target.maxHp || target.hp + amount;

      if (effect.mode === 'heal') {
        const before = target.hp;
        target.hp = Math.min(maxHp, target.hp + amount);
        const healed = target.hp - before;
        result.message = `${target.name || 'Target'} recovers ${healed} HP.`;
      } else if (effect.mode === 'damage') {
        target.hp = Math.max(0, target.hp - amount);
        result.message = `${target.name || 'Target'} takes ${amount} damage.`;
      }
      break;
    }

    case 'sanity': {
      const target = getTargetCharacter(context);
      if (!target) break;

      const amount = effect.dice ? rollDice(effect.dice) : (effect.amount || 0);
      const maxSanity = target.maxSanity || target.sanity + amount;

      if (effect.mode === 'heal') {
        const before = target.sanity;
        target.sanity = Math.min(maxSanity, target.sanity + amount);
        const restored = target.sanity - before;
        result.message = `${target.name || 'Target'} recovers ${restored} Sanity.`;
      } else if (effect.mode === 'loss') {
        target.sanity = Math.max(0, target.sanity - amount);
        result.message = `${target.name || 'Target'} loses ${amount} Sanity.`;
      }
      break;
    }

    case 'status': {
      const target = getTargetCharacter(context);
      if (!target) break;

      // Initialize status effects array if needed
      if (!target.statusEffects) {
        target.statusEffects = [];
      }

      target.statusEffects.push({
        id: effect.status,
        remainingTurns: effect.duration || 1,
        damagePerTurn: effect.damagePerTurn ? rollDice(effect.damagePerTurn) : 0
      });
      result.message = `${target.name || 'Target'} is now ${effect.status}.`;
      break;
    }

    case 'cure_status': {
      const target = getTargetCharacter(context);
      if (!target || !target.statusEffects) break;

      const statusToCure = effect.status;
      const before = target.statusEffects.length;
      target.statusEffects = target.statusEffects.filter(s => s.id !== statusToCure);
      
      if (target.statusEffects.length < before) {
        result.message = `${target.name || 'Target'} is no longer ${statusToCure}.`;
      }
      break;
    }

    case 'cure_all': {
      const target = getTargetCharacter(context);
      if (!target) break;

      target.statusEffects = [];
      result.message = `${target.name || 'Target'}'s status effects have been cleared.`;
      break;
    }

    case 'buff': {
      const target = getTargetCharacter(context);
      if (!target) break;

      if (!target.buffs) {
        target.buffs = [];
      }

      const buffAmount = effect.dice ? rollDice(effect.dice) : (effect.amount || 0);
      target.buffs.push({
        stat: effect.stat,
        amount: buffAmount,
        remainingTurns: effect.duration || 1
      });
      result.message = `${target.name || 'Target'} gains +${buffAmount} ${effect.stat} for ${effect.duration || 1} turns.`;
      break;
    }

    case 'weapon_coating': {
      const target = getTargetCharacter(context);
      if (!target) break;

      if (!target.weaponCoatings) {
        target.weaponCoatings = [];
      }

      target.weaponCoatings.push({
        type: effect.coatingType,
        damagePerTurn: effect.damagePerTurn || '1d6',
        duration: effect.duration || 3
      });
      result.message = `${target.name || 'Target'}'s weapon is now coated with ${effect.coatingType}.`;
      break;
    }

    case 'barrier': {
      const target = getTargetCharacter(context);
      if (!target) break;

      target.barrier = {
        active: true,
        remainingTurns: effect.duration || 2
      };
      result.message = `A protective barrier surrounds ${target.name || 'target'} for ${effect.duration || 2} turns.`;
      break;
    }

    case 'immobilize': {
      const target = getTargetCharacter(context);
      if (!target) break;

      target.immobilized = {
        active: true,
        remainingTurns: effect.duration || 2
      };
      result.message = `${target.name || 'Target'} is immobilized for ${effect.duration || 2} turns.`;
      break;
    }

    case 'confusion': {
      const target = getTargetCharacter(context);
      if (!target) break;

      target.confused = {
        active: true,
        remainingTurns: effect.duration || 2
      };
      result.message = `${target.name || 'Target'} is confused for ${effect.duration || 2} turns.`;
      break;
    }

    case 'rest': {
      // Full party rest - only in exploration context
      if (context.type !== 'exploration' && context.type !== 'rest') {
        result.message = 'You cannot rest during combat.';
        break;
      }

      const party = [context.gameState?.player, context.gameState?.companion].filter(Boolean);
      party.forEach(member => {
        member.hp = member.maxHp || member.hp;
        member.sanity = member.maxSanity || member.sanity;
        member.statusEffects = [];
      });
      result.message = 'The party rests and fully recovers.';
      break;
    }

    case 'unlock': {
      if (context.type === 'exploration' && context.roomId) {
        // Hook for exploration system
        if (typeof unlockRoomTag === 'function') {
          unlockRoomTag(context.roomId, effect.tag, context.gameState);
        }
        result.message = `Unlocked: ${effect.tag}`;
      }
      break;
    }

    default:
      console.warn(`Unknown effect kind: ${effect.kind}`);
  }

  return result;
}

// ========================
// Combat Integration Helpers
// ========================

/**
 * Handle item use during combat - consumes a turn.
 * @param {string} itemId - Item to use
 * @param {Object} target - Target character (player, companion, or enemy)
 * @param {Object} gameState - Current game state { player, companion, enemies }
 * @param {Function} logFn - Function to log messages to combat log
 * @returns {Object} - Result { success, messages }
 */
function handleCombatItemUse(itemId, target, gameState, logFn = console.log) {
  const context = {
    type: 'combat',
    userId: 'player',
    target: target,
    gameState: gameState,
    player: gameState.player,
    companion: gameState.companion
  };

  const result = useItem(itemId, context);

  if (result.success) {
    // Log all effect messages
    if (result.messages) {
      result.messages.forEach(msg => logFn(msg));
    }
    logFn(`Used ${result.itemName}.`);
  } else {
    logFn('Cannot use that item right now.');
  }

  return result;
}

/**
 * Handle item use during exploration - no turn cost.
 * @param {string} itemId - Item to use
 * @param {Object} target - Target character
 * @param {Object} gameState - Current game state
 * @param {string} roomId - Current room ID (optional)
 * @param {Function} logFn - Function to log messages
 * @returns {Object} - Result { success, messages }
 */
function handleExplorationItemUse(itemId, target, gameState, roomId = null, logFn = console.log) {
  const context = {
    type: 'exploration',
    userId: 'player',
    target: target,
    roomId: roomId,
    gameState: gameState,
    player: gameState.player,
    companion: gameState.companion
  };

  const result = useItem(itemId, context);

  if (result.success && result.messages) {
    result.messages.forEach(msg => logFn(msg));
  }

  return result;
}

// ========================
// Exports (for module systems)
// ========================

// If using ES modules or CommonJS, export the API
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadItemDatabase,
    initInventoryState,
    addToInventory,
    removeFromInventory,
    getInventoryState,
    getItemDef,
    canUseItem,
    useItem,
    getUsableItemsForContext,
    rollDice,
    applyItemEffect,
    applyLegacyItemEffect,
    handleCombatItemUse,
    handleExplorationItemUse,
    effectHandlers,
    ItemDB: () => ItemDB,
    inventoryState: () => inventoryState
  };
}
