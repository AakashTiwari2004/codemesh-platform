package com.codemesh.submission.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SchemaFixConfig {

    @Bean
    CommandLineRunner widenSubmissionColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            String[] alterStatements = new String[]{
                    "ALTER TABLE submissions MODIFY COLUMN code LONGTEXT",
                    "ALTER TABLE submissions MODIFY COLUMN output LONGTEXT"
            };

            for (String sql : alterStatements) {
                try {
                    jdbcTemplate.execute(sql);
                } catch (Exception ignored) {
                    // Ignore when table/column isn't created yet.
                }
            }
        };
    }
}
