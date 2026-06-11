export type EnemyAnimType = 'idle' | 'fly' | 'attack' | 'hit' | 'death' | 'ability' | 'reset' | 'upgrade' | 'armorBreak' | 'intro';
export type EnemyFxType = 'attack_fx' | 'death_fx' | 'ability_fx';

export interface EnemySpriteSheet {
    key: string;
    path: string;
    frameWidth: number;
    frameHeight: number;
    totalFrames: number;
    startFrame?: number;
    endFrame?: number;
}

export interface EnemyAnimSet {
    variants?: string[];
    sheets: Record<string, EnemySpriteSheet>;
}

export interface EnemyAnimProfile {
    enemyKey: string;
    basePath: string;
    anims: Partial<Record<EnemyAnimType, EnemyAnimSet>>;
    fx: Partial<Record<EnemyFxType, EnemyAnimSet>>;
}

function sheet(key: string, path: string, totalFrames: number, frameWidth = 64, frameHeight = 64, startFrame?: number, endFrame?: number): EnemySpriteSheet {
    return { key, path, frameWidth, frameHeight, totalFrames, startFrame, endFrame };
}

const BAT_BASE = 'assets/Models/Enemies/Bat/';
const CRAB_BASE = 'assets/Models/Enemies/Crab/';
const RAT_BASE = 'assets/Models/Enemies/Rat/';
const SKULL_BASE = 'assets/Models/Enemies/Skull/';
const SLIME_GREEN_BASE = 'assets/Models/Enemies/Slime/Green_Slime/';
const SLIME_BLUE_BASE = 'assets/Models/Enemies/Slime/Blue_Slime/';
const PEBBLE_BASE = 'assets/Models/Enemies/Pebble/';
const GOLEM_NA_BASE = 'assets/Models/Enemies/Golem/No Armor/';
const GOLEM_AR_BASE = 'assets/Models/Enemies/Golem/Armored/';
const SKELETON_BASE = 'assets/Models/Enemies/Fantasy Skeleton Enemies/';

