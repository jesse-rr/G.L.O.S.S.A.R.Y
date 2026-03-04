package io.github.glossary.util;

import io.github.glossary.Main;
import io.github.glossary.entity.PlayerData;
import io.github.glossary.ui.BossScreen;
import io.github.glossary.ui.CovenantScreen;
import io.github.glossary.ui.DungeonScreen;
import io.github.glossary.ui.MainScreen;

public class ScreenManager {

    private static Main main;

    public static void initialize(Main instance) {
        main = instance;
    }

    public static void showCovenant() {
        main.setScreen(new CovenantScreen());
    }

    public static void showMain() {
        main.setScreen(new MainScreen());
    }

    public static void showDungeon(PlayerData playerData) {
        main.setScreen(new DungeonScreen(playerData));
    }

    public static void showBoss(PlayerData playerData) {
        main.setScreen(new BossScreen(playerData));
    }
}
