# AWS Deployment (ECS/Fargate + RDS + S3/CloudFront + Route53 + Secrets)

This setup provides:

- ECS/Fargate deployment for `auth-service`, `problem-service`, `submission-service`, `execution-service`
- RDS (`postgres` or `mysql`) for service databases
- Secrets Manager for DB connection values
- Parameter Store for JWT secret
- S3 + CloudFront for Angular static hosting
- Route53 records for API and frontend domains

## 1. Prerequisites

- Terraform `>= 1.6`
- AWS CLI configured (`aws configure`)
- Existing VPC with public and private subnets
- Docker images already pushed to ECR (or use Jenkins pipeline)
- Optional: ACM certificate in `us-east-1` for CloudFront custom domain

## 2. Configure Terraform

```bash
cd infra/aws/terraform
cp terraform.tfvars.example terraform.tfvars
```

Update `terraform.tfvars`:

- `vpc_id`
- `public_subnet_ids`
- `private_subnet_ids`
- domains and hosted zone
- DB engine and sizing

## 3. Deploy Infrastructure

```bash
terraform init
terraform plan
terraform apply
```

After apply, note outputs:

- `ecr_repositories`
- `alb_dns_name`
- `cloudfront_domain_name`
- `frontend_bucket_name`

## 4. Push Frontend Build to S3

```bash
cd codemesh-frontend
npm install
npm run build
aws s3 sync dist/ s3://<frontend_bucket_name> --delete
```

## 5. Invalidate CloudFront Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id <distribution_id> \
  --paths "/*"
```

## 6. ECS Service Deploy Flow (from Jenkins)

- Build and push microservice images
- Set `IMAGE_TAG` in Jenkins
- Run deploy stage with `DEPLOY_TARGET=ECS`
- Pipeline calls `aws ecs update-service --force-new-deployment`

## Secrets Mapping

Per-service Secrets Manager key stores:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_DATASOURCE_DRIVER_CLASS_NAME`
- `SPRING_JPA_DATABASE_PLATFORM`
- `SPRING_JPA_HIBERNATE_DDL_AUTO`

Auth service additionally reads JWT from SSM Parameter Store:

- `/${project_name}/auth/jwt-secret`
