package com.springboot.MyTodoList.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "EQUIPO")
public class Equipo {

    @Id
    @Column(name = "ID_EQUIPO")
    private Integer idEquipo;

    @Column(name = "NOMBRE", nullable = false, length = 150)
    private String nombre;

    @Column(name = "FECHA_CREACION")
    private LocalDate fechaCreacion;

    public Equipo() {}

    public Integer getIdEquipo() { return idEquipo; }
    public void setIdEquipo(Integer idEquipo) { this.idEquipo = idEquipo; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public LocalDate getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDate fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
