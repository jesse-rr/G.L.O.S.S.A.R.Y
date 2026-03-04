package io.github.glossary.ui;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.*;
import com.badlogic.gdx.graphics.g2d.*;
import com.badlogic.gdx.graphics.g2d.Animation.PlayMode;
import com.badlogic.gdx.math.Vector3;
import com.badlogic.gdx.utils.viewport.FitViewport;
import com.badlogic.gdx.utils.viewport.Viewport;
import io.github.glossary.entity.Covenant;
import io.github.glossary.entity.PlayerData;

import static io.github.glossary.util.GameUtils.*;

public class DungeonScreen implements Screen {

    private Texture backgroundTexture;
    private Texture overlayTexture;
    private Texture characterSheet;
    private Texture gemstoneTexture;
    private Texture heartTexture;
    private Texture glossaryTexture;

    private Texture echoTexture;
    private Texture fireTexture;
    private Texture tributeTexture;

    private Animation<TextureRegion> characterAnimation;

    private float stateTime;

    private SpriteBatch batch;
    private Viewport viewport;
    private Camera camera;
    private BitmapFont font;
    private Vector3 mouse;

    private PlayerData playerData;

    // External UI
    private MapUI mapUI;

    public DungeonScreen(PlayerData playerData) {
        this.playerData = playerData;
    }

    @Override
    public void show() {

        batch = new SpriteBatch();

        backgroundTexture = new Texture("exports/BG-Dungeon.png");
        overlayTexture = new Texture("exports/Battle-Overlay.png");
        characterSheet = new Texture("exports/Character-Sheet.png");

        gemstoneTexture = new Texture("exports/Gemstone32.png");
        heartTexture = new Texture("exports/Heart32.png");
        glossaryTexture = new Texture("exports/Glossary.png");

        echoTexture = new Texture("exports/Echo32.png");
        fireTexture = new Texture("exports/Fire32.png");
        tributeTexture = new Texture("exports/Tribute32.png");

        characterAnimation = loadAnimation(characterSheet, 6, 1, 0.08f, PlayMode.LOOP);

        stateTime = 0f;

        camera = new OrthographicCamera();
        viewport = new FitViewport(1280, 720, camera);
        viewport.apply(true);

        font = loadFont("aseprite.ttf", 16);
        font.setColor(Color.WHITE);

        camera.position.set(640, 360, 0);
        camera.update();

        mouse = new Vector3();

        // ✅ Initialize MapUI
//        mapUI = new MapUI();
    }

    @Override
    public void render(float delta) {

        stateTime += delta;

        float uiY = 720 - 32 - 4;
        float heartStartX = 16;
        float spacing = 8;
        float baseline = uiY + 32 - 10;

        String timeText = formatDate(stateTime) + " - Floor " + playerData.getCurrentFloor();
        String heartCountText = String.valueOf(playerData.getHeartCount());
        String gemstoneCountText = String.valueOf(playerData.getGemstoneCount());
        String specialCurrencyCountText = String.valueOf(playerData.getSpecialCurrencyCount());

        GlyphLayout timer = new GlyphLayout(font, timeText);
        GlyphLayout hearts = new GlyphLayout(font, heartCountText + "/3");
        GlyphLayout gemstone = new GlyphLayout(font, gemstoneCountText);
        GlyphLayout specialCurrency = new GlyphLayout(font, specialCurrencyCountText);

        TextureRegion characterFrame = characterAnimation.getKeyFrame(stateTime);

        Gdx.gl.glClearColor(0, 0, 0, 1);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);

        viewport.apply();
        camera.update();

        batch.setProjectionMatrix(camera.combined);
        batch.begin();

        // Background
        batch.draw(backgroundTexture, 0, 0, 1280, 720);
        batch.draw(overlayTexture, 0, 0, 1280, 720);

        // Hearts
        for (int i = 0; i < 3; i++) {
            batch.draw(heartTexture, heartStartX + i * (32 + spacing), uiY, 32, 32);
        }

        // Glossary icon
        batch.draw(glossaryTexture, 1280 - 160, 16, 128, 128);

        // Character
        batch.draw(characterFrame, 200, 150, 88f, 210f);

        // Heart text
        font.draw(batch, hearts,
            heartStartX + (3 * 32) + (2 * spacing) + 8,
            baseline);

        // Right side currencies
        float rightX = 1280 - 16;

        rightX -= gemstone.width;
        font.draw(batch, gemstone, rightX, baseline);

        rightX -= 6 + 32;
        batch.draw(gemstoneTexture, rightX, uiY, 32, 32);

        rightX -= 16;

        rightX -= specialCurrency.width;
        font.draw(batch, specialCurrency, rightX, baseline);

        rightX -= 6 + 32;

        if (playerData.getCovenant() == Covenant.SNAKE) {
            batch.draw(echoTexture, rightX, uiY, 32, 32);
        } else if (playerData.getCovenant() == Covenant.PHOENIX) {
            batch.draw(fireTexture, rightX, uiY, 32, 32);
        } else if (playerData.getCovenant() == Covenant.DRAGON) {
            batch.draw(tributeTexture, rightX, uiY, 32, 32);
        }

        // Timer centered
        font.draw(batch, timer,
            1280 / 2f - timer.width / 2f,
            baseline);

        // ✅ Delegate map rendering
//        mapUI.render(batch, stateTime, camera);

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
        font.dispose();

        backgroundTexture.dispose();
        overlayTexture.dispose();
        characterSheet.dispose();
        gemstoneTexture.dispose();
        heartTexture.dispose();
        glossaryTexture.dispose();
        echoTexture.dispose();
        fireTexture.dispose();
        tributeTexture.dispose();

        mapUI.dispose();
    }
}
