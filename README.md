# 🏛️ Cryptonauts

**A Lovecraftian horror dungeon crawler with turn-based tactical combat, sanity mechanics, and AI-generated narratives.**

![Status](https://img.shields.io/badge/Status-Alpha-orange)
![Platform](https://img.shields.io/badge/Platform-Browser-blue)
![License](https://img.shields.io/badge/License-MIT-green)

> *Descend into the crypt. Uncover the truth. Try not to lose your mind.*

---

## 📖 About

Cryptonauts is a browser-based expedition crawler inspired by Lovecraftian cosmic horror. Lead a two-person party through procedurally generated crypts, battle eldritch horrors, manage your sanity, and uncover dark secrets buried beneath the earth.

The game features an optional AI narrative system powered by Google Gemini that generates unique story content, room descriptions, and post-mortem tales based on your journey.

---

## ✨ Features

### ⚔️ Turn-Based Tactical Combat
- Strategic combat system with initiative-based turn order
- Multiple character classes, each with unique abilities
- Target selection for abilities and items
- Flee mechanic for tactical retreats

### 🧠 Sanity System
- Dual resource management: HP and Sanity
- Visual and audio effects as sanity deteriorates
- Text scrambling and screen distortions at low sanity
- Sanity-draining enemies and environmental hazards

### 👥 Party System
- Choose your main character from multiple classes:
  - **Monk** - Sanity restoration and hypnosis
  - **Hunter** - Traps and ranged combat
  - **Scholar** - Knowledge and defensive buffs
  - **Alchemist** - Potions and area effects
  - **Soldier** - Direct damage and taunts
  - **Aberration** - Eldritch powers with self-damage
- Recruit a companion with complementary abilities
- Level up system with stat progression

### 🩸 Status Effects
| Effect | Icon | Description |
|--------|------|-------------|
| Bleeding | 🩸 | Damage over time, stackable |
| Poison | 🧪 | Poison damage each turn |
| Burning | 🔥 | Fire damage each turn |
| Stunned | 💫 | Skip turn, move to back of queue |
| Hypnotised | 🌀 | Attack allies instead of enemies |
| Inspired | ⚔️ | Increased attack damage |
| Protected | 🛡️ | Increased defense |
| Calm | 💚 | Sanity regeneration |

### 🗺️ Exploration
- 7 levels of increasing depth and danger
- Multiple room types with unique encounters
- Branching paths and navigation choices
- Boss encounters on deeper levels
- Loot drops and inventory management

### 🤖 AI-Generated Content (Optional)
- Dynamic room descriptions
- Contextual narrative responses
- Personalized post-mortem stories
- Powered by Google Gemini API

### 🎨 Atmosphere
- Dark, gothic visual design
- Lovecraftian horror aesthetic
- Dynamic sanity-based visual effects
- Atmospheric sound design and music
- Fullscreen support for immersion

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.x** - [Download here](https://www.python.org/downloads/)
  - ⚠️ Windows users: Check "Add Python to PATH" during installation
- **Modern web browser** (Chrome, Firefox, Edge, or Safari)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lauri221/cryptonauts.git
   cd cryptonauts
   ```

   Or [download the ZIP](https://github.com/Lauri221/cryptonauts/archive/refs/heads/main.zip) and extract it.

2. **Launch the game**

   **Windows:**
   ```
   Double-click play_cryptonauts.bat
   ```

   **Mac/Linux:**
   ```bash
   chmod +x play_cryptonauts.sh
   ./play_cryptonauts.sh
   ```

3. **Play!**
   - The game will automatically open in your default browser
   - Keep the terminal/command window open while playing
   - Press `Ctrl+C` in the terminal to stop the server when done

---

## 🤖 AI Narratives Setup (Optional)

Enhance your experience with AI-generated story content:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

2. Add your API key using **one** of these methods:

   **Option A: Environment File**
   ```bash
   cp .env.example .env
   # Edit .env and add your key:
   # GEMINI_API_KEY=your_api_key_here
   ```

   **Option B: In-Game Options**
   - Click "Options" from the main menu
   - Paste your API key in the Gemini API field
   - Enable "Gemini AI"
   - Click "Test Connection" to verify

---

## 💾 Save System

Your progress is automatically saved to your browser's local storage:

- ✅ Saves persist between sessions
- ✅ No account required
- ✅ Works offline after initial load

**Note:** Saves are browser-specific. Using a different browser or clearing browser data will reset your progress.

---

## 🎮 Controls

| Action | Key/Button |
|--------|------------|
| Fullscreen | F11 or ⛶ button |
| Pause Menu | Escape |
| Select Target | Click on portrait |
| Cancel Action | Right-click |

---

## 🐛 Troubleshooting

<details>
<summary><strong>"Python is not installed"</strong></summary>

- Download Python from [python.org](https://www.python.org/downloads/)
- Windows: Reinstall and check "Add Python to PATH"
- Restart your terminal after installation
</details>

<details>
<summary><strong>Port already in use</strong></summary>

The launcher automatically tries ports 8000, 8080, and 8888. If all are in use:
- Close other applications using those ports
- Or manually run: `python -m http.server 9000` and open `http://localhost:9000/start_screen.html`
</details>

<details>
<summary><strong>Game won't load / blank screen</strong></summary>

- Ensure you're accessing via `http://localhost:XXXX/` not `file://`
- Check that the terminal window is still running
- Try a different browser
- Check browser console (F12) for errors
</details>

<details>
<summary><strong>AI narratives not working</strong></summary>

- Verify your API key is correct
- Check your internet connection
- Use "Test Connection" in Options to diagnose
- The game works without AI - it uses fallback narratives
</details>

---

## 📁 Project Structure

```
cryptonauts/
├── index.html          # Combat screen
├── exploration.html    # Exploration screen
├── start_screen.html   # Main menu
├── game_end.html       # Victory/defeat screen
├── main.js             # Combat logic
├── exploration.js      # Exploration logic
├── config.js           # Configuration & utilities
├── style.css           # Main styles
├── exploration.css     # Exploration styles
├── characters.json     # Character definitions
├── enemies.json        # Enemy definitions
├── abilities.json      # Ability definitions
├── status_effects.json # Status effect definitions
├── rooms.json          # Room templates
├── inventory.json      # Item definitions
├── assets/             # Images and portraits
├── music/              # Background music
├── sound/              # Sound effects
└── play_cryptonauts.*  # Launch scripts
```

---

## 🛠️ Development

To run for development:

```bash
# Start local server
python -m http.server 8000

# Open in browser
# http://localhost:8000/start_screen.html
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by Lovecraft's cosmic horror mythos
- AI narratives powered by [Google Gemini](https://ai.google.dev/)
- Font families: Cinzel & Cormorant Garamond

---

<p align="center">
  <em>The crypt awaits. Will you answer the call?</em>
</p>