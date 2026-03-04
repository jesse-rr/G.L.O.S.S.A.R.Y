package io.github.glossary.entity;

public class PlayerData {
    private int heartCount;
    private Covenant covenant;
    private int gemstoneCount;
    private int specialCurrencyCount;
    private int currentFloor;
    private int fightCount;

    public PlayerData() {
        this.heartCount = 3;
        this.gemstoneCount = 0;
        this.specialCurrencyCount = 0;
        this.currentFloor = 1;
        this.fightCount = 0;
    }

    public int getHeartCount() {
        return heartCount;
    }

    public void setHeartCount(int heartCount) {
        this.heartCount = heartCount;
    }

    public Covenant getCovenant() {
        return covenant;
    }

    public void setCovenant(Covenant covenant) {
        this.covenant = covenant;
    }

    public int getGemstoneCount() {
        return gemstoneCount;
    }

    public void setGemstoneCount(int gemstoneCount) {
        this.gemstoneCount = gemstoneCount;
    }

    public int getSpecialCurrencyCount() {
        return specialCurrencyCount;
    }

    public void setSpecialCurrencyCount(int specialCurrencyCount) {
        this.specialCurrencyCount = specialCurrencyCount;
    }

    public int getCurrentFloor() {
        return currentFloor;
    }

    public void newFloor() {
        this.currentFloor += currentFloor;
    }

    public void setCurrentFloor(int currentFloor) {
        this.currentFloor = currentFloor;
    }

    public int getFightCount() {
        return fightCount;
    }

    public void setFightCount(int fightCount) {
        this.fightCount = fightCount;
    }
}
