package io.github.glossary.ui;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.Camera;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Animation;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.g2d.TextureRegion;
import com.badlogic.gdx.math.Rectangle;
import com.badlogic.gdx.math.Vector3;
import com.badlogic.gdx.utils.viewport.FitViewport;
import com.badlogic.gdx.utils.viewport.Viewport;
import io.github.glossary.entity.Covenant;
import io.github.glossary.entity.PlayerData;
import io.github.glossary.util.ScreenManager;

import static io.github.glossary.util.GameUtils.loadAnimation;

public class CovenantScreen implements Screen {

    private Texture backgroundSheet;
    private Texture selectorSheet;
    private Texture dragonSheet;
    private Texture phoenixSheet;
    private Texture snakeSheet;
    private Texture cloudSheet;

    private Animation<TextureRegion> backgroundAnimation;
    private Animation<TextureRegion> selectorAnimation;
    private Animation<TextureRegion> dragonAnimation;
    private Animation<TextureRegion> phoenixAnimation;
    private Animation<TextureRegion> snakeAnimation;
    private Animation<TextureRegion> cloudAnimation;

    private float stateTime;
    private float cloudStateTime = 0f;
    private boolean cloudPlaying = false;

    private SpriteBatch batch;
    private Viewport viewport;
    private Camera camera;

    private Rectangle cardBtn1;
    private Rectangle cardBtn2;
    private Rectangle cardBtn3;

    private Vector3 mouse;
    private Rectangle selectedBtn;

    private PlayerData playerData;

    @Override
    public void show() {

        playerData = new PlayerData();

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

        backgroundSheet = new Texture("exports/BG - Covenant-Sheet.png");
        selectorSheet = new Texture("exports/Covenant-Selector-Sheet.png");
        dragonSheet = new Texture("exports/Dragon-Sheet.png");
        phoenixSheet = new Texture("exports/Phoenix-Sheet.png");
        snakeSheet = new Texture("exports/Snake-Sheet.png");
        cloudSheet = new Texture("exports/Cloud-Animation-Sheet.png");

        backgroundAnimation = loadAnimation(backgroundSheet, 8, 1, 0.08f, Animation.PlayMode.LOOP);
        selectorAnimation = loadAnimation(selectorSheet, 7, 1, 0.08f, Animation.PlayMode.LOOP);
        dragonAnimation = loadAnimation(dragonSheet, 5, 1, 0.08f, Animation.PlayMode.LOOP);
        phoenixAnimation = loadAnimation(phoenixSheet, 5, 1, 0.08f, Animation.PlayMode.LOOP);
        snakeAnimation = loadAnimation(snakeSheet, 5, 1, 0.08f, Animation.PlayMode.LOOP);
        cloudAnimation = loadAnimation(cloudSheet, 24, 1, 0.08f, Animation.PlayMode.NORMAL);

        stateTime = 0f;

        camera = new OrthographicCamera();
        viewport = new FitViewport(1280, 720, camera);
        viewport.apply(true);

        camera.position.set(640, 360, 0);
        camera.update();

        cardBtn1 = new Rectangle(card1X, cardY, cardWidth, cardHeight);
        cardBtn2 = new Rectangle(card2X, cardY, cardWidth, cardHeight);
        cardBtn3 = new Rectangle(card3X, cardY, cardWidth, cardHeight);

        selectedBtn = cardBtn2;
        mouse = new Vector3();
    }

    @Override
    public void render(float delta) {

        stateTime += delta;

        if (cloudPlaying) {
            cloudStateTime += delta;
        }

        TextureRegion backgroundFrame = backgroundAnimation.getKeyFrame(stateTime);
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
        TextureRegion cloudFrame = cloudAnimation.getKeyFrame(cloudStateTime);

        int cloudFrameIndex = cloudAnimation.getKeyFrameIndex(cloudStateTime);

        Gdx.gl.glClearColor(0, 0, 0, 1);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);

        viewport.apply();
        camera.update();

        if (!cloudPlaying) {
            handleInput();
        }

        batch.setProjectionMatrix(camera.combined);
        batch.begin();

        if (!cloudPlaying || cloudFrameIndex < 18) {

            batch.setColor(0.5f, 0.5f, 0.5f, 1f);
            batch.draw(backgroundFrame, 0, 0, 1280 , 720);
            batch.setColor(1f, 1f, 1f, 1f);

            drawCard(dragonFrame, cardBtn1, selectedBtn == cardBtn1, 1.02f);
            drawCard(phoenixFrame, cardBtn2, selectedBtn == cardBtn2, 1.02f);
            drawCard(snakeFrame, cardBtn3, selectedBtn == cardBtn3, 1.02f);

            batch.draw(
                selectorFrame,
                selectedBtn.x + (selectedBtn.width / 2f) - (30 / 2f),
                selectedBtn.y + selectedBtn.height + 10,
                30,
                27
            );
        }

        if (cloudPlaying) {
            batch.draw(cloudFrame, 0, 0, 1280, 720);
        }

        batch.end();

        if (cloudPlaying && cloudAnimation.isAnimationFinished(cloudStateTime)) {
            ScreenManager.showDungeon(playerData);
        }
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
        batch.setColor(1f, 1f, 1f, 1f);
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
        dragonSheet.dispose();
        phoenixSheet.dispose();
        snakeSheet.dispose();
        cloudSheet.dispose();
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

        if (Gdx.input.justTouched()) {
            if (selectedBtn == cardBtn1 && cardBtn1.contains(mouse.x, mouse.y)) {
                cloudPlaying = true;
                cloudStateTime = 0f;
                playerData.setCovenant(Covenant.DRAGON);
            } else if (selectedBtn == cardBtn2 && cardBtn2.contains(mouse.x, mouse.y)) {
                cloudPlaying = true;
                cloudStateTime = 0f;
                playerData.setCovenant(Covenant.PHOENIX);
            } else if (selectedBtn == cardBtn3 && cardBtn3.contains(mouse.x, mouse.y)) {
                cloudPlaying = true;
                cloudStateTime = 0f;
                playerData.setCovenant(Covenant.SNAKE);
            }
        }
    }
}
