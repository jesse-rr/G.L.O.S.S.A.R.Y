package io.github.glossary.util;
import com.badlogic.gdx.graphics.g2d.Animation;
import com.badlogic.gdx.graphics.g2d.TextureRegion;
import com.badlogic.gdx.math.Rectangle;
import io.github.glossary.entity.NodeType;

public class MapNode {
    private final Rectangle rectangle;
    private NodeType type;
    private boolean visited;
    private float animTime = 0f;
    private Animation<TextureRegion> runeAnimation;

    public MapNode(float x, float y, float w, float h, NodeType type) {
        this.rectangle = new Rectangle(x, y, w, h);
        this.type = type;
    }

    public MapNode(float x, float y, float w, float h) {
        this.rectangle = new Rectangle(x, y, w, h);
    }

    public void update(float delta, boolean isHovering) {
        if (isHovering) {
            animTime += delta;
            if (animTime > 0.5f) animTime = 0.5f;
        } else {
            animTime -= delta;
            if (animTime < 0f) animTime = 0f;
        }
    }

    public Rectangle getRectangle() {
        return rectangle;
    }

    public NodeType getType() {
        return type;
    }

    public float getAnimTime() {
        return animTime;
    }

    public void setRuneAnimation(Animation<TextureRegion> anim) {
        this.runeAnimation = anim;
    }

    public Animation<TextureRegion> getRuneAnimation() {
        return runeAnimation;
    }

    public void setType(NodeType type) {
        this.type = type;
    }
}
