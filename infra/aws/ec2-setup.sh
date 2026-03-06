#!/usr/bin/env bash
set -euo pipefail

# One-shot EC2 bootstrap for CodeMesh Docker Compose deployment.
# Supports Ubuntu 22.04+ and can be re-run safely (idempotent enough for updates).

REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/codemesh-platform}"
EXPOSED_PORT="${EXPOSED_PORT:-8080}"
RUN_SMOKE_TESTS="${RUN_SMOKE_TESTS:-true}"

if [[ -z "${REPO_URL}" ]]; then
  echo "ERROR: REPO_URL is required."
  echo "Example:"
  echo "  REPO_URL='https://github.com/<org>/<repo>.git' bash infra/aws/ec2-setup.sh"
  exit 1
fi

log() {
  echo
  echo "[ec2-setup] $*"
}

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "ERROR: Required command not found: ${cmd}"
    exit 1
  fi
}

docker_exec() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  else
    sudo docker "$@"
  fi
}

compose_exec() {
  if docker compose version >/dev/null 2>&1; then
    docker_exec compose "$@"
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    if docker-compose version >/dev/null 2>&1; then
      docker-compose "$@"
    else
      sudo docker-compose "$@"
    fi
    return
  fi

  echo "ERROR: Docker Compose is not available."
  exit 1
}

log "Updating apt index and installing base packages"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker Engine"
  sudo apt-get install -y docker.io docker-compose-plugin
  sudo systemctl enable --now docker
else
  log "Docker already installed"
  sudo systemctl enable --now docker
fi

if id -nG "$USER" | grep -qw docker; then
  log "User '$USER' is already in docker group"
else
  log "Adding '$USER' to docker group (new shell required for group to apply without sudo)"
  sudo usermod -aG docker "$USER"
fi

require_cmd git

if [[ -d "${APP_DIR}/.git" ]]; then
  log "Repository exists at ${APP_DIR}; pulling latest branch '${BRANCH}'"
  sudo git -C "${APP_DIR}" fetch --all --prune
  sudo git -C "${APP_DIR}" checkout "${BRANCH}"
  sudo git -C "${APP_DIR}" pull --ff-only origin "${BRANCH}"
else
  log "Cloning repository into ${APP_DIR}"
  sudo mkdir -p "$(dirname "${APP_DIR}")"
  sudo rm -rf "${APP_DIR}"
  sudo git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
fi

sudo chown -R "$USER":"$USER" "${APP_DIR}"

log "Starting Docker Compose stack"
cd "${APP_DIR}"
compose_exec up -d --build

log "Current service status"
compose_exec ps

if [[ "${RUN_SMOKE_TESTS}" == "true" ]]; then
  log "Running smoke tests against localhost:${EXPOSED_PORT}"
  require_cmd curl
  curl -fsS "http://localhost:${EXPOSED_PORT}/problems" >/dev/null
  curl -fsS "http://localhost:${EXPOSED_PORT}/submissions" >/dev/null
  curl -fsS "http://localhost:${EXPOSED_PORT}/execute/logs" >/dev/null
  log "Smoke tests passed"
fi

log "Deployment complete"
echo "Public test URL:"
echo "  http://<EC2_PUBLIC_IP>:${EXPOSED_PORT}/problems"
