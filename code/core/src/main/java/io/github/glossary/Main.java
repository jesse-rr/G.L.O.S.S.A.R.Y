package io.github.glossary;

import com.badlogic.gdx.Game;
import io.github.glossary.util.ScreenManager;

public class Main extends Game {

    @Override
    public void create() {
        ScreenManager.initialize(this);
        ScreenManager.showMain();
    }

    @Override
    public void dispose() {
        super.dispose();
    }
}
