package com.springboot.MyTodoList.model;

import java.util.ArrayList;
import java.util.List;

public class KpiDashboardResponse {
    private List<KpiPoint> tasksCompletedByUserSprint = new ArrayList<>();
    private List<KpiPoint> realHoursByUserSprint = new ArrayList<>();
    private List<String> insights = new ArrayList<>();
    private List<String> improvementActions = new ArrayList<>();

    public List<KpiPoint> getTasksCompletedByUserSprint() {
        return tasksCompletedByUserSprint;
    }

    public void setTasksCompletedByUserSprint(List<KpiPoint> tasksCompletedByUserSprint) {
        this.tasksCompletedByUserSprint = tasksCompletedByUserSprint;
    }

    public List<KpiPoint> getRealHoursByUserSprint() {
        return realHoursByUserSprint;
    }

    public void setRealHoursByUserSprint(List<KpiPoint> realHoursByUserSprint) {
        this.realHoursByUserSprint = realHoursByUserSprint;
    }

    public List<String> getInsights() {
        return insights;
    }

    public void setInsights(List<String> insights) {
        this.insights = insights;
    }

    public List<String> getImprovementActions() {
        return improvementActions;
    }

    public void setImprovementActions(List<String> improvementActions) {
        this.improvementActions = improvementActions;
    }
}
