package io.github.glossary.util;
import com.badlogic.gdx.math.Rectangle;
import io.github.glossary.entity.NodeType;

public class MapNode {
    private Rectangle rectangle;
    private NodeType type;
    private boolean visited;
    private float animTime = 0f;
    private boolean hovered = false;

    public MapNode(float x, float y, float w, float h, NodeType type) {
        this.rectangle = new Rectangle(x, y, w, h);
        this.type = type;
    }

    public void update(float delta, boolean isHovering) {
        hovered = isHovering;
        if (hovered) {
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
}
