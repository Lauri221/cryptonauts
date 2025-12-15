# 🏛️ Cryptonauts - Expedition Crawler

A Lovecraft-inspired dungeon crawler with turn-based combat and AI-generated narratives.

## 🎮 Quick Start

### Windows
1. Double-click `play_cryptonauts.bat`
2. The game will open in your default browser
3. Keep the command window open while playing

### Mac/Linux
1. Open Terminal in the game folder
2. Run: `chmod +x play_cryptonauts.sh && ./play_cryptonauts.sh`
3. The game will open in your default browser
4. Keep the terminal open while playing

## 📋 Requirements

- **Python 3.x** - Download from [python.org](https://www.python.org/downloads/)
  - Windows: Make sure to check "Add Python to PATH" during installation
- **Modern web browser** (Chrome, Firefox, Edge, Safari)

## 🤖 AI Narratives (Optional)

For AI-generated story content powered by Google Gemini:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Either:
   - Copy `.env.example` to `.env` and add your key, OR
   - Enter the key in the game's Options menu

## 💾 Save Data

Your game progress is automatically saved in your browser's local storage. As long as you:
- Play from the same browser
- Don't clear your browser data

Your saves will persist between sessions!

## 🎯 Game Features

- **Turn-based tactical combat** with sanity mechanics
- **Multiple character classes** with unique abilities
- **Procedural dungeon exploration**
- **Status effects**: Bleeding 🩸, Poison 🧪, Fire 🔥, Stun 💫, and more
- **Companion system** with AI allies
- **Lovecraftian horror atmosphere** with sanity effects

## 🐛 Troubleshooting

**"Python is not installed"**
- Install Python from python.org
- Windows: Reinstall and check "Add Python to PATH"

**Port already in use**
- The launcher will automatically try ports 8000, 8080, then 8888
- Or close other applications using those ports

**Game won't load**
- Make sure you're accessing via `http://localhost:XXXX/` not `file://`
- Check that the command window/terminal is still running

---

*Descend into the crypt. Uncover the truth. Try not to lose your mind.*
