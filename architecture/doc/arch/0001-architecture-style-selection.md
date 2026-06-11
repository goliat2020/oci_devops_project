# 0001 - Architecture Style Selection

Date: 2026-05-29

## Status

Accepted

## Context

The project is a task management system accessible through a Telegram bot and a web browser. It is developed by a small student team as a sprint deliverable, deployed on Oracle Cloud Infrastructure using Kubernetes.

We needed to choose an architecture style (or combination of styles) that fits the team size, the conversational nature of the interface, the Oracle Cloud deployment target, and the academic timeline.

The following styles were considered from the nine studied:

- Layered (N-Tier)
- Microservices
- Event-Driven
- Service-Oriented (SOA)
- Monolithic
- Serverless
- Pipe and Filter
- Microkernel
- Space-Based

## Decision

We selected a **Layered (N-Tier) monolithic style** as the primary architecture, with **event-driven characteristics** introduced at the Telegram bot interaction layer.

### Layered monolith (primary style)

The Spring Boot backend is organized into clear horizontal layers:

- **Presentation layer** — REST controllers and Telegram bot handler
- **Service layer** — business logic (task creation, validation, user registration)
- **Persistence layer** — Spring Data JPA repositories
- **Data layer** — Oracle Autonomous Database

This is the dominant style because it maps naturally to Spring Boot conventions, the team has prior experience with it, and it provides the simplest path to a working system within the sprint timeline.

### Event-driven characteristics (secondary, at the bot boundary)

The Telegram bot operates on an event/command model. Each incoming Telegram update (a `/addtodo` message, a `/done` command) is treated as an external event that triggers a handler. The system does not poll a message queue internally, but the bot update dispatch pattern follows an event-driven flow from the Telegram API inward.

This was not implemented as a full event-driven architecture (no message broker, no async queues) because the complexity would not be justified for the current scale.

## Consequences

**Positive:**
- Simple to develop, test, and deploy as a single unit
- Spring Boot's layered conventions are well-understood by the team
- Straightforward debugging — one process, one log stream
- Easy to containerize and deploy on OKE

**Negative:**
- The monolith will need to be split if the system grows significantly
- Vertical scaling is the only option under high load
- The Telegram polling loop and the REST API share the same JVM process, which could cause resource contention under load

## Alternatives considered

**Microservices:** Rejected. The team is small, the domain is simple, and the operational overhead of managing multiple services (service discovery, inter-service auth, distributed tracing) would exceed the benefit at this scale.

**Serverless:** Rejected. OCI Functions would complicate the Oracle Wallet integration and introduce cold-start latency that would make the bot feel unresponsive.
