package com.nexus.scm.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Sends a raw query to Google Gemini API
     */
    public String generateContent(String systemInstruction, String userPrompt, boolean isJsonResponse) {
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("MY_GEMINI_API_KEY")) {
            throw new IllegalStateException("GEMINI_API_KEY is not defined in Spring Boot configuration.");
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

            // Constructing request JSON payload
            String mimeTypeConfig = isJsonResponse ? ", \"responseMimeType\": \"application/json\"" : "";
            String systemInstructionBlock = systemInstruction != null && !systemInstruction.isEmpty() ? 
                ", \"systemInstruction\": { \"parts\": [ { \"text\": \"" + escapeJson(systemInstruction) + "\" } ] }" : "";

            String payload = "{"
                + "  \"contents\": ["
                + "    { \"parts\": [ { \"text\": \"" + escapeJson(userPrompt) + "\" } ] }"
                + "  ],"
                + "  \"generationConfig\": {"
                + "    \"temperature\": 0.2"
                + mimeTypeConfig
                + "  }"
                + systemInstructionBlock
                + "}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                // Return raw JSON response (usually need to parse out candidate text but returning raw content is safe for custom extraction)
                return response.body();
            } else {
                throw new RuntimeException("Gemini API call failed with status code " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            throw new RuntimeException("Exception during Gemini API integration", e);
        }
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
