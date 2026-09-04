package com.nexus.scm.service;

import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.google.GoogleGeminiChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class LangChainAgentService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Autowired private ScmTools scmTools;
    @Autowired private ScmContentRetriever scmContentRetriever;

    // Interface defining SCM AI Agent capabilities
    public interface ScmAgent {
        String chat(String userMessage);
    }

    public String executeAgentChat(
            String userMessage,
            String provider,
            String apiKey,
            String baseUrl,
            String modelName,
            boolean ragEnabled,
            boolean toolsEnabled
    ) {
        ChatLanguageModel model;

        // 1. Resolve selected chat model provider
        if ("openai".equalsIgnoreCase(provider)) {
            String activeKey = (apiKey != null && !apiKey.isEmpty() && !apiKey.equals("MY_OPENAI_API_KEY")) ? apiKey : System.getenv("OPENAI_API_KEY");
            if (activeKey == null || activeKey.isEmpty()) {
                throw new IllegalArgumentException("OpenAI API Key is required when selecting OpenAI.");
            }
            String selectedModelName = (modelName != null && !modelName.isEmpty()) ? modelName : "gpt-4o-mini";
            model = OpenAiChatModel.builder()
                    .apiKey(activeKey)
                    .modelName(selectedModelName)
                    .temperature(0.2)
                    .build();
        } else if ("ollama".equalsIgnoreCase(provider)) {
            String selectedBaseUrl = (baseUrl != null && !baseUrl.isEmpty()) ? baseUrl : "http://localhost:11434";
            String selectedModelName = (modelName != null && !modelName.isEmpty()) ? modelName : "llama3";
            model = OllamaChatModel.builder()
                    .baseUrl(selectedBaseUrl)
                    .modelName(selectedModelName)
                    .temperature(0.2)
                    .build();
        } else {
            // Default to Gemini (Google AI)
            String activeKey = (apiKey != null && !apiKey.isEmpty() && !apiKey.equals("MY_GEMINI_API_KEY")) ? apiKey : geminiApiKey;
            if (activeKey == null || activeKey.isEmpty() || activeKey.equals("MY_GEMINI_API_KEY")) {
                throw new IllegalArgumentException("Google Gemini API Key is unconfigured.");
            }
            String selectedModelName = (modelName != null && !modelName.isEmpty()) ? modelName : "gemini-1.5-flash";
            model = GoogleGeminiChatModel.builder()
                    .apiKey(activeKey)
                    .modelName(selectedModelName)
                    .temperature(0.2)
                    .build();
        }

        // 2. Build AI service using LangChain4j orchestrator
        dev.langchain4j.service.AiServices<ScmAgent> builder = AiServices.builder(ScmAgent.class)
                .chatLanguageModel(model)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10));

        // 3. Attach RAG retriever if enabled
        if (ragEnabled) {
            builder.contentRetriever(scmContentRetriever);
        }

        // 4. Attach SCM execution tools if enabled
        if (toolsEnabled) {
            builder.tools(scmTools);
        }

        ScmAgent agent = builder.build();

        // 5. Build final system contextualizer and call agent
        String systemInstruction = String.format("[SYSTEM CONTEXT: You are a professional, secure SCM AI Coordinator. You have live blockchain audit logging and database access tools. RAG: %b, Tools: %b. Current UTC Time: %s]. ",
                ragEnabled, toolsEnabled, Instant.now().toString());

        return agent.chat(systemInstruction + userMessage);
    }
}
