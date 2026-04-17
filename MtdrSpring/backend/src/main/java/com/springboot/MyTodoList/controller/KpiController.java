package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.KpiDashboardResponse;
import com.springboot.MyTodoList.model.KpiPoint;
import com.springboot.MyTodoList.service.KpiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class KpiController {

    @Autowired
    private KpiService kpiService;

    @GetMapping(value = "/kpi/tasks-completed")
    public List<KpiPoint> getTasksCompletedByUserSprint(@RequestParam(required = false) Integer sprintId) {
        return kpiService.getTasksCompletedByUserSprint(sprintId);
    }

    @GetMapping(value = "/kpi/real-hours")
    public List<KpiPoint> getRealHoursByUserSprint(@RequestParam(required = false) Integer sprintId) {
        return kpiService.getRealHoursByUserSprint(sprintId);
    }

    @GetMapping(value = "/kpi/dashboard")
    public KpiDashboardResponse getDashboard(@RequestParam(required = false) Integer sprintId) {
        return kpiService.getDashboard(sprintId);
    }
}
