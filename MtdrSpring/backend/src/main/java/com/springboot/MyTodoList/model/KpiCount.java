package com.springboot.MyTodoList.model;

public class KpiCount {
    private String name;
    private Integer totalTareas;

    public KpiCount() {}

    public KpiCount(String name, Integer totalTareas) {
        this.name = name;
        this.totalTareas = totalTareas;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getTotalTareas() { return totalTareas; }
    public void setTotalTareas(Integer totalTareas) { this.totalTareas = totalTareas; }
}
