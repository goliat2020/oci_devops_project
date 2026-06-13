# Oracle Java Bot — End-User Guide

**Version:** 1.2  
**Last updated:** June 12, 2026  
**Audience:** Developers, project managers, administrators, and Telegram users

---

## 1. Purpose

Oracle Java Bot is a project-management application designed for remote and hybrid software teams. It allows users to create and monitor tasks, organize work into projects and sprints, register progress, review productivity indicators, and consult assigned work through a web portal or Telegram bot.

This guide explains how to use the system as an end user. Installation, infrastructure provisioning, and deployment procedures are outside the scope of this document.

---

## 2. Main Features

- Create, view, edit, complete, and delete tasks.
- Organize tasks by project, sprint, status, type, priority, and responsible developer.
- Filter tasks to display only relevant work.
- Review project and developer KPIs.
- Register and consult worked hours.
- Use an AI assistant to break a project objective into smaller tasks.
- Consult assigned or pending tasks through Telegram.
- Access the system through a web interface deployed in Oracle Cloud Infrastructure.

---

## 3. User Roles

### Administrator

The administrator configures system access and manages users, projects, and general platform information. This role may also review team-wide reports and KPIs.

### Manager

The manager creates projects and sprints, assigns responsibilities, establishes priorities, monitors progress, and reviews productivity indicators.

### Developer

The developer consults assigned tasks, updates task status, registers work progress or hours, and uses filters to focus on a specific project or sprint.

### Telegram User

A registered Telegram user can interact with the bot to consult pending tasks and receive project-related information supported by the bot.

---

## 4. Accessing the System

1. Open the public application URL supplied by the project administrator.
2. Enter the username and password assigned to you.
3. Select **Sign in**.
4. After authentication, the main task view is displayed.

> Do not share your credentials. Contact the administrator if your account is unavailable or your role is incorrect.

---

## 5. Navigating the Web Portal

The portal contains the following principal areas:

| Area | Purpose |
|---|---|
| Task Board | Displays tasks and their current state. |
| Projects | Allows authorized users to create and review projects. |
| Sprints | Groups tasks into planned development periods. |
| KPI Dashboard | Displays productivity and progress indicators. |
| AI Planner | Suggests a task breakdown from a project objective. |
| Reports/Hours | Displays registered work and completed-task information. |

The exact menu names may vary slightly according to the deployed version and the user role.

---

## 6. Working with Tasks

### 6.1 Create a Task

1. Open the **Task Board**.
2. Select **Add Task** or **New Task**.
3. Enter the task title and description.
4. Select the related project.
5. Assign a responsible developer, when your role permits it.
6. Select the task type, priority, sprint, and due date when available.
7. Select **Save**.

A successful operation displays the task on the board or task list.

### 6.2 View Task Details

1. Locate the task on the board.
2. Select the task title or details option.
3. Review its description, responsible user, status, priority, project, sprint, dates, and recorded progress.

### 6.3 Update a Task

1. Open the task.
2. Select **Edit**.
3. Modify the permitted fields.
4. Select **Save changes**.

Developers should keep task status current so that managers and KPIs reflect the real state of the project.

### 6.4 Complete a Task

1. Open the task.
2. Change its status to **Completed/Done**, or select the completion control.
3. Confirm the update.

Only mark a task as completed after its acceptance criteria have been met.

### 6.5 Delete a Task

1. Open the task.
2. Select **Delete**.
3. Review the confirmation message.
4. Confirm deletion.

> Deletion may be restricted to managers or administrators and may not be reversible.

---

## 7. Filtering Tasks by Project

1. Open the task list or board.
2. Locate the **Project** filter.
3. Select the desired project.
4. Apply the filter if the interface does not update automatically.
5. Confirm that only tasks associated with that project are displayed.

To return to the complete list, select **All projects** or clear the filter.

If the selected project no longer exists or cannot be accessed, the system should display an error or an empty result rather than unrelated tasks.

---

## 8. Managing Projects and Sprints

### 8.1 Create a Project

Authorized users can:

1. Open **Projects**.
2. Select **New Project**.
3. Enter the project name, description, objective, dates, and team information.
4. Select **Save**.

### 8.2 Create a Sprint

1. Open **Sprints**.
2. Select **New Sprint**.
3. Enter the sprint name, objective, start date, end date, or duration.
4. Assign tasks to the sprint.
5. Select **Save**.

Sprint information should be reviewed before saving because it affects task organization and reporting.

