"""
NexusOS Gamification & RPG Progression Backend API
Powers habit streaks, daily quest generation, XP curves, and boss raid mechanics.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math
import time

app = FastAPI(
    title="NexusOS Gamification Engine API",
    description="Python backend service for NexusOS RPG productivity system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlayerState(BaseModel):
    name: str = "Shadow Operative"
    level: int = 14
    current_xp: int = 3450
    target_xp: int = 5000
    rank: str = "A-Rank Vanguard"
    energy: int = 85
    streak_days: int = 19
    completed_quests: int = 87

class HabitAction(BaseModel):
    habit_id: str
    habit_name: str
    difficulty: str = "medium"  # easy, medium, hard, legendary

# In-memory mock database
PLAYER = PlayerState()

QUESTS = [
    {"id": "q1", "title": "Neural Deep Focus (90 Mins)", "category": "Mind", "xp": 350, "difficulty": "hard", "completed": False},
    {"id": "q2", "title": "Physical Overclock (Gym / 5km Run)", "category": "Body", "xp": 300, "difficulty": "medium", "completed": True},
    {"id": "q3", "title": "Commit 300 Lines of C++/Python", "category": "Code", "xp": 450, "difficulty": "legendary", "completed": True},
    {"id": "q4", "title": "Zero Procrastination Window", "category": "Discipline", "xp": 200, "difficulty": "easy", "completed": False}
]

BOSS = {
    "name": "Chronos: The Time Devourer",
    "tier": "World Boss - Phase 2",
    "current_hp": 48200,
    "max_hp": 100000,
    "raid_participants": 12,
    "time_remaining_hours": 36
}

def calculate_xp_for_level(lvl: int) -> int:
    # Exponential scaling curve
    return int(1000 * math.pow(1.22, lvl - 1))

@app.get("/")
def root():
    return {
        "system": "NexusOS Gamification Core",
        "backend": "Python 3.12 FastAPI Service",
        "status": "operational"
    }

@app.get("/api/player")
def get_player():
    PLAYER.target_xp = calculate_xp_for_level(PLAYER.level)
    return PLAYER

@app.get("/api/quests")
def get_quests():
    return {"quests": QUESTS}

@app.post("/api/quests/{quest_id}/complete")
def complete_quest(quest_id: str):
    for q in QUESTS:
        if q["id"] == quest_id:
            if q["completed"]:
                return {"message": "Quest already completed", "player": PLAYER}
            q["completed"] = True
            
            # Add XP and evaluate level-up
            PLAYER.current_xp += q["xp"]
            PLAYER.completed_quests += 1
            
            # Check level up
            target = calculate_xp_for_level(PLAYER.level)
            leveled_up = False
            while PLAYER.current_xp >= target:
                PLAYER.current_xp -= target
                PLAYER.level += 1
                target = calculate_xp_for_level(PLAYER.level)
                leveled_up = True
            
            PLAYER.target_xp = target
            return {
                "success": True,
                "quest": q,
                "xp_awarded": q["xp"],
                "leveled_up": leveled_up,
                "current_level": PLAYER.level,
                "current_xp": PLAYER.current_xp
            }
            
    raise HTTPException(status_code=404, detail="Quest not found")

@app.get("/api/boss/raid")
def get_boss_raid():
    return BOSS

@app.post("/api/habits/check-in")
def habit_checkin(action: HabitAction):
    xp_map = {"easy": 100, "medium": 200, "hard": 350, "legendary": 600}
    xp_gain = xp_map.get(action.difficulty, 150)
    
    # Calculate streak multiplier
    streak_multiplier = round(1.0 + (math.log10(max(1, PLAYER.streak_days)) * 0.5), 2)
    final_xp = int(xp_gain * streak_multiplier)
    
    PLAYER.current_xp += final_xp
    return {
        "habit": action.habit_name,
        "base_xp": xp_gain,
        "streak_multiplier": f"{streak_multiplier}x",
        "total_xp_awarded": final_xp,
        "current_streak_days": PLAYER.streak_days
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