export const ENEMY_ANIM_PROFILES: Record<string, EnemyAnimProfile> = {
    bat: {
        enemyKey: 'bat',
        basePath: BAT_BASE,
        anims: {
            fly: {
                sheets: {
                    default: sheet('bat_fly', BAT_BASE + 'Bat_Fly.png', 4)
                }
            },
            hit: {
                sheets: {
                    default: sheet('bat_hit', BAT_BASE + 'Bat_Hit.png', 8)
                }
            },
            death: {
                sheets: {
                    default: sheet('bat_death', BAT_BASE + 'Bat_Death.png', 12)
                }
            }
        },
        fx: {
            death_fx: {
                sheets: {
                    default: sheet('bat_death_fx', BAT_BASE + 'Bat_Death_FX.png', 3)
                }
            }
        }
    },

    crab: {
        enemyKey: 'crab',
        basePath: CRAB_BASE,
        anims: {
            idle: {
                sheets: {
                    default: sheet('crab_idle', CRAB_BASE + 'Crab_Idle.png', 4)
                }
            },
            hit: {
                sheets: {
                    default: sheet('crab_hit', CRAB_BASE + 'Crab_Hit.png', 3)
                }
            },
            death: {
                sheets: {
                    default: sheet('crab_death', CRAB_BASE + 'Crab_Death.png', 5)
                }
            }
        },
        fx: {}
    },

    rat: {
        enemyKey: 'rat',
        basePath: RAT_BASE,
        anims: {
            idle: {
                sheets: {
                    default: sheet('rat_idle', RAT_BASE + 'Rat_Idle.png', 4)
                }
            },
            hit: {
                sheets: {
                    default: sheet('rat_hit', RAT_BASE + 'Rat_Hit.png', 4)
                }
            },
            death: {
                sheets: {
                    default: sheet('rat_death', RAT_BASE + 'Rat_Death.png', 8)
                }
            }
        },
        fx: {
            death_fx: {
                sheets: {
                    default: sheet('rat_death_fx', RAT_BASE + 'Rat_Death_FX.png', 2)
                }
            }
        }
    },

    skull: {
        enemyKey: 'skull',
        basePath: SKULL_BASE,
        anims: {
            idle: {
                sheets: {
                    default: sheet('skull_idle', SKULL_BASE + 'Bones_SingleSkull_Idle.png', 4)
                }
            },
            fly: {
                sheets: {
                    default: sheet('skull_fly', SKULL_BASE + 'Bones_SingleSkull_Fly.png', 8)
                }
            },
            hit: {
                sheets: {
                    default: sheet('skull_hit', SKULL_BASE + 'Bones_SingleSkull_Hit.png', 4)
                }
            },
            death: {
                sheets: {
                    default: sheet('skull_death', SKULL_BASE + 'Bones_SingleSkull_Death.png', 10)
                }
            }
        },
        fx: {
            death_fx: {
                sheets: {
                    default: sheet('skull_death_fx', SKULL_BASE + 'Bones_SingleSkull_Death_FX.png', 10)
                }
            }
        }
    },

    slime_green: {
        enemyKey: 'slime_green',
        basePath: SLIME_GREEN_BASE,
        anims: {
            idle: {
                sheets: {
                    default: sheet('slime_green_idle', SLIME_GREEN_BASE + 'Slime_Spiked_Idle.png', 4)
                }
            },
            hit: {
                sheets: {
                    default: sheet('slime_green_hit', SLIME_GREEN_BASE + 'Slime_Spiked_Hit.png', 4)
                }
            },
            death: {
                sheets: {
                    default: sheet('slime_green_death', SLIME_GREEN_BASE + 'Slime_Spiked_Death.png', 8)
                }
            }
        },
        fx: {}
    },

    slime_blue: {
        enemyKey: 'slime_blue',
        basePath: SLIME_BLUE_BASE,
        anims: {
            idle: {
                sheets: {
                    default: sheet('slime_blue_idle', SLIME_BLUE_BASE + 'Slime_Spiked_Idle.png', 4)
                }
            },
            hit: {
                sheets: {
                    default: sheet('slime_blue_hit', SLIME_BLUE_BASE + 'Slime_Spiked_Hit.png', 4)
                }
            },
            death: {
                sheets: {
                    default: sheet('slime_blue_death', SLIME_BLUE_BASE + 'Slime_Spiked_Death.png', 8)
                }
            }
        },
        fx: {}
    },

    pebble: {
        enemyKey: 'pebble',
        basePath: PEBBLE_BASE,
        anims: {
            idle: {
                sheets: {
                    default: sheet('pebble_idle', PEBBLE_BASE + 'Pebble_Idle.png', 4)
                }
            },
            hit: {
                sheets: {
                    default: sheet('pebble_hit', PEBBLE_BASE + 'Pebble_Hit.png', 5)
                }
            },
            death: {
                sheets: {
                    default: sheet('pebble_death', PEBBLE_BASE + 'Pebble_Death.png', 4)
                }
            }
        },
        fx: {}
    },

    golem_noarmor: {
        enemyKey: 'golem_noarmor',
        basePath: GOLEM_NA_BASE,
        anims: {
            idle: {
                variants: ['A', 'B'],
                sheets: {
                    A: sheet('golem_na_idleA', GOLEM_NA_BASE + 'Golem_IdleA.png', 4),
                    B: sheet('golem_na_idleB', GOLEM_NA_BASE + 'Golem_IdleB.png', 4)
                }
            },
            hit: {
                variants: ['A', 'B'],
                sheets: {
                    A: sheet('golem_na_hitA', GOLEM_NA_BASE + 'Golem_HitA.png', 5),
                    B: sheet('golem_na_hitB', GOLEM_NA_BASE + 'Golem_HitB.png', 5)
                }
            },
            death: {
                variants: ['A', 'B'],
                sheets: {
                    A: sheet('golem_na_deathA', GOLEM_NA_BASE + 'Golem_DeathA.png', 5),
                    B: sheet('golem_na_deathB', GOLEM_NA_BASE + 'Golem_DeathB.png', 9)
                }
            }
        },
        fx: {
            death_fx: {
                sheets: {
                    default: sheet('golem_na_death_fx', GOLEM_NA_BASE + 'Golem_Death_FX.png', 4)
                }
            }
        }
    },

    golem_armored: {
        enemyKey: 'golem_armored',
        basePath: GOLEM_AR_BASE,
        anims: {
            idle: {
                sheets: {
                    default: sheet('golem_ar_idle', GOLEM_AR_BASE + 'Golem_Armor_Idle.png', 4)
                }
            },
            hit: {
                sheets: {
                    default: sheet('golem_ar_hit', GOLEM_AR_BASE + 'Golem_Armor_Hit.png', 5)
                }
            },
            armorBreak: {
                sheets: {
                    default: sheet('golem_ar_armorbreak', GOLEM_AR_BASE + 'Golem_Armor_ArmorBreak.png', 5)
                }
            },
            intro: {
                sheets: {
                    default: sheet('golem_ar_intro', GOLEM_NA_BASE + 'Golem_Upgrade.png', 11)
                }
            }
        },
        fx: {}
    },
    skeleton_warrior: {
        enemyKey: 'skeleton_warrior',
        basePath: SKELETON_BASE,
        anims: {
            idle: {
                sheets: {
                    default: sheet('skeleton_warrior_idle', SKELETON_BASE + 'Skeleton Warrior.png', 8, 48, 48, 0, 7)
                }
            },
            hit: {
                sheets: {
                    default: sheet('skeleton_warrior_hit', SKELETON_BASE + 'Skeleton Warrior.png', 5, 48, 48, 13, 17)
                }
            },
            death: {
                sheets: {
                    default: sheet('skeleton_warrior_death', SKELETON_BASE + 'Skeleton Warrior.png', 13, 48, 48, 26, 38)
                }
            }
        },
        fx: {}
    },
    skeleton_mage: {
        enemyKey: 'skeleton_mage',
        basePath: SKELETON_BASE,
        anims: {
            idle: {
                sheets: {
                    default: sheet('skeleton_mage_idle', SKELETON_BASE + 'Skeleton Mage.png', 8, 48, 48, 0, 7)
                }
            },
            hit: {
                sheets: {
                    default: sheet('skeleton_mage_hit', SKELETON_BASE + 'Skeleton Mage.png', 5, 48, 48, 17, 21)
                }
            },
            death: {
                sheets: {
                    default: sheet('skeleton_mage_death', SKELETON_BASE + 'Skeleton Mage.png', 17, 48, 48, 34, 50)
                }
            }
        },
        fx: {}
    }
};
