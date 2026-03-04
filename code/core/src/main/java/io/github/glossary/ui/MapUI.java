package io.github.glossary.ui;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Camera;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.*;
import com.badlogic.gdx.graphics.g2d.Animation.PlayMode;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.math.Vector3;
import io.github.glossary.entity.NodeType;
import io.github.glossary.util.MapNode;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static io.github.glossary.util.GameUtils.loadAnimation;
import static io.github.glossary.util.GameUtils.loadFont;

public class MapUI {

    private final Texture backgroundTexture;
    private final Texture mapTexture;
    private final Texture runesTexture;
    private final Texture eyeTexture;
    private final Texture merchantTexture;
    private final Texture normalCombatTexture;
    private final Texture bossCombatTexture;
    private final Texture ringUItemTexture;
    private final Texture arrowSheet;

    private final Animation<TextureRegion> mapAnimation;
    private final Animation<TextureRegion> eyeAnimation;
    private final Animation<TextureRegion> merchantAnimation;
    private final Animation<TextureRegion> normalCombatAnimation;
    private final Animation<TextureRegion> bossCombatAnimation;
    private final Animation<TextureRegion> ringUItemAnimation;
    private Animation<TextureRegion> arrowAnimation;

    private final Animation<TextureRegion>[] runeAnimations;

    private final BitmapFont font;
    private MapNode[] nodes;
    private final Vector3 mouse = new Vector3();

    public MapUI() {
        this.font = loadFont("aseprite.ttf", 14);

        backgroundTexture = new Texture("exports/Paper.png");
        mapTexture = new Texture("exports/Map-v1-Sheet.png");
        runesTexture = new Texture("exports/Runes-Sheet.png");
        eyeTexture = new Texture("exports/Eye-Of-Ra-Sheet.png");
        merchantTexture = new Texture("exports/Merchant-Sheet.png");
        normalCombatTexture = new Texture("exports/Normal-Combat-Sheet.png");
        bossCombatTexture = new Texture("exports/Boss-Crown-Sheet.png");
        ringUItemTexture = new Texture("exports/Ring-UI-Item.png");
        arrowSheet = new Texture("exports/Arrow-Sheet.png");

        mapAnimation = loadAnimation(mapTexture, 4, 1, 0.08f, PlayMode.NORMAL);
        eyeAnimation = loadAnimation(eyeTexture, 6, 1, 0.05f, PlayMode.NORMAL);
        merchantAnimation = loadAnimation(merchantTexture, 6, 1, 0.05f, PlayMode.NORMAL);
        normalCombatAnimation = loadAnimation(normalCombatTexture, 6, 1, 0.05f, PlayMode.NORMAL);
        bossCombatAnimation = loadAnimation(bossCombatTexture, 6, 1, 0.05f, PlayMode.NORMAL);
        ringUItemAnimation = loadAnimation(ringUItemTexture, 2, 1, 0.05f, PlayMode.NORMAL);
        arrowAnimation = loadAnimation(arrowSheet, 4, 1, 0.05f, PlayMode.LOOP);

        TextureRegion[] arrowFrames = arrowAnimation.getKeyFrames();
        TextureRegion[] reversedFrames = new TextureRegion[arrowFrames.length];
        for (int i = 0; i < arrowFrames.length; i++) {
            reversedFrames[i] = arrowFrames[arrowFrames.length - 1 - i];
        }
        arrowAnimation = new Animation<>(0.05f, reversedFrames);

        runeAnimations = loadRuneAnimations();
        drawNodes();
    }

