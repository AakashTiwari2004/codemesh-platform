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
        return problemRepository.findAll();
    }

    public Problem getById(@NonNull Long id) {
        return problemRepository.findById(id).orElse(null);
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
}
