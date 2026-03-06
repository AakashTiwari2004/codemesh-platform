locals {
  services = {
    auth-service = {
      port          = 8080
      path_patterns = ["/auth*", "/login*", "/signup*"]
      priority      = 10
    }
    problem-service = {
      port          = 8081
      path_patterns = ["/problems*", "/problem*"]
      priority      = 20
    }
    submission-service = {
      port          = 8082
      path_patterns = ["/submissions*", "/submission*"]
      priority      = 30
    }
    execution-service = {
      port          = 8083
      path_patterns = ["/execute*", "/execution*"]
      priority      = 40
    }
  }

  db_port   = var.db_engine == "postgres" ? 5432 : 3306
  db_driver = var.db_engine == "postgres" ? "org.postgresql.Driver" : "com.mysql.cj.jdbc.Driver"
  db_dialect = var.db_engine == "postgres" ? "org.hibernate.dialect.PostgreSQLDialect" : "org.hibernate.dialect.MySQLDialect"
  db_url    = "jdbc:${var.db_engine}://${aws_db_instance.main.address}:${local.db_port}/${var.db_name}"
}

resource "aws_ecr_repository" "services" {
  for_each             = local.services
  name                 = "${var.project_name}/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_managed" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.project_name}-ecs-task-secrets-policy"
  role = aws_iam_role.ecs_task_execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "kms:Decrypt"
      ]
      Resource = "*"
    }]
  })
}

resource "random_password" "db_master" {
  length  = 24
  special = true
}

resource "random_password" "jwt" {
  length  = 32
  special = false
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "alb" {
  name   = "${var.project_name}-alb-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs" {
  name   = "${var.project_name}-ecs-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds" {
  name   = "${var.project_name}-rds-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port       = local.db_port
    to_port         = local.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  identifier             = "${var.project_name}-db"
  engine                 = var.db_engine
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  db_name                = var.db_name
  username               = var.db_master_username
  password               = random_password.db_master.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
  publicly_accessible    = false
  multi_az               = false
}

resource "aws_secretsmanager_secret" "db_master" {
  name = "${var.project_name}/rds/master"
}

resource "aws_secretsmanager_secret_version" "db_master" {
  secret_id = aws_secretsmanager_secret.db_master.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = random_password.db_master.result
    engine   = var.db_engine
    host     = aws_db_instance.main.address
    port     = local.db_port
    dbname   = var.db_name
  })
}

resource "aws_secretsmanager_secret" "service_db" {
  for_each = local.services
  name     = "${var.project_name}/${each.key}/db"
}

resource "aws_secretsmanager_secret_version" "service_db" {
  for_each  = local.services
  secret_id = aws_secretsmanager_secret.service_db[each.key].id
  secret_string = jsonencode({
    SPRING_DATASOURCE_URL                   = local.db_url
    SPRING_DATASOURCE_USERNAME              = var.db_master_username
    SPRING_DATASOURCE_PASSWORD              = random_password.db_master.result
    SPRING_DATASOURCE_DRIVER_CLASS_NAME     = local.db_driver
    SPRING_JPA_DATABASE_PLATFORM            = local.db_dialect
    SPRING_JPA_HIBERNATE_DDL_AUTO           = "update"
    SPRING_H2_CONSOLE_ENABLED               = "false"
  })
}

resource "aws_ssm_parameter" "jwt_secret" {
  name      = "/${var.project_name}/auth/jwt-secret"
  type      = "SecureString"
  value     = random_password.jwt.result
  overwrite = true
}

resource "aws_cloudwatch_log_group" "service" {
  for_each          = local.services
  name              = "/ecs/${var.project_name}/${each.key}"
  retention_in_days = 14
}

resource "aws_ecs_task_definition" "service" {
  for_each                 = local.services
  family                   = "${var.project_name}-${each.key}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = "${aws_ecr_repository.services[each.key].repository_url}:${var.image_tag}"
      essential = true
      portMappings = [
        {
          containerPort = each.value.port
          hostPort      = each.value.port
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "SERVER_PORT", value = tostring(each.value.port) }
      ]
      secrets = concat([
        { name = "SPRING_DATASOURCE_URL", valueFrom = "${aws_secretsmanager_secret.service_db[each.key].arn}:SPRING_DATASOURCE_URL::" },
        { name = "SPRING_DATASOURCE_USERNAME", valueFrom = "${aws_secretsmanager_secret.service_db[each.key].arn}:SPRING_DATASOURCE_USERNAME::" },
        { name = "SPRING_DATASOURCE_PASSWORD", valueFrom = "${aws_secretsmanager_secret.service_db[each.key].arn}:SPRING_DATASOURCE_PASSWORD::" },
        { name = "SPRING_DATASOURCE_DRIVER_CLASS_NAME", valueFrom = "${aws_secretsmanager_secret.service_db[each.key].arn}:SPRING_DATASOURCE_DRIVER_CLASS_NAME::" },
        { name = "SPRING_JPA_DATABASE_PLATFORM", valueFrom = "${aws_secretsmanager_secret.service_db[each.key].arn}:SPRING_JPA_DATABASE_PLATFORM::" },
        { name = "SPRING_JPA_HIBERNATE_DDL_AUTO", valueFrom = "${aws_secretsmanager_secret.service_db[each.key].arn}:SPRING_JPA_HIBERNATE_DDL_AUTO::" },
        { name = "SPRING_H2_CONSOLE_ENABLED", valueFrom = "${aws_secretsmanager_secret.service_db[each.key].arn}:SPRING_H2_CONSOLE_ENABLED::" }
      ], each.key == "auth-service" ? [
        { name = "JWT_SECRET", valueFrom = aws_ssm_parameter.jwt_secret.arn }
      ] : [])
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.service[each.key].name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_lb" "api" {
  name               = "${var.project_name}-alb"
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "service" {
  for_each    = local.services
  name        = substr("${var.project_name}-${replace(each.key, "-service", "")}-tg", 0, 32)
  port        = each.value.port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    path                = "/actuator/health"
    matcher             = "200-499"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.service["auth-service"].arn
  }
}

resource "aws_lb_listener_rule" "service" {
  for_each     = local.services
  listener_arn = aws_lb_listener.http.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.service[each.key].arn
  }

  condition {
    path_pattern {
      values = each.value.path_patterns
    }
  }
}

resource "aws_ecs_service" "service" {
  for_each        = local.services
  name            = each.key
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.service[each.key].arn
  launch_type     = "FARGATE"
  desired_count   = var.ecs_desired_count

  network_configuration {
    subnets          = var.private_subnet_ids
    assign_public_ip = false
    security_groups  = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.service[each.key].arn
    container_name   = each.key
    container_port   = each.value.port
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-frontend-oac"
  description                       = "CloudFront OAC for frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = var.frontend_domain_name != "" ? [var.frontend_domain_name] : []

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "frontend-s3-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "frontend-s3-origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == ""
    acm_certificate_arn            = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
    ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version       = var.acm_certificate_arn != "" ? "TLSv1.2_2021" : null
  }
}

data "aws_iam_policy_document" "frontend_bucket_policy" {
  statement {
    sid    = "AllowCloudFrontServicePrincipalReadOnly"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend_bucket_policy.json
}

resource "aws_route53_record" "api" {
  count   = var.route53_zone_id != "" && var.api_domain_name != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.api_domain_name
  type    = "A"

  alias {
    name                   = aws_lb.api.dns_name
    zone_id                = aws_lb.api.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "frontend" {
  count   = var.route53_zone_id != "" && var.frontend_domain_name != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.frontend_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

data "aws_caller_identity" "current" {}
