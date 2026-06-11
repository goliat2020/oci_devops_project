package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.repository.SprintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/sprints")
public class SprintController {

    @Autowired
    private SprintRepository sprintRepository;

    @GetMapping
    public List<Sprint> getAllSprints() {
        return sprintRepository.findAllByOrderByIdSprintDesc();
    }
}
