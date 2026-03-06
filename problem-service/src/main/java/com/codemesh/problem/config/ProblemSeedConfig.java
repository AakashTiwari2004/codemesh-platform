package com.codemesh.problem.config;

import com.codemesh.problem.model.Problem;
import com.codemesh.problem.repository.ProblemRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class ProblemSeedConfig {

    @Bean
    CommandLineRunner seedProblems(ProblemRepository problemRepository, JdbcTemplate jdbcTemplate) {
        return args -> {
            widenColumnsForLegacySchema(jdbcTemplate);

            if (!problemRepository.existsByTitle("Running Water Stations")) {
                problemRepository.save(buildRunningWaterStationsProblem());
            }
            if (!problemRepository.existsByTitle("Exam Cheating Alerts")) {
                problemRepository.save(buildExamCheatingAlertsProblem());
            }
            if (!problemRepository.existsByTitle("Delivery Route Savings")) {
                problemRepository.save(buildDeliveryRouteSavingsProblem());
            }
        };
    }

    private void widenColumnsForLegacySchema(JdbcTemplate jdbcTemplate) {
        String[] alterStatements = new String[]{
                "ALTER TABLE problems MODIFY COLUMN description LONGTEXT",
                "ALTER TABLE problems MODIFY COLUMN motive LONGTEXT",
                "ALTER TABLE problems MODIFY COLUMN starter_code LONGTEXT",
                "ALTER TABLE problems MODIFY COLUMN sample_input LONGTEXT",
                "ALTER TABLE problems MODIFY COLUMN sample_output LONGTEXT",
                "ALTER TABLE problems MODIFY COLUMN test_cases LONGTEXT"
        };

        for (String sql : alterStatements) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception ignored) {
                // Ignore if table/column doesn't exist yet; Hibernate will create schema.
            }
        }
    }

    private Problem buildRunningWaterStationsProblem() {
        Problem p = new Problem();
        p.setTitle("Running Water Stations");
        p.setDifficulty("Easy");
        p.setMotive("City marathon organizers need the longest stable runner pace segment to place water stations.");
        p.setDescription("Given N runner pace values, find the length of the longest contiguous non-decreasing subarray.");
        p.setStarterCode("""
                import java.io.*;
                import java.util.*;

                public class Main {
                    public static void main(String[] args) throws Exception {
                        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
                        int n = Integer.parseInt(br.readLine().trim());
                        String[] parts = br.readLine().trim().split("\\\\s+");
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) {
                            arr[i] = Integer.parseInt(parts[i]);
                        }

                        // TODO: print longest non-decreasing contiguous segment length
                        System.out.println(0);
                    }
                }
                """);
        p.setSampleInput("""
                8
                2 2 3 1 2 2 2 1
                """);
        p.setSampleOutput("4");
        p.setTestCases("""
                [
                  {"input":"8\\n2 2 3 1 2 2 2 1\\n","output":"4"},
                  {"input":"5\\n5 4 3 2 1\\n","output":"1"},
                  {"input":"6\\n1 2 3 4 5 6\\n","output":"6"},
                  {"input":"7\\n1 3 3 2 2 5 6\\n","output":"4"}
                ]
                """);
        return p;
    }

    private Problem buildExamCheatingAlertsProblem() {
        Problem p = new Problem();
        p.setTitle("Exam Cheating Alerts");
        p.setDifficulty("Medium");
        p.setMotive("An exam platform needs fast detection of repeated suspicious IDs in a single room feed.");
        p.setDescription("Given N IDs and an integer K, print the count of subarrays containing at least one ID repeated at least K times.");
        p.setStarterCode("""
                import java.io.*;
                import java.util.*;

                public class Main {
                    public static void main(String[] args) throws Exception {
                        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
                        String[] first = br.readLine().trim().split("\\\\s+");
                        int n = Integer.parseInt(first[0]);
                        int k = Integer.parseInt(first[1]);
                        String[] parts = br.readLine().trim().split("\\\\s+");
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) {
                            arr[i] = Integer.parseInt(parts[i]);
                        }

                        // TODO: print count of qualifying subarrays
                        System.out.println(0);
                    }
                }
                """);
        p.setSampleInput("""
                5 2
                1 2 1 2 3
                """);
        p.setSampleOutput("6");
        p.setTestCases("""
                [
                  {"input":"5 2\\n1 2 1 2 3\\n","output":"6"},
                  {"input":"4 3\\n4 4 4 4\\n","output":"3"},
                  {"input":"6 2\\n1 1 1 1 1 1\\n","output":"15"},
                  {"input":"5 2\\n1 2 3 4 5\\n","output":"0"}
                ]
                """);
        return p;
    }

    private Problem buildDeliveryRouteSavingsProblem() {
        Problem p = new Problem();
        p.setTitle("Delivery Route Savings");
        p.setDifficulty("Easy");
        p.setMotive("A logistics startup wants to minimize fuel by finding the max sum contiguous delivery window.");
        p.setDescription("Given N integers representing daily profit/loss impact of route choices, print maximum subarray sum.");
        p.setStarterCode("""
                import java.io.*;
                import java.util.*;

                public class Main {
                    public static void main(String[] args) throws Exception {
                        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
                        int n = Integer.parseInt(br.readLine().trim());
                        String[] parts = br.readLine().trim().split("\\\\s+");
                        int[] arr = new int[n];
                        for (int i = 0; i < n; i++) {
                            arr[i] = Integer.parseInt(parts[i]);
                        }

                        // TODO: print maximum subarray sum
                        System.out.println(0);
                    }
                }
                """);
        p.setSampleInput("""
                8
                -2 1 -3 4 -1 2 1 -5
                """);
        p.setSampleOutput("6");
        p.setTestCases("""
                [
                  {"input":"8\\n-2 1 -3 4 -1 2 1 -5\\n","output":"6"},
                  {"input":"5\\n-8 -3 -6 -2 -5\\n","output":"-2"},
                  {"input":"6\\n1 2 3 4 5 6\\n","output":"21"},
                  {"input":"7\\n5 -2 3 4 -10 8 2\\n","output":"10"}
                ]
                """);
        return p;
    }
}
