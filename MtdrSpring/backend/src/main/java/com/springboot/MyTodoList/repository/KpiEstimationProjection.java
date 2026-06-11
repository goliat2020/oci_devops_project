package com.springboot.MyTodoList.repository;

public interface KpiEstimationProjection {
    Integer getSprintId();
    String getSprintNombre();
    Double getHorasEstimadas();
    Double getHorasReales();
}
