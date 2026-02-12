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
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.math.Rectangle;
import com.badlogic.gdx.math.Vector3;
import com.badlogic.gdx.utils.viewport.FitViewport;
import com.badlogic.gdx.utils.viewport.Viewport;
import io.github.glossary.util.ScreenManager;

import static com.badlogic.gdx.graphics.g2d.Animation.*;

public class MainScreen implements Screen {

    private Texture backgroundSheet;
    private Texture selectorSheet;
    private Texture cloudAnimationSheet;

    private Animation<TextureRegion> animation1;
    private Animation<TextureRegion> animation2;
    private Animation<TextureRegion> animation3;

    private float stateTime;
    private float cloudStateTime = 0f;
    private boolean cloudPlaying = false;

    private SpriteBatch batch;
    private Viewport viewport;
    private Camera camera;
    private ShapeRenderer shapeRenderer;

    private Rectangle newGameBtn;
    private Rectangle continueBtn;
    private Rectangle helpBtn;
    private Rectangle exitBtn;

    private Vector3 mouse;
    private Rectangle selectedBtn;

    @Override
    public void show() {

        batch = new SpriteBatch();

        backgroundSheet = new Texture("exports/Start-Page-Sheet.png");
        selectorSheet = new Texture("exports/Menu-Btn-Sheet.png");
        cloudAnimationSheet = new Texture("exports/Cloud-Animation-Sheet.png");

        animation1 = this.loadAnimation(backgroundSheet, 9, 1, 0.1f, PlayMode.LOOP);
        animation2 = this.loadAnimation(selectorSheet, 9, 1, 0.1f, PlayMode.LOOP);
        animation3 = this.loadAnimation(cloudAnimationSheet, 18, 1, 0.1f, PlayMode.NORMAL);

        stateTime = 0f;
        camera = new OrthographicCamera();
        viewport = new FitViewport(1280, 720, camera);
        viewport.apply(true);

        camera.position.set(640, 360, 0);
        camera.update();

        shapeRenderer = new ShapeRenderer();

        newGameBtn = new Rectangle(130, 355, 215, 45);
        continueBtn = new Rectangle(130, 293, 215, 45);
        helpBtn = new Rectangle(130, 228, 115, 45);
        exitBtn = new Rectangle(130, 163, 105, 45);

        selectedBtn = newGameBtn;
        mouse = new Vector3();
    }

    @Override
    public void render(float delta) {

        stateTime += delta;

        if (cloudPlaying) {
            cloudStateTime += delta;
            if (animation3.isAnimationFinished(cloudStateTime)) {
                cloudPlaying = false;
            }
        }

        TextureRegion bgFrame = animation1.getKeyFrame(stateTime);
        TextureRegion selectorFrame = animation2.getKeyFrame(stateTime);
        TextureRegion cloudFrame = animation3.getKeyFrame(cloudStateTime);

        Gdx.gl.glClearColor(0, 0, 0, 1);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);

        viewport.apply();
        camera.update();

        handleInput();

        batch.setProjectionMatrix(camera.combined);
        batch.begin();

        batch.draw(bgFrame, 0, 0, 1280, 720);

        if (cloudPlaying) {
            batch.draw(cloudFrame, 0, 0, 1280, 720);
        }

        batch.draw(
                selectorFrame,
                selectedBtn.x - 60,
                selectedBtn.y,
                50,
                selectedBtn.height
        );

        batch.end();

        shapeRenderer.setProjectionMatrix(camera.combined);
        shapeRenderer.begin(ShapeRenderer.ShapeType.Line);
        shapeRenderer.setColor(1, 0, 0, 1);

        shapeRenderer.rect(newGameBtn.x, newGameBtn.y, newGameBtn.width, newGameBtn.height);
        shapeRenderer.rect(continueBtn.x, continueBtn.y, continueBtn.width, continueBtn.height);
        shapeRenderer.rect(helpBtn.x, helpBtn.y, helpBtn.width, helpBtn.height);
        shapeRenderer.rect(exitBtn.x, exitBtn.y, exitBtn.width, exitBtn.height);

        shapeRenderer.end();
    }

    @Override
    public void resize(int width, int height) {
        viewport.update(width, height, true);
    }

    @Override public void pause() {}
    @Override public void resume() {}
    @Override public void hide() {}

    @Override
    public void dispose() {
        batch.dispose();
        backgroundSheet.dispose();
        selectorSheet.dispose();
        cloudAnimationSheet.dispose();
        shapeRenderer.dispose();
    }

    private Animation<TextureRegion> loadAnimation(Texture textureSheet, int framesCount, int rows, float velocity, PlayMode playMode) {
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

    private void handleInput() {

        mouse.set(Gdx.input.getX(), Gdx.input.getY(), 0);
        camera.unproject(mouse);

        if (newGameBtn.contains(mouse.x, mouse.y)) {
            selectedBtn = newGameBtn;

        } else if (continueBtn.contains(mouse.x, mouse.y)) {
            selectedBtn = continueBtn;
        } else if (helpBtn.contains(mouse.x, mouse.y)) {
            selectedBtn = helpBtn;
        } else if (exitBtn.contains(mouse.x, mouse.y)) {
            selectedBtn = exitBtn;
        }

        if (Gdx.input.justTouched()) {

            if (selectedBtn == newGameBtn ||
                    selectedBtn == continueBtn ||
                    selectedBtn == helpBtn) {

                cloudPlaying = true;
                cloudStateTime = 0f;
            }

            if (selectedBtn == newGameBtn) {
                ScreenManager.showCovenant();
            }

            if (selectedBtn == exitBtn) {
                Gdx.app.exit();
            }
        }
    }

}
