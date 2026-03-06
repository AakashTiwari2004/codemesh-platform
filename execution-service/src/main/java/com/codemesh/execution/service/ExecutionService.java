package com.codemesh.execution.service;

import com.codemesh.execution.model.ExecutionLog;
import com.codemesh.execution.repository.ExecutionLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ExecutionService {

    private final ExecutionLogRepository executionLogRepository;

    public ExecutionService(ExecutionLogRepository executionLogRepository) {
        this.executionLogRepository = executionLogRepository;
    }

    public Map<String, String> runCode(Map<String, String> submission) {
        String code = submission.getOrDefault("code", "");
        String output = "Executed: " + code;
        String status = "success";

        ExecutionLog log = new ExecutionLog();
        log.setCode(code);
        log.setStatus(status);
        log.setOutput(output);
        executionLogRepository.save(log);

        return Map.of("output", output, "status", status);
    }

    public List<ExecutionLog> getLogs() {
        return executionLogRepository.findAll();
    }
}
