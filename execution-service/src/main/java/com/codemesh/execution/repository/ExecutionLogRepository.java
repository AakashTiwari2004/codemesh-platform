package com.codemesh.execution.repository;

import com.codemesh.execution.model.ExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExecutionLogRepository extends JpaRepository<ExecutionLog, Long> {
}
