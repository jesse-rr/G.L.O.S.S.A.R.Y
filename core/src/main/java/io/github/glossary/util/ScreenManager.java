package io.github.glossary.util;

import io.github.glossary.Main;
import io.github.glossary.ui.CovenantScreen;
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
}
