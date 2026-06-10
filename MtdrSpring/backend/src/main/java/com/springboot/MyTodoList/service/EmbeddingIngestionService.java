package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.repository.VectorSearchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * One-time ingestion service: vectorizes all existing TAREA, PROYECTO and SPRINT rows
 * that don't have an embedding yet.
 *
 * Call POST /ai/ingestar once after the 26ai upgrade and initial DDL changes.
 * After that, embeddings are kept up-to-date automatically via TaskSuggestionService
 * whenever a task is created or updated.
 */
@Service
public class EmbeddingIngestionService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingIngestionService.class);

    private final EmbeddingService embeddingService;
    private final VectorSearchRepository vectorRepo;

    public EmbeddingIngestionService(EmbeddingService embeddingService,
                                     VectorSearchRepository vectorRepo) {
        this.embeddingService = embeddingService;
        this.vectorRepo = vectorRepo;
    }

    /**
     * Runs full ingestion for all tables.
     * @return summary of records processed
     */
    public String ingestAll() {
        int tareas = ingestTareas();
        int proyectos = ingestProyectos();
        int sprints = ingestSprints();
        return String.format("Ingesta completada: %d tareas, %d proyectos, %d sprints",
                tareas, proyectos, sprints);
    }

    public int ingestTareas() {
        List<Map<String, Object>> rows = vectorRepo.findTareasWithoutEmbedding();
        int count = 0;
        for (Map<String, Object> row : rows) {
            try {
                Integer id = toInt(row.get("ID_TAREA"));
                String texto = "Tarea: " + str(row.get("TITULO")) +
                               ". " + str(row.get("DESCRIPCION")) +
                               ". Prioridad: " + str(row.get("PRIORIDAD"));

                String vector = embeddingService.generateEmbeddingString(texto);
                vectorRepo.updateTareaEmbedding(id, vector);
                count++;
                log.info("Tarea vectorizada: id={}", id);
            } catch (IOException e) {
                log.error("Error vectorizando tarea id={}: {}", row.get("ID_TAREA"), e.getMessage());
            }
        }
        log.info("Ingesta tareas completada: {}/{}", count, rows.size());
        return count;
    }

    public int ingestProyectos() {
        List<Map<String, Object>> rows = vectorRepo.findProyectosWithoutEmbedding();
        int count = 0;
        for (Map<String, Object> row : rows) {
            try {
                Integer id = toInt(row.get("ID_PROYECTO"));
                String texto = "Proyecto: " + str(row.get("NOMBRE")) +
                               ". " + str(row.get("DESCRIPCION"));

                String vector = embeddingService.generateEmbeddingString(texto);
                vectorRepo.updateProyectoEmbedding(id, vector);
                count++;
            } catch (IOException e) {
                log.error("Error vectorizando proyecto id={}: {}", row.get("ID_PROYECTO"), e.getMessage());
            }
        }
        log.info("Ingesta proyectos completada: {}/{}", count, rows.size());
        return count;
    }

    public int ingestSprints() {
        List<Map<String, Object>> rows = vectorRepo.findSprintsWithoutEmbedding();
        int count = 0;
        for (Map<String, Object> row : rows) {
            try {
                Integer id = toInt(row.get("ID_SPRINT"));
                String texto = "Sprint: " + str(row.get("NOMBRE")) +
                               ". Objetivo: " + str(row.get("OBJETIVO"));

                String vector = embeddingService.generateEmbeddingString(texto);
                vectorRepo.updateSprintEmbedding(id, vector);
                count++;
            } catch (IOException e) {
                log.error("Error vectorizando sprint id={}: {}", row.get("ID_SPRINT"), e.getMessage());
            }
        }
        log.info("Ingesta sprints completada: {}/{}", count, rows.size());
        return count;
    }

    // ─── helpers ───────────────────────────────────
    private String str(Object val) {
        return val != null ? val.toString() : "";
    }

    private Integer toInt(Object val) {
        if (val == null) return null;
        if (val instanceof Integer) return (Integer) val;
        if (val instanceof Number) return ((Number) val).intValue();
        return Integer.parseInt(val.toString());
    }
}
