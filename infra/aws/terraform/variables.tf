variable "project_name" {
  description = "Prefix used for AWS resources."
  type        = string
  default     = "codemesh"
}

variable "aws_region" {
  description = "AWS region for deployment."
  type        = string
  default     = "ap-south-1"
}

variable "vpc_id" {
  description = "VPC ID where ECS/RDS/ALB will run."
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnets for ALB."
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnets for ECS tasks and RDS."
  type        = list(string)
}

variable "image_tag" {
  description = "Docker image tag used by ECS services."
  type        = string
  default     = "latest"
}

variable "ecs_desired_count" {
  description = "Desired task count per ECS service."
  type        = number
  default     = 1
}

variable "db_engine" {
  description = "RDS engine (postgres or mysql)."
  type        = string
  default     = "postgres"
  validation {
    condition     = contains(["postgres", "mysql"], var.db_engine)
    error_message = "db_engine must be postgres or mysql."
  }
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB."
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Initial database name."
  type        = string
  default     = "codemesh"
}

variable "db_master_username" {
  description = "Master username for RDS."
  type        = string
  default     = "codemesh_admin"
}

variable "api_domain_name" {
  description = "Route53 record for API ALB (optional)."
  type        = string
  default     = ""
}

variable "frontend_domain_name" {
  description = "Route53 record for CloudFront frontend (optional)."
  type        = string
  default     = ""
  validation {
    condition     = var.frontend_domain_name == "" || var.acm_certificate_arn != ""
    error_message = "acm_certificate_arn is required when frontend_domain_name is set."
  }
}

variable "route53_zone_id" {
  description = "Hosted zone ID for Route53 records (optional)."
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM cert ARN in us-east-1 for CloudFront custom domain (optional)."
  type        = string
  default     = ""
}

variable "frontend_dist_path" {
  description = "Local Angular dist path for manual sync to S3."
  type        = string
  default     = "../codemesh-frontend/dist"
}
