package io.github.glossary;

import com.badlogic.gdx.Game;
import io.github.glossary.ui.MainScreen;

public class Main extends Game {

    @Override
    public void create() {
        setScreen(new MainScreen());
    }

    @Override
    public void dispose() {
        super.dispose();
    }
}
