package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.KpiCount;
import com.springboot.MyTodoList.model.KpiDashboardResponse;
import com.springboot.MyTodoList.model.KpiEstimationVsReal;
import com.springboot.MyTodoList.model.KpiPoint;
import com.springboot.MyTodoList.repository.KpiCountProjection;
import com.springboot.MyTodoList.repository.KpiEstimationProjection;
import com.springboot.MyTodoList.repository.KpiPointProjection;
import com.springboot.MyTodoList.repository.ToDoItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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

    public List<KpiCount> getTasksByState(Integer sprintId) {
        return mapCounts(toDoItemRepository.findTasksByState(sprintId));
    }

    public List<KpiCount> getTasksByPriority(Integer sprintId) {
        return mapCounts(toDoItemRepository.findTasksByPriority(sprintId));
    }

    public List<KpiEstimationVsReal> getEstimationVsReal(Integer sprintId) {
        return mapEstimations(toDoItemRepository.findEstimationVsReal(sprintId));
    }

    public KpiDashboardResponse getDashboard(Integer sprintId) {
        KpiDashboardResponse response = new KpiDashboardResponse();
        response.setTasksByState(getTasksByState(sprintId));
        response.setTasksByPriority(getTasksByPriority(sprintId));
        response.setTasksCompletedByUserSprint(getTasksCompletedByUserSprint(sprintId));
        response.setRealHoursByUserSprint(getRealHoursByUserSprint(sprintId));
        response.setEstimationVsReal(getEstimationVsReal(sprintId));
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

    private List<KpiCount> mapCounts(List<KpiCountProjection> projections) {
        List<KpiCount> counts = new ArrayList<>();
        for (KpiCountProjection p : projections) {
            counts.add(new KpiCount(
                    p.getName(),
                    p.getTotalTareas() == null ? 0 : p.getTotalTareas()
            ));
        }
        return counts;
    }

    private List<KpiEstimationVsReal> mapEstimations(List<KpiEstimationProjection> projections) {
        List<KpiEstimationVsReal> results = new ArrayList<>();
        for (KpiEstimationProjection p : projections) {
            Double estimadas = p.getHorasEstimadas() == null ? 0.0 : p.getHorasEstimadas();
            Double reales = p.getHorasReales() == null ? 0.0 : p.getHorasReales();
            Double ratio = reales > 0 ? (estimadas / reales) * 100.0 : 100.0;
            results.add(new KpiEstimationVsReal(
                    p.getSprintId(),
                    p.getSprintNombre(),
                    estimadas,
                    reales,
                    ratio
            ));
        }
        return results;
    }
}
