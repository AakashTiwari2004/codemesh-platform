package com.codemesh.execution.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.codemesh.execution.model.ExecutionLog;
import com.codemesh.execution.repository.ExecutionLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class ExecutionService {

    private static final Duration EXECUTION_TIMEOUT = Duration.ofSeconds(2);

    private final ExecutionLogRepository executionLogRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ExecutionService(
            ExecutionLogRepository executionLogRepository,
            RestTemplate restTemplate,
            ObjectMapper objectMapper
    ) {
        this.executionLogRepository = executionLogRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public Map<String, String> runCode(Map<String, Object> submission) {
        String code = String.valueOf(submission.getOrDefault("code", ""));
        String language = String.valueOf(submission.getOrDefault("language", "java")).toLowerCase(Locale.ROOT);
        Long problemId = parseProblemId(submission.get("problemId"));

        JudgeResult result;
        if (problemId == null) {
            result = new JudgeResult("INVALID_SUBMISSION", "Problem id is required.");
        } else if (!"java".equals(language)) {
            result = new JudgeResult("UNSUPPORTED_LANGUAGE", "Only Java is currently supported by this judge.");
        } else if (code.isBlank()) {
            result = new JudgeResult("INVALID_SUBMISSION", "Code cannot be empty.");
        } else {
            result = judgeJavaSubmission(problemId, code);
        }

        persistExecutionLog(code, result);
        return Map.of("output", result.output(), "status", result.status());
    }

    public List<ExecutionLog> getLogs() {
        return executionLogRepository.findAll();
    }

    private void persistExecutionLog(String code, JudgeResult result) {
        ExecutionLog log = new ExecutionLog();
        log.setCode(code);
        log.setStatus(result.status());
        log.setOutput(result.output());
        executionLogRepository.save(log);
    }

    private JudgeResult judgeJavaSubmission(Long problemId, String code) {
        List<TestCase> testCases = fetchTestCases(problemId);
        if (testCases.isEmpty()) {
            return new JudgeResult("INVALID_PROBLEM", "No test cases configured for problem id " + problemId);
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codemesh-judge-");
            Path sourceFile = tempDir.resolve("Main.java");
            Files.writeString(sourceFile, code, StandardCharsets.UTF_8);

            ProcessResult compileResult = runProcess(
                    List.of("javac", "Main.java"),
                    tempDir,
                    "",
                    EXECUTION_TIMEOUT
            );
            if (compileResult.timedOut()) {
                return new JudgeResult("COMPILATION_TIMEOUT", "Compilation timed out.");
            }
            if (compileResult.exitCode() != 0) {
                return new JudgeResult("COMPILATION_ERROR", trimForUi(compileResult.stderr()));
            }

            int passed = 0;
            List<String> details = new ArrayList<>();
            for (int i = 0; i < testCases.size(); i++) {
                TestCase tc = testCases.get(i);
                ProcessResult runResult = runProcess(
                        List.of("java", "-Xmx128m", "Main"),
                        tempDir,
                        tc.input(),
                        EXECUTION_TIMEOUT
                );

                if (runResult.timedOut()) {
                    return new JudgeResult("TIME_LIMIT_EXCEEDED", "Test " + (i + 1) + " exceeded time limit.");
                }
                if (runResult.exitCode() != 0) {
                    String error = runResult.stderr().isBlank() ? runResult.stdout() : runResult.stderr();
                    return new JudgeResult("RUNTIME_ERROR", "Test " + (i + 1) + " runtime error: " + trimForUi(error));
                }

                String actual = normalizeOutput(runResult.stdout());
                String expected = normalizeOutput(tc.output());
                if (!expected.equals(actual)) {
                    details.add("Test " + (i + 1) + " failed");
                    details.add("Expected: " + expected);
                    details.add("Received: " + actual);
                    return new JudgeResult("WRONG_ANSWER", String.join("\n", details));
                }

                passed += 1;
            }

            return new JudgeResult("ACCEPTED", "Passed " + passed + "/" + testCases.size() + " tests.");
        } catch (IOException ex) {
            return new JudgeResult("JUDGE_ERROR", "Judge IO error: " + ex.getMessage());
        } finally {
            if (tempDir != null) {
                deleteRecursively(tempDir);
            }
        }
    }

    private List<TestCase> fetchTestCases(Long problemId) {
        Map<String, Object> problem = restTemplate.getForObject(
                "http://problem-service:8081/problems/{id}",
                Map.class,
                problemId
        );
        if (problem == null || problem.get("testCases") == null) {
            return List.of();
        }

        String rawTestCases = String.valueOf(problem.get("testCases"));
        try {
            return objectMapper.readValue(rawTestCases, new TypeReference<List<TestCase>>() {});
        } catch (IOException ex) {
            return List.of();
        }
    }

    private ProcessResult runProcess(List<String> command, Path workingDir, String stdin, Duration timeout) throws IOException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(workingDir.toFile());
        Process process = pb.start();

        try {
            process.getOutputStream().write(stdin.getBytes(StandardCharsets.UTF_8));
            process.getOutputStream().flush();
            process.getOutputStream().close();

            boolean completed = process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS);
            if (!completed) {
                process.destroyForcibly();
                return new ProcessResult(-1, "", "Process timed out", true);
            }

            String stdout = readAll(process.getInputStream());
            String stderr = readAll(process.getErrorStream());
            return new ProcessResult(process.exitValue(), stdout, stderr, false);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return new ProcessResult(-1, "", "Execution interrupted", true);
        }
    }

    private String readAll(InputStream stream) throws IOException {
        return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
    }

    private void deleteRecursively(Path path) {
        try {
            if (Files.notExists(path)) {
                return;
            }
            Files.walk(path)
                    .sorted((a, b) -> b.compareTo(a))
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException ignored) {
                        }
                    });
        } catch (IOException ignored) {
        }
    }

    private String normalizeOutput(String output) {
        return output == null ? "" : output.trim().replace("\r\n", "\n").replace('\r', '\n');
    }

    private String trimForUi(String value) {
        String text = normalizeOutput(value);
        if (text.length() <= 500) {
            return text;
        }
        return text.substring(0, 500) + "...";
    }

    private Long parseProblemId(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private record TestCase(String input, String output) {
    }

    private record JudgeResult(String status, String output) {
    }

    private record ProcessResult(int exitCode, String stdout, String stderr, boolean timedOut) {
    }
}
