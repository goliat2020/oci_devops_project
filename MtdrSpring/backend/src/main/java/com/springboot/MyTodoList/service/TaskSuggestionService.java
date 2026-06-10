package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.springboot.MyTodoList.model.TaskSearchResult;
import com.springboot.MyTodoList.model.TaskSuggestionRequest;
import com.springboot.MyTodoList.model.TaskSuggestionResponse;
import com.springboot.MyTodoList.repository.VectorSearchRepository;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Orchestrates the full RAG pipeline for task suggestions:
 *   1. Embed user query with Gemini text-embedding-004
 *   2. VECTOR_DISTANCE search in Oracle 26ai → top 5 relevant tasks
 *   3. Build context + call Gemini chat → natural language suggestion
 *
 * Also exposes vectorizeTarea() to keep embeddings up-to-date
 * whenever a task is created or modified.
 */
@Service
public class TaskSuggestionService {

    private static final Logger log = LoggerFactory.getLogger(TaskSuggestionService.class);

    private final EmbeddingService embeddingService;
    private final VectorSearchRepository vectorRepo;
    private final CloseableHttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:dummy}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String geminiChatUrl;

    public TaskSuggestionService(EmbeddingService embeddingService,
                                 VectorSearchRepository vectorRepo,
                                 CloseableHttpClient httpClient,
                                 ObjectMapper objectMapper) {
        this.embeddingService = embeddingService;
        this.vectorRepo = vectorRepo;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    // ─────────────────────────────────────────────
    // RAG SUGGEST
    // ─────────────────────────────────────────────

    /**
     * Main RAG method: takes the user's question, searches Oracle for similar tasks,
     * and returns a Gemini-generated suggestion with context.
     */
    public TaskSuggestionResponse suggest(TaskSuggestionRequest request) throws IOException {
        if (request.getPregunta() == null || request.getPregunta().trim().isEmpty()) {
            throw new IllegalArgumentException("El campo 'pregunta' es requerido.");
        }
        if (request.getSprintId() == null) {
            throw new IllegalArgumentException("El campo 'sprintId' es requerido.");
        }

        // Step 1 — embed the user's query
        String queryVector = embeddingService.generateEmbeddingString(request.getPregunta());
        log.info("Query embedding generated for sprintId={}", request.getSprintId());

        // Step 2 — vector search in Oracle
        List<TaskSearchResult> tareas = vectorRepo.findSimilarTasks(queryVector, request.getSprintId());
        log.info("Vector search returned {} tasks", tareas.size());

        // Step 3 — call Gemini with context
        String sugerencia;
        if (tareas.isEmpty()) {
            sugerencia = "No encontre tareas disponibles en el sprint actual que coincidan con tu consulta.";
        } else {
            String contexto = tareas.stream()
                    .map(TaskSearchResult::toContextLine)
                    .collect(Collectors.joining("\n"));
            sugerencia = callGeminiChat(request.getPregunta(), contexto);
        }

        return new TaskSuggestionResponse(sugerencia, tareas);
    }

    // ─────────────────────────────────────────────
    // KEEP EMBEDDINGS FRESH
    // ─────────────────────────────────────────────

    /**
     * Call this in your ToDoItem service whenever a task is created or updated.
     * Keeps the EMBEDDING column in sync with the latest text content.
     */
    public void vectorizeTarea(Integer idTarea, String titulo,
                                String descripcion, String prioridad) {
        try {
            String texto = "Tarea: " + safe(titulo) +
                           ". " + safe(descripcion) +
                           ". Prioridad: " + safe(prioridad);
            String vector = embeddingService.generateEmbeddingString(texto);
            vectorRepo.updateTareaEmbedding(idTarea, vector);
            log.info("Embedding updated for tarea id={}", idTarea);
        } catch (IOException e) {
            // Non-fatal: log but don't break the main save operation
            log.warn("Could not update embedding for tarea id={}: {}", idTarea, e.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    // GEMINI CHAT CALL
    // ─────────────────────────────────────────────

    private String callGeminiChat(String pregunta, String contexto) throws IOException {
        String prompt = "Eres un asistente de gestion de proyectos agiles.\n" +
                        "El usuario pregunta: \"" + pregunta + "\"\n\n" +
                        "Tareas disponibles en el sprint actual:\n" + contexto + "\n\n" +
                        "Sugiere las 2-3 tareas mas relevantes y explica brevemente por que, " +
                        "considerando prioridad y horas estimadas. Responde en espanol.";

        ObjectNode body = objectMapper.createObjectNode();
        ArrayNode contents = body.putArray("contents");
        ObjectNode content = contents.addObject();
        content.put("role", "user");
        ArrayNode parts = content.putArray("parts");
        parts.addObject().put("text", prompt);

        ObjectNode genConfig = body.putObject("generationConfig");
        genConfig.put("temperature", 0.3);
        genConfig.put("maxOutputTokens", 1024);

        HttpPost post = new HttpPost(geminiChatUrl);
        post.addHeader("Content-Type", "application/json");
        post.addHeader("Accept", "application/json");
        post.addHeader("x-goog-api-key", apiKey.trim());
        post.setEntity(new StringEntity(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8));

        return httpClient.execute(post, response -> {
            try (InputStream is = response.getEntity() != null
                    ? response.getEntity().getContent()
                    : InputStream.nullInputStream()) {

                String raw = new String(is.readAllBytes(), StandardCharsets.UTF_8);

                if (response.getCode() < 200 || response.getCode() >= 300) {
                    throw new IOException("Gemini chat error " + response.getCode() + ": " + raw);
                }

                JsonNode json = objectMapper.readTree(raw);
                JsonNode text = json.path("candidates")
                        .path(0).path("content").path("parts").path(0).path("text");

                return text.isMissingNode() ? "No se pudo generar una sugerencia." : text.asText();
            }
        });
    }

    private String safe(String val) {
        return val != null ? val : "";
    }
}
