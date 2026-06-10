package com.springboot.MyTodoList.model;

/**
 * Request body for POST /ai/suggest-tasks
 */
public class TaskSuggestionRequest {

    /** Free-text question from the user, e.g. "¿qué tarea debería hacer hoy?" */
    private String pregunta;

    /** Active sprint to filter candidate tasks */
    private Integer sprintId;

    /** Optional: if provided, also adds project context to the Gemini prompt */
    private Integer projectId;

    public TaskSuggestionRequest() {}

    public String getPregunta() { return pregunta; }
    public void setPregunta(String pregunta) { this.pregunta = pregunta; }

    public Integer getSprintId() { return sprintId; }
    public void setSprintId(Integer sprintId) { this.sprintId = sprintId; }

    public Integer getProjectId() { return projectId; }
    public void setProjectId(Integer projectId) { this.projectId = projectId; }
}
