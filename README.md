# CodeMesh Platform

CodeMesh is a full-stack coding platform inspired by online judge workflows (LeetCode-style), built with Java microservices, an Angular frontend, Dockerized local development, and AWS-ready deployment assets.

This project demonstrates practical work aligned with the following engineering direction:

> Build and scale full-stack solutions using Java, Angular, Microservices, and AWS, with hands-on work on CI/CD pipelines (Jenkins) and modern cloud deployments.

## What This Project Does

- User signup/login flow with JWT-based authentication
- Problem browsing with motive-driven problem statements
- Code submission flow (currently Java) with verdicts like `ACCEPTED`, `WRONG_ANSWER`, `COMPILATION_ERROR`, `RUNTIME_ERROR`, `TIME_LIMIT_EXCEEDED`
- Execution/judging against multiple test cases
- Result tracking via submission history endpoints

## Architecture

### Backend Microservices (Spring Boot 3 / Java 17)

- `auth-service` - authentication and user management
- `problem-service` - coding problem catalog and test case metadata
- `submission-service` - submission intake and persistence
- `execution-service` - compile/run/judge engine
- `api-gateway` - single entrypoint and routing for all APIs
- `common` - shared module

### Frontend

- `codemesh-frontend` - Angular 17 app for auth, problem list/detail, submission, and result pages

### Data & Runtime

- MySQL 8 for persistence
- Docker Compose for local multi-service orchestration

## API Routes (via Gateway)

- `/auth/**` -> auth-service
- `/problems/**` -> problem-service
- `/submissions/**` -> submission-service
- `/execute/**` -> execution-service

Gateway runs on: `http://localhost:8080`

## Local Setup

## Prerequisites

- Java 17
- Maven 3.9+
- Node.js 18+
- Docker Desktop (with Compose)

## Run Backend Stack

```bash
docker compose up -d --build
docker compose ps
```

Quick checks:

```bash
curl http://localhost:8080/problems
curl http://localhost:8080/submissions
```

## Run Frontend

```bash
cd codemesh-frontend
npm install
npm start
```

Frontend default URL: `http://localhost:4200`

## CI/CD (Jenkins)

A root `Jenkinsfile` is included with stages for:

- Maven build (`mvn clean install`)
- Docker image build per service
- Push to DockerHub or AWS ECR
- Deployment options:
  - EC2 via Docker Compose
  - ECS service rolling update
  - Kubernetes image update

Pipeline is parameterized (`REGISTRY_PROVIDER`, `DEPLOY_TARGET`, `IMAGE_TAG`, etc.), making it reusable across environments.

## AWS Readiness

AWS deployment assets are included:

- `infra/aws/terraform` (infrastructure templates)
- `infra/aws/ec2-setup.sh` (single-instance bootstrap)
- `AWS_DEPLOYMENT.md` (deployment guide)

Supported target patterns in repository docs/scripts:

- EC2 + Docker Compose (quick public deployment)
- ECS/Fargate-oriented workflow via Jenkins + Terraform
- S3 + CloudFront path for Angular hosting (documented)

## JD Fit Assessment

Target JD: Java + Angular + Microservices + AWS + Jenkins CI/CD + scalable systems.

Current fit status:

- Java fundamentals: `Strong`
- Angular fundamentals: `Strong`
- API & Microservices: `Strong`
- Jenkins CI/CD exposure: `Strong`
- AWS deployment readiness: `Good`
- Production-grade scale/security/observability depth: `Partial`

Overall: **Yes, this project substantially satisfies the JD for an application/interview portfolio.**

## What To Add For Even Better JD Match

1. Add automated backend/frontend test suites in CI gates (unit + integration + E2E).
2. Add observability stack (centralized logs, metrics, tracing, alerts).
3. Add stronger security hardening (secret rotation, rate limits, WAF, stricter CORS).
4. Add autoscaling and load testing evidence for “scalable systems” claims.
5. Add architecture diagram and SLA/SLO notes in docs.

## Repo Structure

```text
codemesh-platform/
  api-gateway/
  auth-service/
  problem-service/
  submission-service/
  execution-service/
  common/
  codemesh-frontend/
  infra/aws/
  docker-compose.yml
  Jenkinsfile
  AWS_DEPLOYMENT.md
```

## Notes

- Backend APIs are exposed through gateway at port `8080`.
- Internal service ports (`8081`, `8082`, `8083`) should remain private in public deployments.
- For public internet access, follow `AWS_DEPLOYMENT.md` security-group and hardening steps.
