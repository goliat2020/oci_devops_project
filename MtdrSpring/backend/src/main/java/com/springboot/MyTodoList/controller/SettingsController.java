package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.AppConfig;
import com.springboot.MyTodoList.repository.AppConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private AppConfigRepository appConfigRepository;

    @GetMapping
    public Map<String, String> getSettings() {
        Map<String, String> settings = new HashMap<>();
        appConfigRepository.findAll().forEach(c -> settings.put(c.getConfigKey(), c.getConfigValue()));
        return settings;
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> updateSettings(@RequestBody Map<String, String> body) {
        body.forEach((key, value) -> {
            AppConfig config = appConfigRepository.findById(key)
                    .orElse(new AppConfig(key, value));
            config.setConfigValue(value);
            appConfigRepository.save(config);
        });

        Map<String, String> settings = new HashMap<>();
        appConfigRepository.findAll().forEach(c -> settings.put(c.getConfigKey(), c.getConfigValue()));
        return ResponseEntity.ok(settings);
    }
}
