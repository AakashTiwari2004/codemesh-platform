# AWS Deployment Guide

This repo now includes AWS-ready infrastructure under:

- `infra/aws/terraform`
- shared CI/CD pipeline in `Jenkinsfile`

## What is covered

- ECS/Fargate deployment for microservices
- RDS for `postgres` or `mysql`
- S3 + CloudFront for Angular static hosting
- Route53 DNS records for API + frontend
- Secrets Manager for DB credentials
- Parameter Store for JWT secret

## Deploy order

1. Provision infra:
   - `cd infra/aws/terraform`
   - `cp terraform.tfvars.example terraform.tfvars`
   - fill VPC/subnets/domains/cert
   - `terraform init && terraform apply`
2. Push backend images:
   - run Jenkins job with:
   - `REGISTRY_PROVIDER=ECR`
   - `ECR_REGISTRY=<your_account>.dkr.ecr.<region>.amazonaws.com`
   - `IMAGE_TAG=<release_tag>`
   - `DEPLOY_TARGET=ECS`
3. Deploy frontend:
   - build Angular app and sync `dist/` to Terraform output bucket
   - create CloudFront invalidation

## Required Jenkins setup

- DockerHub credential (if DockerHub used): `dockerhub-creds`
- AWS CLI available on agent
- Jenkins agent IAM permissions for:
  - ECR push/pull
  - ECS update-service
  - SSM/Secrets read (runtime roles)

## EC2 Public Access Guide (Docker Compose)

Use this if you want to run the stack on a single EC2 instance and test from browser using public IP.

### 1. Launch EC2

- AMI: Ubuntu 22.04 LTS (or Amazon Linux 2023)
- Instance type: `t3.medium` or above
- Storage: at least 20 GB
- Key pair: create/select one so you can SSH

### 2. Configure Security Group (Inbound Rules)

Open these inbound ports on EC2 security group:

- `22` (SSH) from your own IP only (recommended), not `0.0.0.0/0`
- `8080` (API Gateway) from `0.0.0.0/0` for public API/browser testing
- `3306` (MySQL) keep closed publicly; open only if strictly required and only to your IP

Do not expose service-internal ports (`8081`, `8082`, `8083`) publicly.

### 3. Recommended: one-shot bootstrap script

Script location:

- `infra/aws/ec2-setup.sh`

Run on EC2:

```bash
ssh -i <your-key>.pem ubuntu@<EC2_PUBLIC_IP>
git clone <your-repo-url>
cd codemesh-platform
chmod +x infra/aws/ec2-setup.sh
REPO_URL='<your-repo-url>' BRANCH='main' APP_DIR='/opt/codemesh-platform' bash infra/aws/ec2-setup.sh
```

What it does:

- installs Docker + Compose plugin
- clones (or pulls) repo to `APP_DIR`
- runs `docker compose up -d --build`
- runs smoke tests on:
  - `/problems`
  - `/submissions`
  - `/execute/logs`

### 4. Manual setup (if you do not want script)

```bash
ssh -i <your-key>.pem ubuntu@<EC2_PUBLIC_IP>
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

### 5. Run project on EC2

```bash
git clone <your-repo-url>
cd codemesh-platform
docker compose up -d --build
docker compose ps
```

Expected:

- `api-gateway` mapped as `0.0.0.0:8080->8080`
- other backend services up
- `mysql` in healthy state

### 6. Live browser/API tests

Replace `<EC2_PUBLIC_IP>` with your instance public IPv4:

- `http://<EC2_PUBLIC_IP>:8080/problems`
- `http://<EC2_PUBLIC_IP>:8080/submissions`
- `http://<EC2_PUBLIC_IP>:8080/execute/logs`

Quick terminal check on EC2:

```bash
curl -i http://localhost:8080/problems
curl -i http://localhost:8080/submissions
curl -i http://localhost:8080/execute/logs
```

### 7. If public URL not working, debug in this order

1. `docker compose ps` (container up/down)
2. `docker compose logs --tail=100 api-gateway`
3. Security Group inbound rule for `8080`
4. EC2 OS firewall:
   - Ubuntu UFW: `sudo ufw status` (allow 8080 if enabled)
5. Verify correct public IP (instance may have changed after stop/start unless Elastic IP used)

### 8. Optional but recommended hardening

- Assign Elastic IP so URL does not change
- Put Nginx in front on `80/443`
- Add domain + TLS (ACM if behind ALB, or Let's Encrypt on EC2)
- Move from single EC2 to ECS setup in `infra/aws/terraform` for production
