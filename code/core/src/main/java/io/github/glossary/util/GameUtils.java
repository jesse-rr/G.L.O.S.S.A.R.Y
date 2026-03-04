package io.github.glossary.util;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Animation;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.TextureRegion;
import com.badlogic.gdx.graphics.g2d.freetype.FreeTypeFontGenerator;

public class GameUtils {

    public static String formatDate(float runTime) {
        int minutes = (int) (runTime / 60);
        int seconds = (int) (runTime % 60);
        return String.format(
            "%02d:%02d", minutes, seconds
        );
    }

    public static Animation<TextureRegion> loadAnimation(Texture textureSheet, int framesCount, int rows, float velocity, Animation.PlayMode playMode) {
        TextureRegion[][] tmp = TextureRegion.split(
            textureSheet,
            textureSheet.getWidth() / framesCount,
            textureSheet.getHeight() / rows
        );
        TextureRegion[] frames = new TextureRegion[framesCount];
        for (int i = 0; i < framesCount; i++) {
            frames[i] = tmp[0][i];
        }
        Animation<TextureRegion> temp = new Animation<>(velocity, frames);
        temp.setPlayMode(playMode);
        return temp;
    }

    public static BitmapFont loadFont(String font, int fontSize) {
        FreeTypeFontGenerator gen = new FreeTypeFontGenerator(
            Gdx.files.internal("fonts/"+font)
        );
        FreeTypeFontGenerator.FreeTypeFontParameter parameter = new FreeTypeFontGenerator.FreeTypeFontParameter();
        parameter.size = fontSize;

        BitmapFont resultFont = gen.generateFont(parameter);
        gen.dispose();
        return resultFont;
    }
}
