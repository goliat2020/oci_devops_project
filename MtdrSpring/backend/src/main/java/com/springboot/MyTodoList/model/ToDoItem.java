package com.springboot.MyTodoList.model;


import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/*
    representation of the TAREA table
 */
@Entity
@Table(name = "TAREA")
public class ToDoItem {
    @Id
    @Column(name = "ID_TAREA")
    private Integer ID;

    @Column(name = "TITULO")
    private String titulo;

    @Column(name = "DESCRIPCION")
    private String descripcion;

    @Column(name = "FECHA_CREACION")
    private LocalDate creation_ts;

    @Column(name = "FECHA_FIN_ESTIMADA")
    private LocalDate fechaFinEstimada;

    @Column(name = "FECHA_FIN_REAL")
    private LocalDate fechaFinReal;

    @Column(name = "ESTIMACION_HORAS")
    private Double estimacionHoras;

    @Column(name = "HORAS_REALES")
    private Double horasReales;

    @Column(name = "PRIORIDAD")
    private String prioridad;

    @Column(name = "ID_USUARIO")
    private Integer idUsuario;

    @Column(name = "ID_ESTADO")
    private Integer idEstado;

    @Column(name = "ID_PROYECTO")
    private Integer idProyecto;

    @Column(name = "ID_SPRINT")
    private Integer idSprint;

    @Transient
    private Boolean done;

    @Transient
    private boolean doneProvided;

    public ToDoItem() {

    }

    public ToDoItem(Integer ID, String titulo, String descripcion, LocalDate creation_ts, Boolean done) {
        this.ID = ID;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.creation_ts = creation_ts;
        this.done = done;
    }

    public Integer getID() {
        return ID;
    }

    public void setID(Integer ID) {
        this.ID = ID;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescription() {
        if (descripcion != null && !descripcion.isBlank()) {
            return descripcion;
        }
        return titulo;
    }

    public void setDescription(String description) {
        this.descripcion = description;
        if ((this.titulo == null || this.titulo.isBlank()) && description != null) {
            this.titulo = description;
        }
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public LocalDate getCreation_ts() {
        return creation_ts;
    }

    public void setCreation_ts(LocalDate creation_ts) {
        this.creation_ts = creation_ts;
    }

    @JsonIgnore
    public void setCreation_ts(OffsetDateTime creation_ts) {
        if (creation_ts != null) {
            this.creation_ts = creation_ts.toLocalDate();
        }
    }

    public LocalDate getCreatedAt() {
        return creation_ts;
    }

    public LocalDate getFechaFinEstimada() {
        return fechaFinEstimada;
    }

    public void setFechaFinEstimada(LocalDate fechaFinEstimada) {
        this.fechaFinEstimada = fechaFinEstimada;
    }

    public LocalDate getFechaFinReal() {
        return fechaFinReal;
    }

    public void setFechaFinReal(LocalDate fechaFinReal) {
        this.fechaFinReal = fechaFinReal;
    }

    public Double getEstimacionHoras() {
        return estimacionHoras;
    }

    public void setEstimacionHoras(Double estimacionHoras) {
        this.estimacionHoras = estimacionHoras;
    }

    public Double getHorasReales() {
        return horasReales;
    }

    public void setHorasReales(Double horasReales) {
        this.horasReales = horasReales;
    }

    public String getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(String prioridad) {
        this.prioridad = prioridad;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Integer getIdEstado() {
        return idEstado;
    }

    public void setIdEstado(Integer idEstado) {
        this.idEstado = idEstado;
    }

    public Integer getIdProyecto() {
        return idProyecto;
    }

    public void setIdProyecto(Integer idProyecto) {
        this.idProyecto = idProyecto;
    }

    public Integer getIdSprint() {
        return idSprint;
    }

    public void setIdSprint(Integer idSprint) {
        this.idSprint = idSprint;
    }

    public boolean isDone() {
        if (done != null) {
            return done;
        }
        return idEstado != null && idEstado == 3;
    }

    public Boolean getDone() {
        return isDone();
    }

    public boolean isDoneProvided() {
        return doneProvided;
    }

    public void setDone(boolean done) {
        this.done = done;
        this.doneProvided = true;
        this.idEstado = done ? 3 : 1;
        if (done && this.fechaFinReal == null) {
            this.fechaFinReal = LocalDate.now();
        }
        if (!done) {
            this.fechaFinReal = null;
        }
    }

    public void resetDoneProvided() {
        this.doneProvided = false;
    }

    @Override
    public String toString() {
        return "ToDoItem{" +
                "ID=" + ID +
                ", titulo='" + titulo + '\'' +
                ", descripcion='" + descripcion + '\'' +
                ", creation_ts=" + creation_ts +
                ", estimacionHoras=" + estimacionHoras +
                ", horasReales=" + horasReales +
                ", idUsuario=" + idUsuario +
                ", idEstado=" + idEstado +
                ", idProyecto=" + idProyecto +
                ", idSprint=" + idSprint +
                '}';
    }
}
