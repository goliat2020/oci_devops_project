package com.springboot.MyTodoList.controller;

import java.io.IOException;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.MyTodoList.model.TaskSuggestionRequest;
import com.springboot.MyTodoList.model.TaskSuggestionResponse;
import com.springboot.MyTodoList.service.EmbeddingIngestionService;
import com.springboot.MyTodoList.service.TaskSuggestionService;

/**
 * Endpoints for Oracle 26ai vector-based task suggestions.
 *
 * POST /ai/suggest-tasks  — RAG: suggest tasks for a sprint based on a user question
 * POST /ai/ingestar       — One-time ingestion of all existing rows into VECTOR columns
 */
@RestController
@RequestMapping("/ai")
public class TaskSuggestionController {

    private static final Logger log = LoggerFactory.getLogger(TaskSuggestionController.class);

    private final TaskSuggestionService suggestionService;
    private final EmbeddingIngestionService ingestionService;

    public TaskSuggestionController(TaskSuggestionService suggestionService,
                                    EmbeddingIngestionService ingestionService) {
        this.suggestionService = suggestionService;
        this.ingestionService = ingestionService;
    }

    /**
     * RAG endpoint — takes a natural language question + sprintId,
     * runs vector search on Oracle, and returns a Gemini-generated suggestion.
     *
     * Request:  { "pregunta": "¿qué tarea hacer hoy?", "sprintId": 3 }
     * Response: { "sugerencia": "...", "tareasEncontradas": [...] }
     */
    @PostMapping(
        value = "/suggest-tasks",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> suggestTasks(@RequestBody TaskSuggestionRequest request) {
        try {
            if (request == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Request body es requerido."));
            }
            if (request.getPregunta() == null || request.getPregunta().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "El campo 'pregunta' es requerido."));
            }
            if (request.getSprintId() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "El campo 'sprintId' es requerido."));
            }

            TaskSuggestionResponse response = suggestionService.suggest(request);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            String detail = e.getMessage();
            if (detail != null && detail.contains("\"code\": 429")) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of("message", "Gemini rate limit (429). Intenta de nuevo en un momento.",
                                     "detail", detail));
            }
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Error consultando Gemini o Oracle.", "detail", detail));
        } catch (Exception e) {
            log.error("Unexpected error in suggest-tasks: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message", "Error inesperado generando sugerencia.",
                            "type",    e.getClass().getSimpleName(),
                            "detail",  e.getMessage() != null ? e.getMessage() : "null"
                    ));
        }
    }

    /**
     * One-time ingestion endpoint — vectorizes all existing TAREA, PROYECTO and SPRINT rows.
     * Call this ONCE after running the DDL (ALTER TABLE ADD EMBEDDING VECTOR...).
     * Safe to call multiple times: only processes rows where EMBEDDING IS NULL.
     */
    @PostMapping(
        value = "/ingestar",
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> ingestar() {
        try {
            String result = ingestionService.ingestAll();
            return ResponseEntity.ok(Map.of("message", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error durante la ingesta.", "detail", e.getMessage()));
        }
    }
}