#include "rpg_engine.hpp"
#include <cmath>
#include <sstream>

namespace nexus::rpg {

RPGEngine::RPGEngine(uint64_t seed) : state_(seed) {
    // Populate standard loot distribution table
    loot_table_ = {
        {"Rusty Copper Token", ItemRarity::COMMON, 10, 0.50},
        {"Silver Focus Shard", ItemRarity::UNCOMMON, 50, 0.28},
        {"Tome of Deep Concentration", ItemRarity::RARE, 250, 0.14},
        {"Cloak of the Flow State", ItemRarity::EPIC, 1200, 0.06},
        {"Crown of Infinite Willpower", ItemRarity::LEGENDARY, 10000, 0.02}
    };
}

// 64-bit XorShift pseudo-random number generator
uint64_t RPGEngine::next_random() {
    uint64_t x = state_;
    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    state_ = x;
    return x;
}

double RPGEngine::next_uniform_double() {
    return (next_random() & 0xFFFFFFFFFFFFFFF) / static_cast<double>(0xFFFFFFFFFFFFFFF);
}

CombatResult RPGEngine::execute_attack(const CombatAction& action) {
    CombatResult result;
    double roll = next_uniform_double();
    
    // Variance jitter +/- 10%
    double jitter = 0.90 + (next_uniform_double() * 0.20);
    uint32_t dmg = static_cast<uint32_t>(action.base_damage * jitter * (1.0 + action.attacker_lvl * 0.05));

    if (roll < action.crit_chance) {
        result.is_critical = true;
        result.total_damage = static_cast<uint32_t>(dmg * action.crit_multiplier);
        result.description = "CRITICAL STRIKE! Dealt " + std::to_string(result.total_damage) + " physical damage.";
    } else {
        result.is_critical = false;
        result.total_damage = dmg;
        result.description = "Normal hit. Dealt " + std::to_string(result.total_damage) + " damage.";
    }

    return result;
}

LootItem RPGEngine::roll_loot_drop(uint32_t boss_tier) {
    // Boss tier increases legendary & epic probability
    double roll = next_uniform_double();
    double cumulative = 0.0;

    for (const auto& item : loot_table_) {
        double adjusted_prob = item.drop_probability;
        if (item.rarity == ItemRarity::LEGENDARY) adjusted_prob *= (1.0 + boss_tier * 0.5);
        if (item.rarity == ItemRarity::EPIC) adjusted_prob *= (1.0 + boss_tier * 0.3);

        cumulative += adjusted_prob;
        if (roll <= cumulative) {
            return item;
        }
    }

    return loot_table_.front();
}

uint64_t RPGEngine::calculate_total_xp_for_level(uint32_t level) {
    uint64_t total = 0;
    for (uint32_t i = 1; i < level; ++i) {
        total += static_cast<uint64_t>(1000.0 * std::pow(1.22, i - 1));
    }
    return total;
}

} // namespace nexus::rpg
