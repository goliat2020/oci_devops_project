package com.springboot.MyTodoList.model;

public class KpiPoint {
    private Integer sprintId;
    private String sprintNombre;
    private Integer userId;
    private String userNombre;
    private Double value;

    public KpiPoint() {
    }

    public KpiPoint(Integer sprintId, String sprintNombre, Integer userId, String userNombre, Double value) {
        this.sprintId = sprintId;
        this.sprintNombre = sprintNombre;
        this.userId = userId;
        this.userNombre = userNombre;
        this.value = value;
    }

    public Integer getSprintId() {
        return sprintId;
    }

    public void setSprintId(Integer sprintId) {
        this.sprintId = sprintId;
    }

    public String getSprintNombre() {
        return sprintNombre;
    }

    public void setSprintNombre(String sprintNombre) {
        this.sprintNombre = sprintNombre;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUserNombre() {
        return userNombre;
    }

    public void setUserNombre(String userNombre) {
        this.userNombre = userNombre;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }
}
