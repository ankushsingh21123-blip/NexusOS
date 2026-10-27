#include "rpg_engine.hpp"
#include <iostream>

int main() {
    std::cout << "========================================================\n";
    std::cout << "      NEXUSOS C++20 RPG PROGRESSION & COMBAT ENGINE     \n";
    std::cout << "========================================================\n\n";

    nexus::rpg::RPGEngine engine(20261028);

    // 1. XP Curve Calculation
    std::cout << "[*] Calculating Cumulative XP Milestones:\n";
    for (uint32_t lvl = 1; lvl <= 10; ++lvl) {
        std::cout << "    - Level " << lvl << " Cumulative XP Required: " 
                  << engine.calculate_total_xp_for_level(lvl) << " XP\n";
    }
    std::cout << "\n";

    // 2. Boss Raid Combat Simulation
    std::cout << "[*] Simulating Player Raid Attack against World Boss:\n";
    nexus::rpg::CombatAction action{
        .attacker_lvl = 14,
        .base_damage = 450,
        .crit_chance = 0.35,
        .crit_multiplier = 2.4
    };

    for (int i = 1; i <= 5; ++i) {
        auto res = engine.execute_attack(action);
        std::cout << "    [Round " << i << "] " << res.description << "\n";
    }
    std::cout << "\n";

    // 3. Loot Drop Table Roll
    std::cout << "[*] Rolling Boss Defeat Loot Drops (Tier 3 Boss):\n";
    for (int i = 1; i <= 3; ++i) {
        auto item = engine.roll_loot_drop(3);
        std::cout << "    [Drop " << i << "] Loot: " << item.name 
                  << " | Gold Value: " << item.value_gold << "\n";
    }

    std::cout << "\n[+] NexusOS C++20 RPG Simulation Core operational.\n";
    return 0;
}
