# Deployment Guide

This document outlines the deployment strategy for the Nexus Supply Chain Management system.

## Docker Deployment (Local & Staging)

1. **Build the container:**
   ```bash
   docker-compose build
   ```

2. **Run the container:**
   ```bash
   docker-compose up -d
   ```

3. **Environment Variables:**
   Create a `.env` file based on `.env.example`. Ensure `GEMINI_API_KEY` is provided.

## Kubernetes Deployment (Production)

We utilize standard Kubernetes manifests located in `deploy/k8s`.

1. **Apply ConfigMaps and Secrets:**
   ```bash
   kubectl apply -f deploy/k8s/configmap.yaml
   kubectl apply -f deploy/k8s/secrets.yaml
   ```

2. **Deploy Application:**
   ```bash
   kubectl apply -f deploy/k8s/deployment.yaml
   ```

3. **Expose Services:**
   ```bash
   kubectl apply -f deploy/k8s/service.yaml
   kubectl apply -f deploy/k8s/ingress.yaml
   ```

## CI/CD Pipeline

- The pipeline automatically runs tests on Pull Requests.
- On merge to `main`, the Docker image is built and pushed to the container registry.
- Terraform scripts in `deploy/terraform` manage the underlying cloud infrastructure (GCP/AWS).
