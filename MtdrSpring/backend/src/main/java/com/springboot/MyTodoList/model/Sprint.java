package com.springboot.MyTodoList.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "SPRINT")
public class Sprint {

    @Id
    @Column(name = "ID_SPRINT")
    private Integer idSprint;

    @Column(name = "NOMBRE", nullable = false, length = 100)
    private String nombre;

    @Column(name = "OBJETIVO", length = 500)
    private String objetivo;

    @Column(name = "FECHA_INICIO")
    private LocalDate fechaInicio;

    @Column(name = "FECHA_FIN")
    private LocalDate fechaFin;

    @Column(name = "ID_PROYECTO", nullable = false)
    private Integer idProyecto;

    public Sprint() {}

    public Integer getIdSprint() { return idSprint; }
    public void setIdSprint(Integer idSprint) { this.idSprint = idSprint; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getObjetivo() { return objetivo; }
    public void setObjetivo(String objetivo) { this.objetivo = objetivo; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public Integer getIdProyecto() { return idProyecto; }
    public void setIdProyecto(Integer idProyecto) { this.idProyecto = idProyecto; }
}
