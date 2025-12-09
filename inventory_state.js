((globalScope) => {
  const gameState = {
    party: { /* hp, sanity, etc. */ },
    inventory: {
      // itemId -> quantity
      vial_vital_humours: 3,
      tincture_of_lucidity: 1,
      coagulant_seal_bandages: 0,
      berserker_blood: 0,
      nightshade_resin: 0,
      black_tar_pitch: 0,
      chillwater_vapours_phial: 0,
      purging_bitter_tincture: 0,
      coagulant_seal_tonic: 0,
      dreamless_incense: 0,
      sigil_of_warding: 0,
      chains_of_old: 0,
      eldritch_discord: 0,
      herbal_tonic: 3,
      // Summon scrolls
      scroll_spirit_guardian: 1,
      scroll_shadow_familiar: 1,
      scroll_healing_wisp: 1
    },
    equipment: {
      // per character
      hero: { weapon: "rusted_shiv" },
      companion: { weapon: null }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = gameState;
  } else {
    globalScope.initialGameState = gameState;
    globalScope.initialInventoryState = { ...gameState.inventory };
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));