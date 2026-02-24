package io.github.glossary.ui;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.*;
import com.badlogic.gdx.graphics.g2d.*;
import com.badlogic.gdx.graphics.g2d.Animation.PlayMode;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.math.Vector3;
import com.badlogic.gdx.utils.viewport.FitViewport;
import com.badlogic.gdx.utils.viewport.Viewport;
import io.github.glossary.entity.Covenant;
import io.github.glossary.entity.NodeType;
import io.github.glossary.entity.PlayerData;
import io.github.glossary.util.MapNode;


import static io.github.glossary.util.GameUtils.*;

public class DungeonScreen implements Screen {

    private Texture backgroundTexture;
    private Texture overlayTexture;
    private Texture characterSheet;
    private Texture gemstoneTexture;
    private Texture heartTexture;
    private Texture glossaryTexture;
    private Texture mapTexture;

    private Texture eyeOfRaTexture;
    private Texture merchantTexture;
    private Texture normalCombatTexture;
    private Texture bossCombatTexture;

    private Texture runesTexture;

    private Texture echoTexture;
    private Texture fireTexture;
    private Texture tributeTexture;

    private Animation<TextureRegion> characterAnimation;

    private Animation<TextureRegion> mapAnimation;
    private Animation<TextureRegion> eyeAnimation;
    private Animation<TextureRegion> merchantAnimation;
    private Animation<TextureRegion> normalCombatAnimation;
    private Animation<TextureRegion> bossCombatAnimation;
    private Animation<TextureRegion> runesAnimation;

    private float stateTime;

    private SpriteBatch batch;
    private Viewport viewport;
    private Camera camera;
    private BitmapFont font;
    private Vector3 mouse;

    private MapNode[] nodes;

    private PlayerData playerData;

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

        mapTexture = new Texture("exports/Map-v1-Sheet.png");

        eyeOfRaTexture = new Texture("exports/Eye-Of-Ra-Sheet.png");
        merchantTexture = new Texture("exports/Merchant-Sheet.png");
        normalCombatTexture = new Texture("exports/Normal-Combat-Sheet.png");
        bossCombatTexture = new Texture("exports/Boss-Crown-Sheet.png");

        runesTexture = new Texture("exports/Runes-Sheet.png");

        echoTexture = new Texture("exports/Echo32.png");
        fireTexture = new Texture("exports/Fire32.png");
        tributeTexture = new Texture("exports/Tribute32.png");

        characterAnimation = loadAnimation(characterSheet, 6, 1, 0.08f, PlayMode.LOOP);
        mapAnimation = loadAnimation(mapTexture, 4, 1, 0.08f, PlayMode.NORMAL);
        eyeAnimation = loadAnimation(eyeOfRaTexture, 6, 1, 0.05f, PlayMode.NORMAL);
        merchantAnimation = loadAnimation(merchantTexture, 6, 1, 0.05f, PlayMode.NORMAL);
        normalCombatAnimation = loadAnimation(normalCombatTexture, 6, 1, 0.05f, PlayMode.NORMAL);
        bossCombatAnimation = loadAnimation(bossCombatTexture, 6, 1, 0.05f, PlayMode.NORMAL);

        runesAnimation = loadAnimation(runesTexture, 6, 1, 0.05f, PlayMode.NORMAL);

        stateTime = 0f;

        camera = new OrthographicCamera();
        viewport = new FitViewport(1280, 720, camera);
        viewport.apply(true);
        font = loadFont("aseprite.ttf", 16);
        font.setColor(Color.WHITE);

        drawNodes();

