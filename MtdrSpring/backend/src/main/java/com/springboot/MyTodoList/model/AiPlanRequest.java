package com.springboot.MyTodoList.model;

public class AiPlanRequest {
    private String prompt;
    private Integer taskCount;
    private Integer defaultUserId;
    private Integer defaultSprintId;
    private Integer defaultProjectId;

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public Integer getTaskCount() {
        return taskCount;
    }

    public void setTaskCount(Integer taskCount) {
        this.taskCount = taskCount;
    }

    public Integer getDefaultUserId() {
        return defaultUserId;
    }

    public void setDefaultUserId(Integer defaultUserId) {
        this.defaultUserId = defaultUserId;
    }

    public Integer getDefaultSprintId() {
        return defaultSprintId;
    }

    public void setDefaultSprintId(Integer defaultSprintId) {
        this.defaultSprintId = defaultSprintId;
    }

    public Integer getDefaultProjectId() {
        return defaultProjectId;
    }

    public void setDefaultProjectId(Integer defaultProjectId) {
        this.defaultProjectId = defaultProjectId;
    }
}