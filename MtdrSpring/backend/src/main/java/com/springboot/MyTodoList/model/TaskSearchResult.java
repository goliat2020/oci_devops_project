package com.springboot.MyTodoList.model;

/**
 * Holds a single result from a vector similarity search on TAREA.
 * Not a JPA entity — populated directly from native SQL via JdbcTemplate.
 */
public class TaskSearchResult {

    private Integer idTarea;
    private String titulo;
    private String descripcion;
    private String prioridad;
    private Double estimacionHoras;
    private String estado;
    /** Cosine distance (0 = identical, 1 = completely different). Lower is better. */
    private Double similitud;

    public TaskSearchResult() {}

    public Integer getIdTarea() { return idTarea; }
    public void setIdTarea(Integer idTarea) { this.idTarea = idTarea; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getPrioridad() { return prioridad; }
    public void setPrioridad(String prioridad) { this.prioridad = prioridad; }

    public Double getEstimacionHoras() { return estimacionHoras; }
    public void setEstimacionHoras(Double estimacionHoras) { this.estimacionHoras = estimacionHoras; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Double getSimilitud() { return similitud; }
    public void setSimilitud(Double similitud) { this.similitud = similitud; }

    /** Human-readable summary used when building Gemini prompt context. */
    public String toContextLine() {
        return String.format("- [%s] %s (~%.1fh) — %s",
                prioridad != null ? prioridad : "MEDIUM",
                titulo,
                estimacionHoras != null ? estimacionHoras : 0.0,
                estado != null ? estado : "Pendiente");
    }
}
