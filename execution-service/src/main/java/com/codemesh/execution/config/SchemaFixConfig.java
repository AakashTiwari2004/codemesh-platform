package com.codemesh.execution.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SchemaFixConfig {

    @Bean
    CommandLineRunner widenExecutionLogColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            String[] alterStatements = new String[]{
                    "ALTER TABLE execution_logs MODIFY COLUMN code LONGTEXT",
                    "ALTER TABLE execution_logs MODIFY COLUMN output LONGTEXT"
            };

            for (String sql : alterStatements) {
                try {
                    jdbcTemplate.execute(sql);
                } catch (Exception ignored) {
                    // Ignore if table not initialized yet.
                }
            }
        };
    }
}
