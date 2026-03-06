package com.codemesh.problem.controller;

import com.codemesh.problem.model.Problem;
import com.codemesh.problem.service.ProblemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/problems")
public class ProblemController {

    @Autowired
    private ProblemService service;

    @PostMapping
    public Problem create(@RequestBody @NonNull Problem problem) {
        return service.create(problem);
    }

    @GetMapping
    public List<Problem> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Problem getById(@PathVariable @NonNull Long id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public Problem update(@PathVariable @NonNull Long id, @RequestBody @NonNull Problem problem) {
        return service.update(id, problem);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable @NonNull Long id) {
        service.delete(id);
        return "Deleted!";
    }
}
