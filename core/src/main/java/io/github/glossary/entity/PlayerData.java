package io.github.glossary.entity;

public class PlayerData {
    private int heartCount;
    private Covenant covenant;
    private int gemstoneCount;
    private int specialCurrencyCount;
    private int currentFloor;

    public PlayerData() {
        this.heartCount = 3;
        this.gemstoneCount = 0;
        this.specialCurrencyCount = 0;
        this.currentFloor = 1;
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
}