        camera.position.set(640, 360, 0);
        camera.update();
        mouse = new Vector3();
    }

    @Override
    public void render(float delta) {

        stateTime += delta;

        float uiY = 720 - 32 - 4;
        float heartStartX = 16;
        float spacing = 8;
        float baseline = uiY + 32 - 10;

        String timeText = formatDate(stateTime) + " - Floor "+playerData.getCurrentFloor();
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

        batch.draw(backgroundTexture, 0, 0, 1280, 720);
        batch.draw(overlayTexture, 0, 0, 1280, 720);

        for (int i = 0; i < 3; i++) {
            batch.draw(heartTexture, heartStartX + i * (32 + spacing), uiY, 32, 32);
        }

        batch.draw(glossaryTexture, 1280 - 160, 16, 128, 128);

        batch.draw(characterFrame, 200, 150, 88f, 210f);

        // ================= LEFT SIDE =================
        font.draw(batch, hearts,
            heartStartX + (3 * 32) + (2 * spacing) + 8,
            baseline);

        // ================= RIGHT SIDE =================
        float rightX = 1280 - 16;

        // Gemstone (rightmost)
        rightX -= gemstone.width;
        font.draw(batch, gemstone, rightX, baseline);

        rightX -= 6 + 32;
        batch.draw(gemstoneTexture, rightX, uiY, 32, 32);

        rightX -= 16;

        // Special currency (left of gemstone)
        rightX -= specialCurrency.width;
        font.draw(batch, specialCurrency, rightX, baseline);

        rightX -= 6 + 32;

        if (playerData.getCovenant() == Covenant.SNAKE) {
            batch.draw(echoTexture, rightX, uiY, 32, 32);
        }
        else if (playerData.getCovenant() == Covenant.PHOENIX) {
            batch.draw(fireTexture, rightX, uiY, 32, 32);
        }
        else if (playerData.getCovenant() == Covenant.DRAGON) {
            batch.draw(tributeTexture, rightX, uiY, 32, 32);
        }

        // ================= CENTER TIMER =================
        font.draw(batch, timer,
            1280 / 2f - timer.width / 2f,
            baseline);

        batch.draw(mapAnimation.getKeyFrames()[0], (1280 - 720f) / 2f, 0, 720, 720);
        renderNodes(delta);

        batch.end();
    }

    private void renderNodes(float delta) {

        mouse.set(Gdx.input.getX(), Gdx.input.getY(), 0);
        camera.unproject(mouse);

        for (MapNode node : nodes) {

            boolean isHovering = node.getRectangle().contains(mouse.x, mouse.y);
            node.update(delta, isHovering);

            Animation<TextureRegion> animation = null;

            switch (node.getType()) {
                case NORMAL_COMBAT:
                    animation = normalCombatAnimation;
                    break;
                case MERCHANT:
                    animation = merchantAnimation;
                    break;
                case BOSS:
                    animation = bossCombatAnimation;
                    break;
                case EVENT:
                    animation = eyeAnimation;
                    break;
                case RUNE:
                    animation = runesAnimation;
                    break;
            }

            TextureRegion frame;

            if (node.getAnimTime() == 0f) {
                frame = animation.getKeyFrames()[0];
            } else {
                frame = animation.getKeyFrame(node.getAnimTime(), false);
            }

            float nodeCenterX = node.getRectangle().x + node.getRectangle().width / 2f;
            float nodeCenterY = node.getRectangle().y + node.getRectangle().height / 2f;

            float scale = 1f;
            if (node.getType() == NodeType.BOSS) {
                scale = 2f; // double size
            }

            float width = frame.getRegionWidth() * scale;
            float height = frame.getRegionHeight() * scale;

            batch.draw(
                frame,
                nodeCenterX - width / 2f,
                nodeCenterY - height / 2f,
                width,
                height
            );
        }
    }

    private void drawNodes() {

        nodes = new MapNode[25];

        final float centerX = 640f;   // center of 1280x720
        final float centerY = 360f;

        final float outerRadius = 300f;
        final float middleRadius = 180f;

        final float nodeSize = 80f;   // LOGICAL SIZE (hitbox)

        int index = 0;

        // ================= OUTER RING (16)
        for (int i = 0; i < 16; i++) {

            float angleDeg = i * 22.5f;
            float angleRad = MathUtils.degreesToRadians * angleDeg;

            float x = centerX + MathUtils.cos(angleRad) * outerRadius;
            float y = centerY + MathUtils.sin(angleRad) * outerRadius;

            NodeType type;

            if (i == 0 || i == 4 || i == 8 || i == 12) {
                type = NodeType.RUNE;
            } else {
                type = getRandomNodeType();
            }

            nodes[index++] = new MapNode(
                x - nodeSize / 2f,
                y - nodeSize / 2f,
                nodeSize,
                nodeSize,
                type
            );
        }

        // ================= MIDDLE RING (8)
        for (int i = 0; i < 8; i++) {

            float angleDeg = i * 45f;
            float angleRad = MathUtils.degreesToRadians * angleDeg;

            float x = centerX + MathUtils.cos(angleRad) * middleRadius;
            float y = centerY + MathUtils.sin(angleRad) * middleRadius;

            nodes[index++] = new MapNode(
                x - nodeSize / 2f,
                y - nodeSize / 2f,
                nodeSize,
                nodeSize,
                getRandomNodeType()
            );
        }

        // ================= CENTER (BOSS)
        nodes[index] = new MapNode(
            centerX - nodeSize / 2f,
            centerY - nodeSize / 2f,
            nodeSize,
            nodeSize,
            NodeType.BOSS
        );
    }

    private NodeType getRandomNodeType() {
        final float eyeChance = 0.2f;
        final float merchantChance = 0.1f;

        float roll = MathUtils.random();
        if (roll < eyeChance) {
            return NodeType.EVENT;
        }
        else if (roll < eyeChance + merchantChance) {
            return NodeType.MERCHANT;
        }
        else {
            return NodeType.NORMAL_COMBAT;
        }
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
        backgroundTexture.dispose();
    }
}
