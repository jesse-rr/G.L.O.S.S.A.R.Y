package io.github.glossary.util;

import com.badlogic.gdx.maps.MapLayer;
import com.badlogic.gdx.maps.MapObject;
import com.badlogic.gdx.maps.objects.RectangleMapObject;
import com.badlogic.gdx.maps.tiled.*;
import com.badlogic.gdx.maps.tiled.renderers.OrthogonalTiledMapRenderer;
import com.badlogic.gdx.math.Rectangle;
import com.badlogic.gdx.utils.Array;

public class MapLoader {

    private TiledMap currentMap;
    private OrthogonalTiledMapRenderer renderer;

    private Array<Rectangle> collisionRects = new Array<>();

    public void loadMap(String name) {
        if (currentMap != null) currentMap.dispose();

        currentMap = new TmxMapLoader().load("maps/" + name + ".tmx");
        renderer = new OrthogonalTiledMapRenderer(currentMap);

        loadCollisions();
    }

    private void loadCollisions() {
        collisionRects.clear();

        MapLayer layer = currentMap.getLayers().get("collisions");

        if (layer == null) return;

        for (MapObject obj : layer.getObjects()) {
            if (obj instanceof RectangleMapObject) {
                Rectangle rect = ((RectangleMapObject) obj).getRectangle();
                collisionRects.add(rect);
            }
        }
    }

    public Array<Rectangle> getCollisionRects() {
        return collisionRects;
    }

    public OrthogonalTiledMapRenderer getRenderer() {
        return renderer;
    }

    public TiledMap getCurrentMap() {
        return currentMap;
    }
}
