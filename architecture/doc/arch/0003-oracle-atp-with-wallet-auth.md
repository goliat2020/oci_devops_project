# 0003 - Oracle Autonomous Database with Wallet Authentication

Date: 2026-05-29

## Status

Accepted

## Context

The system needs a persistent store for users and tasks. The project runs on Oracle Cloud Infrastructure as part of an academic challenge that explicitly provides OCI credits and an Oracle Autonomous Transaction Processing (ATP) instance.

Database options evaluated:

- Oracle Autonomous Transaction Processing (ATP) — available in the OCI tenancy
- PostgreSQL on a VM — would require provisioning and managing a VM
- MySQL — similar situation
- H2 (in-memory) — not suitable for production
- MongoDB — not available in the provided OCI environment

Connection options for Oracle ATP:

- Oracle Wallet (mTLS) — required by default on ATP
- TLS without wallet — requires additional ATP network configuration
- JDBC with plain credentials — not supported on ATP without disabling mTLS

## Decision

Use **Oracle Autonomous Transaction Processing** as the database, accessed via **Oracle Wallet (mTLS)** through Spring Data JPA and the Oracle JDBC driver.

The wallet zip file is distributed to team members out of band (not committed to Git) and placed in `MtdrSpring/backend/` before running the application.

## Consequences

**Positive:**
- Oracle ATP is fully managed — no patching, backups, or scaling to handle manually
- mTLS via wallet provides strong mutual authentication without building a separate auth layer at the DB level
- Spring Data JPA abstracts the Oracle-specific SQL for most operations
- The `build_spec.yaml` already handles fetching the wallet from OCI Object Storage during the CI/CD build, so the pipeline does not require the wallet to be in the repository

**Negative:**
- The wallet file is an out-of-band dependency — new team members need to request it, which slows onboarding
- The wallet has an expiration date; if it expires, the app fails to start with a cryptic JDBC error
- Local development requires the wallet on disk, which is an extra step compared to a standard username/password database
- The application is tightly coupled to Oracle; migrating to another database would require replacing the JDBC driver, the wallet setup, and potentially JPA queries that use Oracle-specific functions

## Alternatives considered

**PostgreSQL on OCI VM:** Rejected because it would require the team to manage the VM (OS updates, firewall rules, backups), adding operational burden that is out of scope for this sprint.

**H2 for local, Oracle for production:** Rejected because H2 dialect differences would hide bugs that only appear against Oracle, and the wallet setup is not actually difficult once documented.
