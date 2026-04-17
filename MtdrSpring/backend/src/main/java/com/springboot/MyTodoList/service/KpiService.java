package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.KpiDashboardResponse;
import com.springboot.MyTodoList.model.KpiPoint;
import com.springboot.MyTodoList.repository.KpiPointProjection;
import com.springboot.MyTodoList.repository.ToDoItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class KpiService {

    @Autowired
    private ToDoItemRepository toDoItemRepository;

    public List<KpiPoint> getTasksCompletedByUserSprint(Integer sprintId) {
        return mapPoints(toDoItemRepository.findTasksCompletedByUserAndSprint(sprintId));
    }

    public List<KpiPoint> getRealHoursByUserSprint(Integer sprintId) {
        return mapPoints(toDoItemRepository.findRealHoursByUserAndSprint(sprintId));
    }

    public KpiDashboardResponse getDashboard(Integer sprintId) {
        List<KpiPoint> tasksCompleted = getTasksCompletedByUserSprint(sprintId);
        List<KpiPoint> realHours = getRealHoursByUserSprint(sprintId);

        KpiDashboardResponse response = new KpiDashboardResponse();
        response.setTasksCompletedByUserSprint(tasksCompleted);
        response.setRealHoursByUserSprint(realHours);
        // Insights and improvement actions are entered by users in frontend.
        response.setInsights(new ArrayList<>());
        response.setImprovementActions(new ArrayList<>());
        return response;
    }

    private List<KpiPoint> mapPoints(List<KpiPointProjection> projections) {
        List<KpiPoint> points = new ArrayList<>();
        for (KpiPointProjection p : projections) {
            points.add(new KpiPoint(
                    p.getSprintId(),
                    p.getSprintNombre(),
                    p.getUserId(),
                    p.getUserNombre(),
                    p.getTotalValue() == null ? 0.0 : p.getTotalValue()
            ));
        }
        return points;
    }

}
