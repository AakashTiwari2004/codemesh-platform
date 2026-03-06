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
