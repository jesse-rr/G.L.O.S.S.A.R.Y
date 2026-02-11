package io.github.glossary.ui;

import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.Camera;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.utils.viewport.FitViewport;
import com.badlogic.gdx.utils.viewport.Viewport;

public class MainScreen implements Screen {

    private SpriteBatch batch;
    private Texture bgTexture;
    private Viewport viewport;
    private Camera camera;

    @Override
    public void show() {
        batch = new SpriteBatch();
        bgTexture = new Texture("");
        camera = new OrthographicCamera();
        viewport = new FitViewport(1280, 720, camera);

        camera.position.set(640, 360, 0);
        camera.update();
    }

    @Override
    public void render(float delta) {
        camera.update();
        batch.setProjectionMatrix(camera.combined);

        batch.begin();
        batch.draw(bgTexture, 0, 0, 1280, 720);
        batch.end();
    }

    @Override
    public void resize(int width, int height) {
        viewport.update(width, height, true);
    }

    @Override
    public void pause() {

    }

    @Override
    public void resume() {

    }

    @Override
    public void hide() {

    }

    @Override
    public void dispose() {

    }
}
