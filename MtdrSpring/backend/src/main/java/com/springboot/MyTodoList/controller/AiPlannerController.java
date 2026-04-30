package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.AiPlanRequest;
import com.springboot.MyTodoList.service.GeminiService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/ai")
public class AiPlannerController {
    private final GeminiService geminiService;

    private static final Pattern RETRY_DELAY_SECONDS = Pattern.compile("\\\"retryDelay\\\"\\s*:\\s*\\\"(\\d+)s\\\"");
    private static final Pattern RETRY_IN_SECONDS = Pattern.compile("retry in\\s+([0-9]+(?:\\.[0-9]+)?)s", Pattern.CASE_INSENSITIVE);

    public AiPlannerController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping(value = "/generate-plan", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> generatePlan(@RequestBody AiPlanRequest request) {
        try {
            if (request == null || request.getPrompt() == null || request.getPrompt().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "El campo 'prompt' es requerido."));
            }
            return ResponseEntity.ok(geminiService.generateTaskPlan(request));
        } catch (IllegalStateException e) {
            // Return an explicit JSON payload so the frontend can display it reliably.
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            String detail = e.getMessage();
            if (detail != null && detail.contains("\"code\": 429")) {
                Integer retryAfterSeconds = extractRetryAfterSeconds(detail);
                HttpHeaders headers = new HttpHeaders();
                if (retryAfterSeconds != null && retryAfterSeconds > 0) {
                    headers.set(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfterSeconds));
                }
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .headers(headers)
                        .body(Map.of(
                                "message", "Gemini rechazo la solicitud por cuota/limite (429).",
                                "detail", detail,
                                "retryAfterSeconds", retryAfterSeconds
                        ));
            }

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "No fue posible consultar Gemini.", "detail", detail));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error inesperado generando el plan."));
        }
    }

    private Integer extractRetryAfterSeconds(String detail) {
        if (detail == null) {
            return null;
        }
        Matcher m1 = RETRY_DELAY_SECONDS.matcher(detail);
        if (m1.find()) {
            try {
                return Integer.parseInt(m1.group(1));
            } catch (NumberFormatException ignored) {
                // continue
            }
        }

        Matcher m2 = RETRY_IN_SECONDS.matcher(detail);
        if (m2.find()) {
            try {
                double seconds = Double.parseDouble(m2.group(1));
                int roundedUp = (int) Math.ceil(seconds);
                return Math.max(1, roundedUp);
            } catch (NumberFormatException ignored) {
                // ignore
            }
        }
        return null;
    }
}