package io.github.glossary.ui;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Animation;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.g2d.TextureRegion;
import com.badlogic.gdx.utils.Array;
import com.badlogic.gdx.utils.viewport.FitViewport;
import com.badlogic.gdx.utils.viewport.Viewport;
import io.github.glossary.entity.PlayerData;
import io.github.glossary.util.GameUtils;

public class BossScreen implements Screen {

    private Texture monolithSheet;
    private Texture glintSheet;

    private Animation<TextureRegion> monolithAnimation;
    private Animation<TextureRegion> glintAnimation;

    private float stateTime;

    private SpriteBatch batch;
    private Viewport viewport;
    private OrthographicCamera camera;

    private PlayerData playerData;

    public BossScreen(PlayerData playerData) {
        this.playerData = playerData;
    }

    @Override
    public void show() {

        batch = new SpriteBatch();

        monolithSheet = new Texture("exports/Monolith-Sheet.png");
        glintSheet = new Texture("exports/Spark-Sheet.png");

        TextureRegion[][] split = TextureRegion.split(monolithSheet, 640, 360);
        Array<TextureRegion> frames = new Array<>();

        for (int r = 0; r < split.length; r++) {
            for (int c = 0; c < split[0].length; c++) {
                frames.add(split[r][c]);
            }
        }

        monolithAnimation = new Animation<>(0.1f, frames, Animation.PlayMode.LOOP);
        glintAnimation = GameUtils.loadAnimation(glintSheet, 11, 1, 0.1f, Animation.PlayMode.LOOP);

        stateTime = 0f;

        camera = new OrthographicCamera();
        viewport = new FitViewport(1280, 720, camera);
        viewport.apply(true);

        camera.position.set(640, 360, 0);
        camera.update();
    }

    @Override
    public void render(float delta) {

        stateTime += delta;

        TextureRegion frame = monolithAnimation.getKeyFrame(stateTime);
        TextureRegion glintFrame = glintAnimation.getKeyFrame(stateTime);

        Gdx.gl.glClearColor(0, 0, 0, 1);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);

        viewport.apply();
        camera.update();

        batch.setProjectionMatrix(camera.combined);
        batch.begin();

        batch.draw(frame, 0, 0, 1280, 720);
        batch.draw(glintFrame, 20, 200, 28, 28);

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
        monolithSheet.dispose();
    }
}
