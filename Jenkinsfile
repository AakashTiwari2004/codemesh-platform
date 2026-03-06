pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        choice(name: 'REGISTRY_PROVIDER', choices: ['DOCKERHUB', 'ECR'], description: 'Container registry provider')
        choice(name: 'DEPLOY_TARGET', choices: ['EC2', 'ECS', 'K8S', 'NONE'], description: 'Deployment target')
        string(name: 'IMAGE_TAG', defaultValue: 'latest', description: 'Docker image tag')
        string(name: 'DOCKERHUB_NAMESPACE', defaultValue: 'mydockerhub', description: 'DockerHub namespace (username/org)')
        string(name: 'ECR_REGISTRY', defaultValue: '', description: 'ECR registry URL (example: 123456789012.dkr.ecr.ap-south-1.amazonaws.com)')
        string(name: 'REPOSITORY_PREFIX', defaultValue: 'codemesh', description: 'Repository prefix used for ECR repositories')
        string(name: 'AWS_REGION', defaultValue: 'ap-south-1', description: 'AWS region for ECS')
        string(name: 'ECS_CLUSTER', defaultValue: 'codemesh-cluster', description: 'ECS cluster name')
        string(name: 'ECS_AUTH_SERVICE', defaultValue: 'auth-service', description: 'ECS service name for auth')
        string(name: 'ECS_PROBLEM_SERVICE', defaultValue: 'problem-service', description: 'ECS service name for problem')
        string(name: 'ECS_SUBMISSION_SERVICE', defaultValue: 'submission-service', description: 'ECS service name for submission')
        string(name: 'ECS_EXECUTION_SERVICE', defaultValue: 'execution-service', description: 'ECS service name for execution')
        string(name: 'K8S_NAMESPACE', defaultValue: 'default', description: 'Kubernetes namespace')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'mvn -B clean install'
            }
        }

        stage('Prepare Image Names') {
            steps {
                script {
                    if (params.REGISTRY_PROVIDER == 'ECR') {
                        if (!params.ECR_REGISTRY?.trim()) {
                            error('ECR_REGISTRY is required when REGISTRY_PROVIDER=ECR.')
                        }
                        env.AUTH_IMAGE = "${params.ECR_REGISTRY}/${params.REPOSITORY_PREFIX}/auth-service:${params.IMAGE_TAG}"
                        env.PROBLEM_IMAGE = "${params.ECR_REGISTRY}/${params.REPOSITORY_PREFIX}/problem-service:${params.IMAGE_TAG}"
                        env.SUBMISSION_IMAGE = "${params.ECR_REGISTRY}/${params.REPOSITORY_PREFIX}/submission-service:${params.IMAGE_TAG}"
                        env.EXECUTION_IMAGE = "${params.ECR_REGISTRY}/${params.REPOSITORY_PREFIX}/execution-service:${params.IMAGE_TAG}"
                    } else {
                        if (!params.DOCKERHUB_NAMESPACE?.trim()) {
                            error('DOCKERHUB_NAMESPACE is required when REGISTRY_PROVIDER=DOCKERHUB.')
                        }
                        env.AUTH_IMAGE = "${params.DOCKERHUB_NAMESPACE}/auth-service:${params.IMAGE_TAG}"
                        env.PROBLEM_IMAGE = "${params.DOCKERHUB_NAMESPACE}/problem-service:${params.IMAGE_TAG}"
                        env.SUBMISSION_IMAGE = "${params.DOCKERHUB_NAMESPACE}/submission-service:${params.IMAGE_TAG}"
                        env.EXECUTION_IMAGE = "${params.DOCKERHUB_NAMESPACE}/execution-service:${params.IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    docker build -t ${AUTH_IMAGE} ./auth-service
                    docker build -t ${PROBLEM_IMAGE} ./problem-service
                    docker build -t ${SUBMISSION_IMAGE} ./submission-service
                    docker build -t ${EXECUTION_IMAGE} ./execution-service
                '''
            }
        }

        stage('Registry Login') {
            steps {
                script {
                    if (params.REGISTRY_PROVIDER == 'ECR') {
                        sh 'aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}'
                    } else {
                        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                            sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                        }
                    }
                }
            }
        }

        stage('Docker Push') {
            steps {
                sh '''
                    docker push ${AUTH_IMAGE}
                    docker push ${PROBLEM_IMAGE}
                    docker push ${SUBMISSION_IMAGE}
                    docker push ${EXECUTION_IMAGE}
                '''
            }
        }

        stage('Deploy') {
            when {
                expression { params.DEPLOY_TARGET != 'NONE' }
            }
            steps {
                script {
                    if (params.DEPLOY_TARGET == 'EC2') {
                        sh 'docker compose pull && docker compose up -d'
                    } else if (params.DEPLOY_TARGET == 'ECS') {
                        sh """
                            aws ecs update-service --region ${params.AWS_REGION} --cluster ${params.ECS_CLUSTER} --service ${params.ECS_AUTH_SERVICE} --force-new-deployment
                            aws ecs update-service --region ${params.AWS_REGION} --cluster ${params.ECS_CLUSTER} --service ${params.ECS_PROBLEM_SERVICE} --force-new-deployment
                            aws ecs update-service --region ${params.AWS_REGION} --cluster ${params.ECS_CLUSTER} --service ${params.ECS_SUBMISSION_SERVICE} --force-new-deployment
                            aws ecs update-service --region ${params.AWS_REGION} --cluster ${params.ECS_CLUSTER} --service ${params.ECS_EXECUTION_SERVICE} --force-new-deployment
                        """
                    } else if (params.DEPLOY_TARGET == 'K8S') {
                        sh """
                            kubectl -n ${params.K8S_NAMESPACE} set image deployment/auth-service auth-service=${AUTH_IMAGE}
                            kubectl -n ${params.K8S_NAMESPACE} set image deployment/problem-service problem-service=${PROBLEM_IMAGE}
                            kubectl -n ${params.K8S_NAMESPACE} set image deployment/submission-service submission-service=${SUBMISSION_IMAGE}
                            kubectl -n ${params.K8S_NAMESPACE} set image deployment/execution-service execution-service=${EXECUTION_IMAGE}
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
            sh 'docker image prune -f || true'
        }
    }
}