---

## 9. Registering Worked Hours

1. Open the related task or work-report section.
2. Select **Register Hours**.
3. Enter the date, number of hours, and a short description of the work performed.
4. Select **Save**.
5. Verify that the entry appears in the corresponding sprint or developer report.

Enter only hours actually worked and avoid duplicate records.

---

## 10. KPI Dashboard

Open **KPI Dashboard** to review indicators such as:

- Tasks completed by developer and sprint.
- Total hours worked by sprint.
- Total hours worked by developer.
- Completion rate.
- Estimated time compared with actual time.
- Team or individual productivity trends.

KPI values are calculated from task and work records. If a chart appears incorrect, verify the underlying task statuses, assignments, sprint information, and hours before reporting a defect.

---

## 11. AI Project Planner

1. Open **AI Planner**.
2. Enter a clear project objective or feature description.
3. Select the option to generate a plan.
4. Review the proposed tasks.
5. Edit, remove, or refine suggestions before accepting them.
6. Add approved tasks to the project.

AI-generated content is a recommendation. A manager or developer must review accuracy, feasibility, priorities, dependencies, and security implications before using it.

---

## 12. Using the Telegram Bot

### 12.1 Initial Access

1. Open the Telegram bot link or username provided by the administrator.
2. Select **Start** or send `/start`.
3. Follow the registration or account-linking instructions.
4. Use the available command menu.

### 12.2 Typical Operations

Depending on the enabled bot version, users may:

- View assigned tasks.
- View pending tasks.
- Consult task information.
- Receive status or project notifications.
- Access basic task-management actions.

### 12.3 If the Bot Does Not Respond

- Confirm that the device has an internet connection.
- Wait briefly and retry the command once.
- Confirm that the correct bot account is being used.
- Use the web portal as an alternative.
- Report the incident to the administrator if the problem continues.

---

## 13. Common Problems

| Problem | Possible Cause | Recommended Action |
|---|---|---|
| The application does not open | Deployment or network unavailable | Verify your connection and contact the administrator. |
| Login fails | Incorrect credentials or inactive user | Re-enter credentials or request an account reset. |
| A task is missing | Active filters or insufficient permissions | Clear filters and verify the selected project/sprint. |
| A task cannot be saved | Missing required information or expired session | Complete required fields, sign in again, and retry. |
| KPI values look incorrect | Incomplete task or hour records | Verify task assignments, statuses, sprint data, and hours. |
| Telegram bot is unresponsive | Temporary API or service connection problem | Retry once, use the portal, and report the incident. |
| AI planner gives unsuitable tasks | Objective lacks detail or output requires review | Rewrite the objective with constraints and review all suggestions. |

---

## 14. Good Practices

- Keep task status and worked hours updated.
- Use clear task titles and measurable descriptions.
- Assign one accountable owner whenever possible.
- Verify project and sprint filters before interpreting reports.
- Do not include passwords, tokens, personal data, or confidential information in task descriptions or AI prompts.
- Review AI-generated recommendations before accepting them.
- Report defects with steps to reproduce, expected result, actual result, screenshots, and date/time.

---

## 15. Support and Incident Reporting

When reporting a problem through GitHub Issues or to the project administrator, include:

1. A concise title.
2. Your role.
3. The affected module.
4. Steps to reproduce the problem.
5. Expected result.
6. Actual result.
7. Screenshot or error message, excluding credentials.
8. Browser/device and approximate time of occurrence.
9. Severity: low, medium, high, or critical.

Do not publish passwords, Telegram tokens, Oracle credentials, wallet files, API keys, or other secrets.

---

## 16. Glossary

| Term | Meaning |
|---|---|
| KPI | Key Performance Indicator used to evaluate progress or productivity. |
| Sprint | Fixed period in which a set of tasks is planned and completed. |
| Task | Unit of work assigned within a project. |
| OCI | Oracle Cloud Infrastructure. |
| OKE | Oracle Kubernetes Engine. |
| Telegram Bot | Automated Telegram interface used to consult system information. |
| AI Planner | Feature that proposes a structured task breakdown. |
| Manager | User responsible for planning, assignment, and monitoring. |
| Developer | User responsible for executing and updating assigned work. |

---

## 17. Document Control

| Version | Date | Description |
|---|---|---|
| 1.0 | May 2026 | Preliminary technical guide. |
| 1.2 | June 12, 2026 | Rewritten as an end-user guide and aligned with the current release. |
