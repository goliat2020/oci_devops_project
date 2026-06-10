package com.springboot.MyTodoList.model.dto;

public class AuthResponse {
    private boolean success;
    private String message;
    private UserInfo user;

    public AuthResponse() {}

    public AuthResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public AuthResponse(boolean success, String message, UserInfo user) {
        this.success = success;
        this.message = message;
        this.user = user;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }

    public static class UserInfo {
        private Integer idUsuario;
        private String nombre;
        private String email;
        private String rol;

        public UserInfo() {}

        public UserInfo(Integer idUsuario, String nombre, String email, String rol) {
            this.idUsuario = idUsuario;
            this.nombre = nombre;
            this.email = email;
            this.rol = rol;
        }

        public Integer getIdUsuario() { return idUsuario; }
        public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getRol() { return rol; }
        public void setRol(String rol) { this.rol = rol; }
    }
}
