package com.codemesh.submission.service;

import com.codemesh.submission.model.Submission;
import com.codemesh.submission.repository.SubmissionRepository;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final RestTemplate restTemplate;

    public SubmissionService(SubmissionRepository submissionRepository, RestTemplate restTemplate) {
        this.submissionRepository = submissionRepository;
        this.restTemplate = restTemplate;
    }

    public Submission create(Submission submission) {
        submission.setStatus("PENDING");
        Submission saved = submissionRepository.save(submission);

        String executionUrl = "http://execution-service:8083/execute";

        Map<String, String> request = new HashMap<>();
        request.put("code", submission.getCode());
        request.put("language", submission.getLanguage());

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                executionUrl,
                Objects.requireNonNull(HttpMethod.POST),
                new HttpEntity<>(request),
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        Map<String, Object> body = response.getBody();
        if (body != null) {
            Object status = body.get("status");
            Object output = body.get("output");
            saved.setStatus(status == null ? "FAILED" : status.toString().toUpperCase());
            saved.setOutput(output == null ? "" : output.toString());
        } else {
            saved.setStatus("FAILED");
            saved.setOutput("");
        }

        return submissionRepository.save(saved);
    }

    public List<Submission> getAll() {
        return submissionRepository.findAll();
    }

    public Submission getById(@NonNull Long id) {
        return submissionRepository.findById(id).orElse(null);
    }
}
