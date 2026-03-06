package com.codemesh.problem.repository;

import com.codemesh.problem.model.Problem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemRepository extends JpaRepository<Problem, Long> {
    boolean existsByTitle(String title);
}
