# NexusOS Gamification & RPG Engine API

Asynchronous Python FastAPI service powering the RPG gamification loops of NexusOS.

## Capabilities
- **Player Progression & Exponential XP Curves:** Dynamic leveling curve calculation where requirements scale realistically per tier.
- **Quest Lifecycle & Verification:** Daily quest completion, rewards distribution, and anti-duplicate guards.
- **Logarithmic Habit Streak Multipliers:** Reward consistency with mathematical streak multipliers `1 + 0.5 * log10(days)`.
- **Boss Raid World State:** Multi-user synchronous health tracking for boss battles.

## Quickstart

```bash
pip install -r requirements.txt
python main.py
```
API runs on `http://localhost:8001`.
