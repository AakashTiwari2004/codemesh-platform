output "ecr_repositories" {
  description = "ECR URLs for each microservice."
  value = {
    for k, v in aws_ecr_repository.services : k => v.repository_url
  }
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "alb_dns_name" {
  description = "ALB DNS for API traffic."
  value       = aws_lb.api.dns_name
}

output "rds_endpoint" {
  description = "RDS endpoint."
  value       = aws_db_instance.main.address
}

output "frontend_bucket_name" {
  description = "S3 bucket for frontend build artifacts."
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_domain_name" {
  description = "CloudFront domain for Angular frontend."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "jwt_ssm_parameter_name" {
  description = "Parameter Store key for JWT secret."
  value       = aws_ssm_parameter.jwt_secret.name
}
