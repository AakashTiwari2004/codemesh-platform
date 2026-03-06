package com.codemesh.submission.controller;

import com.codemesh.submission.model.Submission;
import com.codemesh.submission.service.SubmissionService;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/submissions")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping
    public Submission create(@RequestBody Submission submission) {
        return submissionService.create(submission);
    }

    @GetMapping
    public List<Submission> getAll() {
        return submissionService.getAll();
    }

    @GetMapping("/{id}")
    public Submission getById(@PathVariable @NonNull Long id) {
        return submissionService.getById(id);
    }
}