    public void render(SpriteBatch batch, float stateTime, Camera camera) {
        batch.draw(backgroundTexture, 0, 0, 1280, 720);

        mouse.set(Gdx.input.getX(), Gdx.input.getY(), 0);
        camera.unproject(mouse);

        TextureRegion[] ringFrames = ringUItemAnimation.getKeyFrames();
        float ringWidth = ringFrames[0].getRegionWidth();
        float ringHeight = ringFrames[0].getRegionHeight();
        float ringStartX = 1280 - ringWidth - 60;
        float ringY = 720 - 90;
        float ringSpacing = 32;

        String[] ringLabels = {"OUTER RING", "INNER RING", "CENTRAL RING"};
        int hoveredRingIndex = 0;

        for (int i = 0; i < 3; i++) {
            float drawY = ringY;
            boolean hovering = mouse.x >= ringStartX && mouse.x <= ringStartX + ringWidth &&
                mouse.y >= drawY && mouse.y <= drawY + ringHeight;

            if (hovering) hoveredRingIndex = i + 1;

            TextureRegion frame = hovering ? ringFrames[1] : ringFrames[0];
            batch.draw(frame, ringStartX, drawY, ringWidth, ringHeight);

            font.setColor(hovering ? Color.valueOf("#c2ad88") : Color.valueOf("#d8c8a9"));
            GlyphLayout layout = new GlyphLayout(font, ringLabels[i]);
            float textX = ringStartX + ringWidth / 2f - layout.width / 2f;
            float textY = drawY + ringHeight / 2f + layout.height / 2f;
            font.draw(batch, layout, textX, textY);

            ringY -= ringSpacing;
        }

        TextureRegion[] mapFrames = mapAnimation.getKeyFrames();
        TextureRegion mapFrame = mapFrames[hoveredRingIndex];
        batch.draw(mapFrame, (1280 - 720f) / 2f, 0, 720, 720);

        int padding = 60;
        int spacing = 10;
        int currentHeight = 720 - padding;
        font.setColor(Color.BLACK);

        Animation<TextureRegion>[] icons = new Animation[]{normalCombatAnimation, eyeAnimation, merchantAnimation, bossCombatAnimation};
        String[] labels = {"COMBAT", "HIDDEN", "MERCHANT", "BOSS"};

        int iconColumnX = padding;
        int textColumnX = padding + 70;

        for (int i = 0; i < icons.length; i++) {
            TextureRegion frame = icons[i].getKeyFrame(0f);
            currentHeight -= frame.getRegionHeight();
            batch.draw(frame, iconColumnX, currentHeight);
            font.draw(batch, labels[i], textColumnX, currentHeight + frame.getRegionHeight() - 12);
            currentHeight -= spacing;
        }

        for (MapNode node : nodes) {
            boolean hovering = node.getRectangle().contains(mouse.x, mouse.y);
            node.update(Gdx.graphics.getDeltaTime(), hovering);

            Animation<TextureRegion> animation = null;
            switch (node.getType()) {
                case NORMAL_COMBAT: animation = normalCombatAnimation; break;
                case MERCHANT: animation = merchantAnimation; break;
                case BOSS: animation = bossCombatAnimation; break;
                case EVENT: animation = eyeAnimation; break;
                case RUNE: animation = node.getRuneAnimation(); break;
            }

            TextureRegion frame = animation.getKeyFrame(node.getAnimTime());
            float cx = node.getRectangle().x + node.getRectangle().width / 2f;
            float cy = node.getRectangle().y + node.getRectangle().height / 2f;
            float scale = node.getType() == NodeType.BOSS ? 2f : 1f;
            float width = frame.getRegionWidth() * scale;
            float height = frame.getRegionHeight() * scale;
            batch.draw(frame, cx - width / 2f, cy - height / 2f, width, height);
        }

        float arrowWidth = arrowAnimation.getKeyFrames()[0].getRegionWidth();
        float arrowHeight = arrowAnimation.getKeyFrames()[0].getRegionHeight();
        float arrowX = 1280 - arrowWidth - 60;
        float arrowY = 60;

        boolean hoveringArrow = mouse.x >= arrowX && mouse.x <= arrowX + arrowWidth &&
            mouse.y >= arrowY && mouse.y <= arrowY + arrowHeight;

        if (hoveringArrow) {
            TextureRegion frame = arrowAnimation.getKeyFrame(stateTime, true);
            batch.draw(frame, arrowX, arrowY, arrowWidth, arrowHeight);
        }
    }

    private void drawNodes() {
        nodes = new MapNode[25];
        float centerX = 640f;
        float centerY = 360f;
        float outerRadius = 300f;
        float middleRadius = 180f;
        float nodeSize = 80f;
        int index = 0;

        for (int i = 0; i < 16; i++) {
            float angleRad = MathUtils.degreesToRadians * (i * 22.5f);
            float x = centerX + MathUtils.cos(angleRad) * outerRadius;
            float y = centerY + MathUtils.sin(angleRad) * outerRadius;
            MapNode node = new MapNode(x - nodeSize / 2f, y - nodeSize / 2f, nodeSize, nodeSize, NodeType.NORMAL_COMBAT);
            if (i == 0 || i == 4 || i == 8 || i == 12) node.setType(NodeType.RUNE);
            else node.setType(getRandomNodeType());
            nodes[index++] = node;
        }

        for (int i = 0; i < 8; i++) {
            float angleRad = MathUtils.degreesToRadians * (i * 45f);
            float x = centerX + MathUtils.cos(angleRad) * middleRadius;
            float y = centerY + MathUtils.sin(angleRad) * middleRadius;
            nodes[index++] = new MapNode(x - nodeSize / 2f, y - nodeSize / 2f, nodeSize, nodeSize, getRandomNodeType());
        }

        nodes[index] = new MapNode(centerX - nodeSize / 2f, centerY - nodeSize / 2f, nodeSize, nodeSize, NodeType.BOSS);

        List<Integer> runeIndices = new ArrayList<>();
        for (int i = 0; i < runeAnimations.length; i++) runeIndices.add(i);
        Collections.shuffle(runeIndices);

        int runeCounter = 0;
        for (MapNode node : nodes) {
            if (node.getType() == NodeType.RUNE) {
                node.setRuneAnimation(runeAnimations[runeIndices.get(runeCounter++)]);
            }
        }
    }

    private Animation<TextureRegion>[] loadRuneAnimations() {
        int frameSize = 70;
        int framesPerRune = 6;
        int totalFrames = runesTexture.getWidth() / frameSize;
        int numRunes = totalFrames / framesPerRune;
        Animation<TextureRegion>[] animations = new Animation[numRunes];

        for (int rune = 0; rune < numRunes; rune++) {
            TextureRegion[] frames = new TextureRegion[framesPerRune];
            for (int frameIdx = 0; frameIdx < framesPerRune; frameIdx++) {
                int column = rune + frameIdx * numRunes;
                frames[frameIdx] = new TextureRegion(runesTexture, column * frameSize, 0, frameSize, frameSize);
            }
            animations[rune] = new Animation<>(0.05f, frames);
        }
        return animations;
    }

    private NodeType getRandomNodeType() {
        float roll = MathUtils.random();
        if (roll < 0.2f) return NodeType.EVENT;
        if (roll < 0.3f) return NodeType.MERCHANT;
        return NodeType.NORMAL_COMBAT;
    }

    public void dispose() {
        font.dispose();
        mapTexture.dispose();
        runesTexture.dispose();
        eyeTexture.dispose();
        merchantTexture.dispose();
        normalCombatTexture.dispose();
        bossCombatTexture.dispose();
        ringUItemTexture.dispose();
        arrowSheet.dispose();
        backgroundTexture.dispose();
    }
}
