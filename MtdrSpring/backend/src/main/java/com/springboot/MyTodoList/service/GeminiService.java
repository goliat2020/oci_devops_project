package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.springboot.MyTodoList.model.AiGeneratedTask;
import com.springboot.MyTodoList.model.AiPlanRequest;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class GeminiService {
    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private final CloseableHttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:dummy}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent}")
    private String apiUrl;

    public GeminiService(CloseableHttpClient httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    public List<AiGeneratedTask> generateTaskPlan(AiPlanRequest request) throws IOException {
        String callId = UUID.randomUUID().toString();
        if (apiKey == null || apiKey.trim().isEmpty() || "dummy".equalsIgnoreCase(apiKey.trim())) {
            throw new IllegalStateException("Configura GEMINI_API_KEY para usar el modulo de IA.");
        }

        String prompt = buildPrompt(request);
        ObjectNode payload = objectMapper.createObjectNode();
        ArrayNode contents = payload.putArray("contents");
        ObjectNode content = contents.addObject();
        content.put("role", "user");
        ArrayNode parts = content.putArray("parts");
        parts.addObject().put("text", prompt);

        ObjectNode generationConfig = payload.putObject("generationConfig");
        generationConfig.put("temperature", 0.2);
        generationConfig.put("maxOutputTokens", 2048);
        // Note: responseMimeType is not supported on all Gemini REST API versions/models.
        // We rely on prompt instructions + JSON cleanup/parsing instead.

        log.info("[Gemini:{}] generateTaskPlan: calling generateContent", callId);

        // Prefer API key in header to avoid leaking it in URLs/logs.
        org.apache.hc.client5.http.classic.methods.HttpPost post = new org.apache.hc.client5.http.classic.methods.HttpPost(apiUrl);
        post.addHeader("Content-Type", "application/json");
        post.addHeader("Accept", "application/json");
        post.addHeader("x-goog-api-key", apiKey.trim());
        post.setEntity(new StringEntity(objectMapper.writeValueAsString(payload), StandardCharsets.UTF_8));

        org.apache.hc.core5.http.io.HttpClientResponseHandler<String> handler = response -> {
            try (InputStream inputStream = response.getEntity() != null ? response.getEntity().getContent() : InputStream.nullInputStream()) {
                String rawResponse = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
                if (response.getCode() < 200 || response.getCode() >= 300) {
                    throw new IOException("Gemini API error: " + rawResponse);
                }
                JsonNode responseJson = objectMapper.readTree(rawResponse);
                return extractModelText(responseJson);
            }
        };

        try {
            String contentText = httpClient.execute(post, handler);
            return parseTasks(contentText, request);
        } catch (IOException e) {
            // If the configured model/endpoint is wrong, try to discover a supported model and retry once.
            if (looksLikeModelNotFound(e.getMessage())) {
                log.warn("[Gemini:{}] Model not found for configured url; attempting ListModels discovery", callId);
                Optional<String> discoveredUrl = discoverGenerateContentUrlFromListModels();
                if (discoveredUrl.isPresent() && !discoveredUrl.get().equals(apiUrl)) {
                    log.info("[Gemini:{}] Retrying generateContent with discovered url", callId);
                    org.apache.hc.client5.http.classic.methods.HttpPost retryPost = new org.apache.hc.client5.http.classic.methods.HttpPost(discoveredUrl.get());
                    retryPost.addHeader("Content-Type", "application/json");
                    retryPost.addHeader("Accept", "application/json");
                    retryPost.addHeader("x-goog-api-key", apiKey.trim());
                    retryPost.setEntity(new StringEntity(objectMapper.writeValueAsString(payload), StandardCharsets.UTF_8));
                    String contentText = httpClient.execute(retryPost, handler);
                    return parseTasks(contentText, request);
                }
            }

            if (e.getMessage() != null && e.getMessage().contains("\"code\": 429")) {
                log.warn("[Gemini:{}] Gemini returned 429 (rate/quota exceeded)", callId);
            }

            // Surface the root cause while keeping secrets out of logs/messages.
            throw new IOException(sanitizeGeminiError(e.getMessage()), e);
        }
    }

    private boolean looksLikeModelNotFound(String message) {
        if (message == null) {
            return false;
        }
        String m = message.toLowerCase();
        return m.contains("\"code\": 404") || m.contains("not found") || m.contains("listmodels") || m.contains("models/");
    }

    private Optional<String> discoverGenerateContentUrlFromListModels() {
        try {
            String listModelsUrl = toListModelsUrl(apiUrl);
            HttpGet get = new HttpGet(listModelsUrl);
            get.addHeader("Accept", "application/json");
            get.addHeader("x-goog-api-key", apiKey.trim());

            org.apache.hc.core5.http.io.HttpClientResponseHandler<String> handler = response -> {
                try (InputStream inputStream = response.getEntity() != null ? response.getEntity().getContent() : InputStream.nullInputStream()) {
                    String rawResponse = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
                    if (response.getCode() < 200 || response.getCode() >= 300) {
                        throw new IOException("ListModels error: " + rawResponse);
                    }
                    return rawResponse;
                }
            };

            String raw = httpClient.execute(get, handler);
            JsonNode root = objectMapper.readTree(raw);
            JsonNode models = root.path("models");
            if (!models.isArray()) {
                return Optional.empty();
            }

            List<JsonNode> candidates = new ArrayList<>();
            models.forEach(candidates::add);

            return candidates.stream()
                    .filter(node -> supportsGenerateContent(node))
                    .sorted(Comparator.comparingInt((JsonNode node) -> scoreModel(node.path("name").asText(""))).reversed())
                    .map(node -> node.path("name").asText(null))
                    .filter(name -> name != null && !name.isBlank())
                    .map(name -> toGenerateContentUrl(apiUrl, name))
                    .findFirst();
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private boolean supportsGenerateContent(JsonNode modelNode) {
        JsonNode methods = modelNode.path("supportedGenerationMethods");
        if (!methods.isArray()) {
            return false;
        }
        for (JsonNode m : methods) {
            if ("generateContent".equalsIgnoreCase(m.asText())) {
                return true;
            }
        }
        return false;
    }

    private int scoreModel(String name) {
        // Prefer newer + cheaper/faster models first.
        String n = name == null ? "" : name.toLowerCase();
        int score = 0;
        if (n.contains("gemini-3")) score += 80;
        if (n.contains("flash")) score += 100;
        if (n.contains("lite")) score += 30;
        if (n.contains("gemini-2")) score += 50;
        if (n.contains("gemini-1.5")) score += 20;
        if (n.contains("latest")) score += 10;
        return score;
    }

    private String toListModelsUrl(String currentApiUrl) {
        // Example current: https://.../v1beta/models/gemini-2.0-flash:generateContent
        // ListModels:      https://.../v1beta/models
        int idx = currentApiUrl.indexOf("/models/");
        if (idx >= 0) {
            return currentApiUrl.substring(0, idx + "/models".length());
        }
        // Fallback: try to trim after /models
        idx = currentApiUrl.indexOf("/models");
        if (idx >= 0) {
            return currentApiUrl.substring(0, idx + "/models".length());
        }
        return currentApiUrl;
    }

    private String toGenerateContentUrl(String currentApiUrl, String modelNameFromList) {
        // modelNameFromList is like "models/gemini-2.0-flash".
        int idx = currentApiUrl.indexOf("/models/");
        if (idx >= 0) {
            String prefix = currentApiUrl.substring(0, idx + 1); // keeps trailing '/'
            return prefix + modelNameFromList + ":generateContent";
        }
        // If we can't detect, just return current.
        return currentApiUrl;
    }

    private String sanitizeGeminiError(String message) {
        if (message == null) {
            return "Error llamando a Gemini.";
        }
        // Basic redaction in case any upstream includes the key.
        String redacted = message.replace(apiKey, "***");
        return redacted;
    }

    private String buildPrompt(AiPlanRequest request) {
        int taskCount = 6;
        if (request != null && request.getTaskCount() != null && request.getTaskCount() > 0) {
            taskCount = request.getTaskCount();
        }
        Integer userId = request != null ? request.getDefaultUserId() : null;
        Integer sprintId = request != null ? request.getDefaultSprintId() : null;
        Integer projectId = request != null ? request.getDefaultProjectId() : null;
        String basePrompt = request != null && request.getPrompt() != null && !request.getPrompt().trim().isEmpty()
                ? request.getPrompt().trim()
                : "Descompone una tarea grande en tareas pequeñas y accionables.";

        return "Eres un asistente de planificacion para una app de tareas. " +
                "Convierte la solicitud en " + taskCount + " tareas cortas, claras y ejecutables. " +
                "Responde SOLO con un JSON valido tipo array, sin markdown, sin texto extra. " +
                "Cada objeto del array debe tener exactamente estos campos: titulo, descripcion, prioridad, estimacionHoras, horasReales, idUsuario, idSprint, idEstado, idProyecto. " +
                "prioridad solo puede ser LOW, MEDIUM o HIGH. idEstado debe ser 1 para tareas pendientes. horasReales debe ser 0. " +
                "Usa idUsuario=" + (userId != null ? userId : "null") +
                ", idSprint=" + (sprintId != null ? sprintId : "null") +
                ", idProyecto=" + (projectId != null ? projectId : "null") + ". " +
                "La solicitud es: " + basePrompt;
    }

    private String extractModelText(JsonNode responseJson) {
        JsonNode candidates = responseJson.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            return "[]";
        }
        JsonNode content = candidates.get(0).path("content").path("parts");
        if (!content.isArray() || content.isEmpty()) {
            return "[]";
        }
        JsonNode textNode = content.get(0).path("text");
        return textNode.isMissingNode() ? "[]" : textNode.asText("[]");
    }

    private List<AiGeneratedTask> parseTasks(String modelText, AiPlanRequest request) throws IOException {
        String cleaned = cleanupJsonText(modelText);
        List<AiGeneratedTask> tasks = new ArrayList<>();
        JsonNode parsed = objectMapper.readTree(cleaned);
        if (parsed.isArray()) {
            tasks = objectMapper.readValue(cleaned, new TypeReference<List<AiGeneratedTask>>() {});
        } else if (parsed.has("tasks") && parsed.get("tasks").isArray()) {
            tasks = objectMapper.readValue(parsed.get("tasks").toString(), new TypeReference<List<AiGeneratedTask>>() {});
        }

        Integer userId = request != null ? request.getDefaultUserId() : null;
        Integer sprintId = request != null ? request.getDefaultSprintId() : null;
        Integer projectId = request != null ? request.getDefaultProjectId() : null;

        for (AiGeneratedTask task : tasks) {
            if (task.getHorasReales() == null) {
                task.setHorasReales(0d);
            }
            if (task.getIdEstado() == null) {
                task.setIdEstado(1);
            }
            if (task.getIdUsuario() == null) {
                task.setIdUsuario(userId);
            }
            if (task.getIdSprint() == null) {
                task.setIdSprint(sprintId);
            }
            if (task.getIdProyecto() == null) {
                task.setIdProyecto(projectId);
            }
            if (task.getPrioridad() == null || task.getPrioridad().trim().isEmpty()) {
                task.setPrioridad("MEDIUM");
            }
            if (task.getEstimacionHoras() == null) {
                task.setEstimacionHoras(2d);
            }
            if (task.getDescripcion() == null || task.getDescripcion().trim().isEmpty()) {
                task.setDescripcion(task.getTitulo());
            }
        }
        return tasks;
    }

    private String cleanupJsonText(String text) {
        if (text == null) {
            return "[]";
        }
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("(?s)^```(?:json)?\\s*", "");
            cleaned = cleaned.replaceFirst("(?s)\\s*```$", "");
        }
        int start = cleaned.indexOf('[');
        int end = cleaned.lastIndexOf(']');
        if (start >= 0 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }
        return cleaned.isBlank() ? "[]" : cleaned;
    }
}