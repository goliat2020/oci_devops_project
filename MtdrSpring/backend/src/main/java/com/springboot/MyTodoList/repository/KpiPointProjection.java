package com.springboot.MyTodoList.repository;

public interface KpiPointProjection {
    Integer getSprintId();
    String getSprintNombre();
    Integer getUserId();
    String getUserNombre();
    Double getTotalValue();
}
