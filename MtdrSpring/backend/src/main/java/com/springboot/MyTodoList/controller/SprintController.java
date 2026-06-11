package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.repository.SprintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/sprints")
public class SprintController {

    @Autowired
    private SprintRepository sprintRepository;

    @GetMapping
    public List<Sprint> getAllSprints() {
        return sprintRepository.findAllByOrderByIdSprintDesc();
    }

    @PostMapping
    public ResponseEntity<Sprint> createSprint(@RequestBody Sprint sprint) {
        Optional<Integer> maxId = sprintRepository.findMaxId();
        int newId = maxId.map(i -> i + 1).orElse(1);
        sprint.setIdSprint(newId);
        Sprint saved = sprintRepository.save(sprint);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<Sprint>> createSprints(@RequestBody Map<String, Object> request) {
        Integer count = (Integer) request.get("count");
        Integer idProyecto = (Integer) request.get("idProyecto");
        if (count == null || count <= 0) {
            return ResponseEntity.badRequest().build();
        }
        if (idProyecto == null) {
            idProyecto = 1;
        }

        Optional<Integer> maxIdOpt = sprintRepository.findMaxId();
        int nextId = maxIdOpt.map(i -> i + 1).orElse(1);

        List<Sprint> created = new java.util.ArrayList<>();
        for (int i = 0; i < count; i++) {
            Sprint sprint = new Sprint();
            sprint.setIdSprint(nextId + i);
            sprint.setNombre("Sprint " + (nextId + i));
            sprint.setIdProyecto(idProyecto);
            created.add(sprintRepository.save(sprint));
        }
        return ResponseEntity.ok(created);
    }
}
