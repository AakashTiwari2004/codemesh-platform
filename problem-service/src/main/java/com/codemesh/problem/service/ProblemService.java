package com.codemesh.problem.service;

import com.codemesh.problem.model.Problem;
import com.codemesh.problem.repository.ProblemRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProblemService {

    private final ProblemRepository problemRepository;

    public ProblemService(ProblemRepository problemRepository) {
        this.problemRepository = problemRepository;
    }

    public Problem create(@NonNull Problem p) {
        return problemRepository.save(p);
    }

    public List<Problem> getAll() {
        return problemRepository.findAll().stream()
                .filter(this::isJudgeReady)
                .toList();
    }

    public Problem getById(@NonNull Long id) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null || !isJudgeReady(problem)) {
            return null;
        }
        return problem;
    }

    public Problem update(@NonNull Long id, @NonNull Problem p) {
        if (!problemRepository.existsById(id)) {
            return null;
        }
        p.setId(id);
        return problemRepository.save(p);
    }

    public void delete(@NonNull Long id) {
        problemRepository.deleteById(id);
    }

    private boolean isJudgeReady(Problem problem) {
        return nonBlank(problem.getTitle())
                && nonBlank(problem.getDescription())
                && nonBlank(problem.getMotive())
                && nonBlank(problem.getStarterCode())
                && nonBlank(problem.getSampleInput())
                && nonBlank(problem.getSampleOutput())
                && nonBlank(problem.getTestCases());
    }

    private boolean nonBlank(String value) {
        return value != null && !value.isBlank();
    }
}
