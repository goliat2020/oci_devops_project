package com.springboot.MyTodoList.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "USUARIO")
public class Usuario {

    @Id
    @Column(name = "ID_USUARIO")
    private Integer idUsuario;

    @Column(name = "NOMBRE", nullable = false, length = 150)
    private String nombre;

    @Column(name = "EMAIL", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "TELEGRAM_CHAT_ID", length = 50)
    private String telegramChatId;

    @Column(name = "ACTIVO")
    private Integer activo;

    @Column(name = "FECHA_INGRESO")
    private LocalDate fechaIngreso;

    @Column(name = "MODALIDAD_TRABAJO", length = 50)
    private String modalidadTrabajo;

    @Column(name = "PASSWORD_HASH", length = 255)
    private String passwordHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_EQUIPO")
    private Equipo equipo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ID_ROL", nullable = false)
    private Rol rol;

    public Usuario() {}

    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelegramChatId() { return telegramChatId; }
    public void setTelegramChatId(String telegramChatId) { this.telegramChatId = telegramChatId; }

    public Integer getActivo() { return activo; }
    public void setActivo(Integer activo) { this.activo = activo; }

    public LocalDate getFechaIngreso() { return fechaIngreso; }
    public void setFechaIngreso(LocalDate fechaIngreso) { this.fechaIngreso = fechaIngreso; }

    public String getModalidadTrabajo() { return modalidadTrabajo; }
    public void setModalidadTrabajo(String modalidadTrabajo) { this.modalidadTrabajo = modalidadTrabajo; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Equipo getEquipo() { return equipo; }
    public void setEquipo(Equipo equipo) { this.equipo = equipo; }

    public Rol getRol() { return rol; }
    public void setRol(Rol rol) { this.rol = rol; }
}
