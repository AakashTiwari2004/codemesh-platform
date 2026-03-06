package com.codemesh.execution.controller;

import com.codemesh.execution.model.ExecutionLog;
import com.codemesh.execution.service.ExecutionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/execute")
public class ExecutionController {

    private final ExecutionService executionService;

    public ExecutionController(ExecutionService executionService) {
        this.executionService = executionService;
    }

    // POST http://localhost:8083/execute
    @PostMapping
    public ResponseEntity<Map<String, String>> runCode(@RequestBody Map<String, String> submission) {
        Map<String, String> response = executionService.runCode(submission);
        return ResponseEntity.ok(response);
    }

    // GET http://localhost:8083/execute/logs
    @GetMapping("/logs")
    public ResponseEntity<List<ExecutionLog>> getLogs() {
        return ResponseEntity.ok(executionService.getLogs());
    }
}