# Release Notes — Oracle Java Bot v1.2

**Release:** v1.2  
**Publication date:** May 27, 2026  
**Audience:** End users, administrators, developers, and support personnel  
**Compatibility:** Web portal, Java Spring Boot backend, Oracle Autonomous Database, OCI deployment, and Telegram integration

---

## 1. Release Summary

Version 1.2 expands Oracle Java Bot from a basic task-management application into a more complete project-monitoring solution. The release introduces KPI visualizations and AI-assisted project planning, improves application performance, and fixes a task-creation reliability problem.

---

## 2. New Features

### KPI Dashboard with Charts

Users can visualize project and team indicators through charts inside the platform. This reduces the need to export data and makes project progress easier to review.

Supported indicators may include:

- Completed tasks.
- Hours worked.
- Developer performance by sprint.
- Completion rate.
- Estimated time compared with actual time.

### AI-Powered Project Breakdown

The AI Planner can transform a project goal or feature description into a suggested list of smaller, actionable tasks.

All generated tasks must be reviewed before they are accepted because AI output may be incomplete, inaccurate, duplicated, or unsuitable for the project.

---

## 3. Improvements

### Task Board Performance

Task-board loading and navigation were optimized through database-query and frontend-asset improvements.

### Automatic KPI Calculation

KPI values are calculated from project, task, status, assignment, and work-hour records. This provides more consistent information than manually entered KPI values.

### Documentation

The repository includes:

- An end-user guide.
- Release notes.
- A documented software development process.
- A UML activity diagram represented in Mermaid.

---

## 4. Bug Fixes

### Intermittent Failure When Adding Tasks

**Previous behavior:** In some sessions, selecting **Add Task** did not create a task and the interface did not clearly report the failure.

**Resolution:** Session and request-handling logic was improved so that task-creation requests use valid authentication information and failures are handled more reliably.

**User action:** Sign in again if a session has expired, then retry the operation.

---

## 5. Breaking Changes and Deprecations

### Manual KPI Entry Removed

The manually maintained KPI table is no longer the source of KPI information.

**New behavior:** KPI values are generated automatically from operational data.

**Impact:**

- Users can no longer directly edit calculated KPI values.
- Incorrect task, sprint, assignment, or hour data can produce incorrect KPIs.
- Historical manually entered values should be exported before upgrading when preservation is required.

---

## 6. Known Issues

### Telegram Bot May Become Temporarily Unresponsive

Under some network conditions, Telegram API communication may time out.

**Workaround:**

1. Retry the command once.
2. Use the web portal to consult tasks.
3. Restart the bot service if you are an authorized administrator.
4. Report repeated failures with the time and command used.

### Deployment Configuration Is Environment-Dependent

The application requires valid OCI configuration, database access, secrets, and a deployed service endpoint. End users should contact the administrator when the portal is unavailable.

---

## 7. Security Notes

- Do not commit Oracle wallet files, passwords, bot tokens, API keys, or cloud credentials.
- Store deployment credentials in approved secret-management mechanisms.
- Review AI prompts before submission and avoid confidential information.
- Rotate any credential that may have been exposed.
- Restrict administrative operations according to user role.

---

## 8. Upgrade Notes

Before upgrading:

1. Back up the database and relevant configuration.
2. Export any historical manually entered KPI information that must be preserved.
3. Confirm that OCI secrets and database connectivity are available.
4. Review environment variables and deployment manifests.
5. Run automated tests and smoke tests in a non-production environment.

After upgrading:

1. Confirm that the web portal loads.
2. Verify user authentication.
3. Create and update a test task.
4. Validate project and sprint filters.
5. Review KPI calculations.
6. Test the AI Planner with non-confidential sample data.
7. Verify Telegram bot connectivity.
8. Monitor application and deployment logs.

---

## 9. Rollback Considerations

A rollback should be initiated when the release causes a critical authentication, data-integrity, availability, or security problem.

Recommended rollback actions:

1. Stop further production changes.
2. Redeploy the previously approved container image.
3. Restore the database only when a compatible backup and authorization are available.
4. Verify the previous version through smoke tests.
5. Document the incident and corrective actions.

The removal of manual KPI entry may require data migration or restoration planning; it should not be assumed to be automatically reversible.

---

## 10. Validation Checklist

- [ ] Release tag created in GitHub.
- [ ] Release title and version are consistent.
- [ ] Publication date is correct.
- [ ] New features are documented.
- [ ] Improvements are documented.
- [ ] Fixed defects are documented.
- [ ] Breaking changes are identified.
- [ ] Known issues include workarounds.
- [ ] Security implications are documented.
- [ ] Upgrade and rollback instructions are included.
- [ ] User guide is linked.
- [ ] Tests and acceptance evidence are available.
- [ ] Deployment was smoke-tested.
- [ ] No credentials or secret files are included in the release.

---

## 11. Related Documentation

- `README.md` — repository overview and local execution.
- `USER_GUIDE.md` — instructions for final users.
- `SOFTWARE_DEVELOPMENT_PROCESS.md` — lifecycle from requirements through maintenance.
- GitHub Issues — defect and enhancement tracking.
- GitHub Releases — version history and downloadable release artifacts.

---

## 12. Change History

| Release | Date | Description |
|---|---|---|
| v1.2 | May 27, 2026 | KPI charts, AI project breakdown, performance improvements, task-creation fix, and updated documentation. |
