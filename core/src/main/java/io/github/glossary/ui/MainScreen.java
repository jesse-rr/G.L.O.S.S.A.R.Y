package io.github.glossary.ui;

import com.badlogic.gdx.Screen;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.Camera;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Animation;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.g2d.TextureRegion;
import com.badlogic.gdx.utils.viewport.FitViewport;
import com.badlogic.gdx.utils.viewport.Viewport;

public class MainScreen implements Screen {

    private SpriteBatch batch;
    private Texture spriteSheet;
    private Animation<TextureRegion> animation;
    private float stateTime;

    private Viewport viewport;
    private Camera camera;

    @Override
    public void show() {
        batch = new SpriteBatch();

        spriteSheet = new Texture("spread-sheets/Start-Page-Sheet.png");

        int FRAME_COLS = 9; // number of frames
        int FRAME_ROWS = 1;

        TextureRegion[][] tmp = TextureRegion.split(
            spriteSheet,
            spriteSheet.getWidth() / FRAME_COLS,
            spriteSheet.getHeight() / FRAME_ROWS
        );

        TextureRegion[] frames = new TextureRegion[FRAME_COLS * FRAME_ROWS];
        int index = 0;

        for (int i = 0; i < FRAME_ROWS; i++) {
            for (int j = 0; j < FRAME_COLS; j++) {
                frames[index++] = tmp[i][j];
            }
        }

        animation = new Animation<>(0.1f, frames); // 1sec/per frame
        animation.setPlayMode(Animation.PlayMode.LOOP);

        stateTime = 0f;

        camera = new OrthographicCamera();
        viewport = new FitViewport(1280, 720, camera);
        viewport.apply(true);
    }

    @Override
    public void render(float delta) {
        stateTime += delta;

        TextureRegion currentFrame = animation.getKeyFrame(stateTime);

        Gdx.gl.glClearColor(0, 0, 0, 1);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);

        viewport.apply();
        batch.setProjectionMatrix(camera.combined);

        batch.begin();
        batch.draw(currentFrame, 0, 0, 1280, 720);
        batch.end();
    }

    @Override
    public void resize(int width, int height) {
        viewport.update(width, height, true);
    }

    @Override
    public void pause() {}

    @Override
    public void resume() {}

    @Override
    public void hide() {}

    @Override
    public void dispose() {
        batch.dispose();
        spriteSheet.dispose();
    }
}
