package io.github.glossary.ui;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.Camera;
import com.badlogic.gdx.graphics.GL20;
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

public class CovenantScreen implements Screen {

    private Texture selectorSheet;
    private Texture dragonSheet;
    private Texture phoenixSheet;
    private Texture snakeSheet;

    private Animation<TextureRegion> selectorAnimation;
    private Animation<TextureRegion> dragonAnimation;
    private Animation<TextureRegion> phoenixAnimation;
    private Animation<TextureRegion> snakeAnimation;

    private float stateTime;

    private SpriteBatch batch;
    private Viewport viewport;
    private Camera camera;
    private ShapeRenderer shapeRenderer;

    private Rectangle cardBtn1;
    private Rectangle cardBtn2;
    private Rectangle cardBtn3;
    private Rectangle goAloneBtn;

    private Vector3 mouse;
    private Rectangle selectedBtn;

    @Override
    public void show() {

        float cardWidth = 260;
        float cardHeight = 380;
        float spacing = 60;
        float cardY = 170;

        float totalWidth = (cardWidth * 3) + (spacing * 2);
        float startX = (1280 - totalWidth) / 2f;

        float card1X = startX;
        float card2X = startX + cardWidth + spacing;
        float card3X = startX + (cardWidth + spacing) * 2;

        batch = new SpriteBatch();

        selectorSheet = new Texture("exports/Covenant-Selector-Btn-Sheet.png");
        dragonSheet = new Texture("exports/Dragon-Sheet.png");
        phoenixSheet = new Texture("exports/Phoenix-Sheet.png");
        snakeSheet = new Texture("exports/Snake-Sheet.png");

        selectorAnimation = loadAnimation(selectorSheet, 7, 1, 0.1f, Animation.PlayMode.LOOP);
        dragonAnimation = loadAnimation(dragonSheet, 5, 1, 0.1f, Animation.PlayMode.LOOP);
        phoenixAnimation = loadAnimation(phoenixSheet, 5, 1, 0.1f, Animation.PlayMode.LOOP);
        snakeAnimation = loadAnimation(snakeSheet, 5, 1, 0.1f, Animation.PlayMode.LOOP);

        stateTime = 0f;

        camera = new OrthographicCamera();
        viewport = new FitViewport(1280, 720, camera);
        viewport.apply(true);

        camera.position.set(640, 360, 0);
        camera.update();

        shapeRenderer = new ShapeRenderer();

        cardBtn1 = new Rectangle(card1X, cardY, cardWidth, cardHeight);
        cardBtn2 = new Rectangle(card2X, cardY, cardWidth, cardHeight);
        cardBtn3 = new Rectangle(card3X, cardY, cardWidth, cardHeight);
        goAloneBtn = new Rectangle(1175, 0, 105, 45);

        selectedBtn = cardBtn2;
        mouse = new Vector3();
    }

    @Override
    public void render(float delta) {

        stateTime += delta;

        TextureRegion selectorFrame = selectorAnimation.getKeyFrame(stateTime);

        TextureRegion dragonFrame = selectedBtn == cardBtn1
                ? dragonAnimation.getKeyFrame(stateTime)
                : dragonAnimation.getKeyFrames()[0];

        TextureRegion phoenixFrame = selectedBtn == cardBtn2
                ? phoenixAnimation.getKeyFrame(stateTime)
                : phoenixAnimation.getKeyFrames()[0];

        TextureRegion snakeFrame = selectedBtn == cardBtn3
                ? snakeAnimation.getKeyFrame(stateTime)
                : snakeAnimation.getKeyFrames()[0];

        Gdx.gl.glClearColor(0, 0, 0, 1);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);

        viewport.apply();
        camera.update();

        handleInput();

        float scale = 1.02f; // 102%;

        batch.setProjectionMatrix(camera.combined);
        batch.begin();

        drawCard(dragonFrame, cardBtn1, selectedBtn == cardBtn1, scale);
        drawCard(phoenixFrame, cardBtn2, selectedBtn == cardBtn2, scale);
        drawCard(snakeFrame, cardBtn3, selectedBtn == cardBtn3, scale);

        batch.setColor(1f, 1f, 1f, 1f);

        batch.draw(
                selectorFrame,
                selectedBtn.x + (selectedBtn.width / 2f) - (30 / 2f),
                selectedBtn.y + selectedBtn.height + 10,
                30,
                27
        );

        batch.end();

        shapeRenderer.setProjectionMatrix(camera.combined);
        shapeRenderer.begin(ShapeRenderer.ShapeType.Line);

        shapeRenderer.rect(cardBtn1.x, cardBtn1.y, cardBtn1.width, cardBtn1.height);
        shapeRenderer.rect(cardBtn2.x, cardBtn2.y, cardBtn2.width, cardBtn2.height);
        shapeRenderer.rect(cardBtn3.x, cardBtn3.y, cardBtn3.width, cardBtn3.height);
        shapeRenderer.rect(goAloneBtn.x, goAloneBtn.y, goAloneBtn.width, goAloneBtn.height);

        shapeRenderer.end();
    }

    private void drawCard(TextureRegion frame, Rectangle rect, boolean hovered, float scale) {

        float drawX = rect.x;
        float drawY = rect.y;
        float drawW = rect.width;
        float drawH = rect.height;

        if (hovered) {
            drawW = rect.width * scale;
            drawH = rect.height * scale;
            drawX = rect.x - (drawW - rect.width) / 2f;
            drawY = rect.y - (drawH - rect.height) / 2f;
            batch.setColor(1f, 1f, 1f, 1f);
        } else {
            batch.setColor(0.4f, 0.4f, 0.4f, 1f);
        }

        batch.draw(frame, drawX, drawY, drawW, drawH);
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
        selectorSheet.dispose();
        dragonSheet.dispose();
        phoenixSheet.dispose();
        snakeSheet.dispose();
        shapeRenderer.dispose();
    }

    private Animation<TextureRegion> loadAnimation(Texture textureSheet, int framesCount, int rows, float velocity, Animation.PlayMode playMode) {
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

        if (cardBtn1.contains(mouse.x, mouse.y)) {
            selectedBtn = cardBtn1;
        } else if (cardBtn2.contains(mouse.x, mouse.y)) {
            selectedBtn = cardBtn2;
        } else if (cardBtn3.contains(mouse.x, mouse.y)) {
            selectedBtn = cardBtn3;
        }
    }
}
