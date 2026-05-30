# 0004 - Kubernetes on OKE as the Deployment Platform

Date: 2026-05-29

## Status

Accepted

## Context

The application needs a production deployment target on OCI. The `build_spec.yaml` confirms the pipeline installs `kubectl`, creates a kubeconfig pointing to an OKE cluster (`ocid1.cluster.oc1.mx-queretaro-1...`), and calls `undeploy.sh` / `deploy.sh` scripts to manage the workload.

Deployment options evaluated:

- Oracle Kubernetes Engine (OKE) — managed Kubernetes provided by OCI
- OCI Compute VM — a plain virtual machine running Docker
- OCI Container Instances — serverless container runtime
- OCI App Service — platform-as-a-service for web apps

## Decision

Deploy the Spring Boot backend and static frontend as **Docker containers on Oracle Kubernetes Engine (OKE)**.

The CI/CD pipeline (GitHub Actions + OCI DevOps `build_spec.yaml`) builds the image with GraalVM 22, pushes it to OCI Container Registry, and then applies Kubernetes manifests via `kubectl` to the OKE cluster in the `mx-queretaro-1` region.

## Consequences

**Positive:**
- OKE is fully managed — the control plane is Oracle's responsibility
- Kubernetes provides declarative rollouts, rollback (`kubectl rollout undo`), and health checks out of the box
- The same Docker image runs locally and in production, eliminating environment-specific bugs
- GraalVM native image compilation (used in `build_spec.yaml`) produces a smaller, faster-starting container

**Negative:**
- Kubernetes adds conceptual overhead for a small team — YAML manifests, namespaces, kubeconfig management
- The `undeploy.sh` step in the pipeline runs before the new version is confirmed healthy, which creates a brief downtime window on each deploy
- OKE cluster startup time (~5 min) makes the first deployment slow
- The kubeconfig with a public endpoint (`PUBLIC_ENDPOINT`) is a security consideration that should be reviewed before any production traffic

## Alternatives considered

**OCI Compute VM with Docker Compose:** Simpler to understand but requires manual OS management, no automatic restarts on crash, and no rolling updates without additional tooling.

**OCI Container Instances:** Would simplify deployment further (no Kubernetes manifests) but was not chosen because the existing pipeline was already built around `kubectl` and the team had OKE access configured.
