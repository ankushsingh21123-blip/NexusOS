# NexusOS C++20 RPG Engine

High-performance native RPG progression and combat simulation engine for NexusOS.

## Features
- **Deterministic 64-bit XorShift PRNG:** High-speed, reproducible random number generator for fair loot rolls.
- **Dynamic Combat Damage Calculation:** Base damage scaling with character level, critical hit verification, and variance jitter.
- **Weighted Loot Drop Tables:** Tier-aware probability rolls for items from Common to Legendary.
- **Mathematical XP Curve Generation:** Precomputes exponential experience point requirements across levels.

## Build

```bash
mkdir build && cd build
cmake ..
cmake --build .
./nexus_rpg_sim
```
