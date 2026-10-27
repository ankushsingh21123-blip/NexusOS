#pragma once

#include <string>
#include <vector>
#include <cstdint>

namespace nexus::rpg {

enum class ItemRarity {
    COMMON,
    UNCOMMON,
    RARE,
    EPIC,
    LEGENDARY
};

struct LootItem {
    std::string name;
    ItemRarity rarity;
    uint32_t value_gold;
    double drop_probability;
};

struct CombatAction {
    uint32_t attacker_lvl;
    uint32_t base_damage;
    double crit_chance;
    double crit_multiplier;
};

struct CombatResult {
    bool is_critical;
    uint32_t total_damage;
    std::string description;
};

class RPGEngine {
public:
    explicit RPGEngine(uint64_t seed = 1337);

    // Deterministic combat damage calculator with critical roll
    CombatResult execute_attack(const CombatAction& action);

    // Roll loot drop from predefined loot table
    LootItem roll_loot_drop(uint32_t boss_tier);

    // Fast calculation of cumulative XP required for level N
    uint64_t calculate_total_xp_for_level(uint32_t level);

private:
    uint64_t state_;
    uint64_t next_random();
    double next_uniform_double();
    std::vector<LootItem> loot_table_;
};

} // namespace nexus::rpg
