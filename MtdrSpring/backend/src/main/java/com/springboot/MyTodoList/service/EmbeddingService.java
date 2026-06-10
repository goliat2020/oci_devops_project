package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.hc.client5.http.classic.methods.HttpGet;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Calls Gemini's embedding model to convert text into a float vector.
 * Auto-discovers the correct embedding model from ListModels if the default fails,
 * using the same pattern as GeminiService.
 */
@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

    // Same base as GeminiService — we derive list/embed URLs from this
    private static final String LIST_MODELS_URL =
            "https://generativelanguage.googleapis.com/v1beta/models";

    // Preferred models in order — first available wins
    private static final String[] CANDIDATE_MODELS = {
            "text-embedding-004",
            "embedding-001",
            "text-embedding-preview-0409"
    };

    private final CloseableHttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:dummy}")
    private String apiKey;

    // Cached after first successful call — avoids repeated discovery
    private volatile String resolvedEmbedUrl = null;

    public EmbeddingService(CloseableHttpClient httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    // ─────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────

    /**
     * Generates a float[] embedding for the given text.
     * Auto-discovers the correct model URL if needed.
     */
    public float[] generateEmbedding(String text) throws IOException {
        String url = getOrDiscoverEmbedUrl();
        float[] result = tryEmbed(url, text);
        if (result != null) {
            return result;
        }
        // URL worked before but failed now — clear cache and retry with fresh discovery
        resolvedEmbedUrl = null;
        url = getOrDiscoverEmbedUrl();
        result = tryEmbed(url, text);
        if (result != null) {
            return result;
        }
        throw new IOException("No se pudo generar el embedding. Verifica tu Gemini API key.");
    }

    /** Converts float[] to Oracle TO_VECTOR()-compatible string "[0.1,0.2,...]" */
    public String toVectorString(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            sb.append(vector[i]);
            if (i < vector.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    /** Convenience: embed + convert to vector string in one call */
    public String generateEmbeddingString(String text) throws IOException {
        return toVectorString(generateEmbedding(text));
    }

    // ─────────────────────────────────────────────
    // URL RESOLUTION
    // ─────────────────────────────────────────────

    private String getOrDiscoverEmbedUrl() throws IOException {
        if (resolvedEmbedUrl != null) {
            return resolvedEmbedUrl;
        }

        // 1. Try known candidates first (fast path — no ListModels call needed)
        for (String[] variant : urlVariants()) {
            String url = variant[0];
            String label = variant[1];
            float[] test = tryEmbed(url, "test");
            if (test != null) {
                log.info("Embedding model resolved: {}", label);
                resolvedEmbedUrl = url;
                return resolvedEmbedUrl;
            }
        }

        // 2. Fall back to ListModels discovery (same strategy as GeminiService)
        log.warn("All candidate embedding URLs failed — trying ListModels discovery");
        Optional<String> discovered = discoverEmbedUrlFromListModels();
        if (discovered.isPresent()) {
            log.info("Discovered embedding URL via ListModels: {}", discovered.get());
            resolvedEmbedUrl = discovered.get();
            return resolvedEmbedUrl;
        }

        throw new IOException(
                "No se encontro un modelo de embedding disponible. " +
                "Revisa tu API key o agrega 'gemini.embedding.url' en application.properties.");
    }

    /** All URL variants to try before falling back to ListModels */
    private String[][] urlVariants() {
        List<String[]> variants = new ArrayList<>();
        for (String model : CANDIDATE_MODELS) {
            variants.add(new String[]{
                "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":embedContent",
                "v1beta/" + model
            });
            variants.add(new String[]{
                "https://generativelanguage.googleapis.com/v1/models/" + model + ":embedContent",
                "v1/" + model
            });
        }
        return variants.toArray(new String[0][]);
    }

    // ─────────────────────────────────────────────
    // LIST MODELS DISCOVERY
    // ─────────────────────────────────────────────

    private Optional<String> discoverEmbedUrlFromListModels() {
        try {
            HttpGet get = new HttpGet(LIST_MODELS_URL);
            get.addHeader("Accept", "application/json");
            get.addHeader("x-goog-api-key", apiKey.trim());

            String raw = httpClient.execute(get, response -> {
                try (InputStream is = response.getEntity() != null
                        ? response.getEntity().getContent()
                        : InputStream.nullInputStream()) {
                    return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                }
            });

            JsonNode root = objectMapper.readTree(raw);
            JsonNode models = root.path("models");
            if (!models.isArray()) return Optional.empty();

            List<JsonNode> candidates = new ArrayList<>();
            models.forEach(candidates::add);

            return candidates.stream()
                    .filter(this::supportsEmbedContent)
                    .sorted(Comparator.comparingInt(
                            (JsonNode n) -> scoreEmbedModel(n.path("name").asText(""))).reversed())
                    .map(n -> n.path("name").asText(null))
                    .filter(name -> name != null && !name.isBlank())
                    .map(name -> "https://generativelanguage.googleapis.com/v1beta/"
                                 + name + ":embedContent")
                    .findFirst();

        } catch (Exception e) {
            log.warn("ListModels discovery failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private boolean supportsEmbedContent(JsonNode modelNode) {
        JsonNode methods = modelNode.path("supportedGenerationMethods");
        if (!methods.isArray()) return false;
        for (JsonNode m : methods) {
            if ("embedContent".equalsIgnoreCase(m.asText())) return true;
        }
        return false;
    }

    private int scoreEmbedModel(String name) {
        String n = name == null ? "" : name.toLowerCase();
        int score = 0;
        if (n.contains("text-embedding-004")) score += 100;
        if (n.contains("text-embedding"))     score += 50;
        if (n.contains("embedding-001"))      score += 30;
        return score;
    }

    // ─────────────────────────────────────────────
    // HTTP CALL
    // ─────────────────────────────────────────────

    /**
     * Attempts a single embedContent call. Returns null (instead of throwing)
     * on 404 so the caller can try the next URL candidate.
     */
    private float[] tryEmbed(String url, String text) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            ObjectNode content = body.putObject("content");
            ArrayNode parts = content.putArray("parts");
            parts.addObject().put("text", text != null ? text : "");

            HttpPost post = new HttpPost(url);
            post.addHeader("Content-Type", "application/json");
            post.addHeader("Accept", "application/json");
            post.addHeader("x-goog-api-key", apiKey.trim());
            post.setEntity(new StringEntity(
                    objectMapper.writeValueAsString(body), StandardCharsets.UTF_8));

            return httpClient.execute(post, response -> {
                try (InputStream is = response.getEntity() != null
                        ? response.getEntity().getContent()
                        : InputStream.nullInputStream()) {

                    String raw = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    int code = response.getCode();

                    if (code == 404 || code == 400) {
                        log.debug("Embed URL not available ({}): {}", code, url);
                        return null; // try next candidate
                    }
                    if (code < 200 || code >= 300) {
                        throw new IOException("Embedding API error " + code + ": " + raw);
                    }

                    JsonNode json = objectMapper.readTree(raw);
                    JsonNode values = json.path("embedding").path("values");

                    if (!values.isArray() || values.isEmpty()) {
                        log.debug("Empty embedding response from {}", url);
                        return null;
                    }

                    float[] vector = new float[values.size()];
                    for (int i = 0; i < values.size(); i++) {
                        vector[i] = (float) values.get(i).asDouble();
                    }
                    log.debug("Embedding OK: {} dims from {}", vector.length, url);
                    return vector;
                }
            });

        } catch (IOException e) {
            log.debug("Embed attempt failed for {}: {}", url, e.getMessage());
            return null;
        }
    }
}