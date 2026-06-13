workspace "OCI DevOps Project" "Task management Telegram bot deployed on Oracle Cloud Infrastructure" {

    model {

        # ── Actors ──────────────────────────────────────────────────────────
        teamMember  = person "Team Member"      "Developer or student who manages tasks via the Telegram bot."
        devOpsEng   = person "DevOps Engineer"  "Manages CI/CD pipelines, OCI deployments, and infrastructure."
        botFather   = person "BotFather (Telegram)" "Telegram's official bot registration service used to create and configure the bot token."

        # ── External systems ─────────────────────────────────────────────────
        telegramAPI = softwareSystem "Telegram API" "Provides the messaging platform. The bot polls or receives webhooks from this API." "External"
        githubCI    = softwareSystem "GitHub Actions" "Runs automated tests on every push to main." "External"
        ociDevOps   = softwareSystem "OCI DevOps Pipelines" "Builds and deploys the application in OCI." "External"
        ociRegistry = softwareSystem "OCI Container Registry" "Stores versioned Docker images built by the OCI DevOps pipeline." "External"

        # ── Main system ──────────────────────────────────────────────────────
        todoSystem = softwareSystem "Todo Bot System" "Spring Boot application that provides task management through a Telegram bot interface, backed by an Oracle Autonomous Database." {

            webApp = container "Frontend" "Static single-page app served by Spring Boot. Provides a browser-based view of tasks." "HTML / CSS / JavaScript" "Web Browser"

            apiApp = container "Backend API" "Spring Boot application. Handles HTTP REST endpoints, Telegram bot polling, business logic, and database access." "Java 17 / Spring Boot 3" {

                botHandler    = component "Telegram Bot Handler"  "Receives and dispatches Telegram commands (/start, /todo, /addtodo, /done, /help). Uses TelegramBots library."         "Spring @Component" {
                    url "https://github.com/goliat2020/oci_devops_project/blob/main/docs/diagrams/telegram-bot-handler.puml"
                }
                taskService   = component "Task Service"          "Orchestrates task CRUD operations. Validates input and applies business rules before persisting."                       "Spring @Service" {
                    url "https://github.com/goliat2020/oci_devops_project/blob/main/docs/diagrams/task-service.puml"
                }
                taskRepo      = component "Task Repository"       "JPA repository interface. Translates service calls to SQL queries against the Oracle database."                        "Spring Data JPA" {
                    url "https://github.com/goliat2020/oci_devops_project/blob/main/docs/diagrams/task-repository.puml"
                }
                restController = component "REST Controller"      "Exposes /api/todolist endpoints consumed by the frontend SPA."                                                         "Spring @RestController" {
                    url "https://github.com/goliat2020/oci_devops_project/blob/main/docs/diagrams/rest-controller.puml"
                }
                authFilter    = component "Auth Filter"           "Validates Telegram user IDs on incoming bot commands. Rejects unregistered users."                                     "Spring OncePerRequestFilter" {
                    url "https://github.com/goliat2020/oci_devops_project/blob/main/docs/diagrams/auth-filter.puml"
                }
            }

            database = container "Oracle Autonomous Database" "Stores users and tasks. Accessed via Oracle Wallet TLS credentials." "Oracle ATP" "Database"
        }

        # ── OCI Infrastructure (deployment targets) ──────────────────────────
        ociCloud = deploymentEnvironment "OCI Production" {

            deploymentNode "Oracle Cloud Infrastructure" "OCI Tenancy — mx-queretaro-1 region" "OCI" {

                deploymentNode "OKE Cluster" "Oracle Kubernetes Engine cluster" "Kubernetes 1.31" {

                    deploymentNode "todo-namespace" "Kubernetes namespace" "K8s Namespace" {
                        backendInstance = containerInstance apiApp
                        frontendInstance = containerInstance webApp
                    }
                }

                deploymentNode "OCI Container Registry" "Image repository in mx-queretaro-1" "OCIR" {
                    registryInstance = softwareSystemInstance ociRegistry
                }

                deploymentNode "Oracle Autonomous Database" "Managed ATP instance" "Oracle ATP" {
                    dbInstance = containerInstance database
                }
            }
        }

        localEnv = deploymentEnvironment "Local Development" {

            deploymentNode "Developer Laptop" "macOS / Ubuntu / Windows (WSL2)" "Developer Machine" {

                deploymentNode "JVM Process" "Spring Boot embedded Tomcat" "Java 17" {
                    localBackend = containerInstance apiApp
                }

                deploymentNode "Browser" "Chrome / Firefox" "Web Browser" {
                    localFrontend = containerInstance webApp
                }

                deploymentNode "Local Filesystem" "Oracle Wallet files on disk" "Filesystem" {
                    localDb = containerInstance database
                }
            }
        }

        # ── Relationships ─────────────────────────────────────────────────────

        # Actor → system
        teamMember  -> todoSystem   "Sends commands and reads results" "Telegram"
        teamMember  -> todoSystem   "Views tasks in browser" "HTTPS"
        devOpsEng   -> githubCI     "Pushes code, monitors tests" "HTTPS / Git"
        devOpsEng   -> ociDevOps    "Runs build and deployment pipelines" "OCI Console"
        botFather   -> todoSystem   "Provides bot token for authentication" "Telegram API"

        # System → external
        todoSystem  -> telegramAPI  "Polls for updates / sends replies" "HTTPS / Long polling"
        ociDevOps   -> ociRegistry  "Builds and pushes Docker image" "HTTPS"
        ociDevOps   -> todoSystem   "Deploys the application" "OCI API"

        # Container relationships
        teamMember  -> webApp       "Opens task list in browser" "HTTPS"
        teamMember  -> telegramAPI  "Sends /addtodo, /todo, /done commands" "Telegram client"
        telegramAPI -> apiApp       "Delivers bot updates" "HTTPS long poll"
        webApp      -> apiApp       "Fetches and submits tasks" "REST / JSON"
        apiApp      -> database     "Reads and writes task records" "JDBC / Oracle Wallet TLS"
        webApp      -> restController "GET /api/todolist" "REST / JSON"

        # Component relationships
        telegramAPI  -> botHandler    "Delivers update with message text" "HTTPS long poll"
        botHandler    -> authFilter    "Passes incoming update through" "method call"
        authFilter    -> botHandler    "Forwards if user is registered" "method call"
        botHandler    -> taskService   "Delegates CRUD operations" "method call"
        taskService   -> taskRepo      "Persists and queries tasks" "Spring Data"
        restController -> taskService  "Calls task operations for HTTP clients" "method call"
        taskRepo      -> database      "Executes SQL via JDBC" "JDBC"
        botHandler    -> telegramAPI  "Sends replies" "HTTPS"
    }

    views {

        # 1. System Landscape
        systemLandscape "SystemLandscape" "Everything involved in the Todo Bot system" {
            include *
            autoLayout lr
        }

        # 2. System Context
        systemContext todoSystem "SystemContext" "How users and external systems interact with the Todo Bot" {
            include *
            autoLayout lr
        }

        # 3. Containers
        container todoSystem "Containers" "Internal containers that make up the Todo Bot system" {
            include *
            autoLayout lr
        }

        # 4. Components — Backend API
        component apiApp "Components" "Components inside the Spring Boot backend" {
            include *
            autoLayout lr
        }

        # 5. Deployment — OCI Production
        deployment todoSystem "OCI Production" "DeploymentOCI" "How the system runs on Oracle Cloud Infrastructure" {
            include *
            autoLayout lr
        }

        # 6. Deployment — Local
        deployment todoSystem "Local Development" "DeploymentLocal" "How to run the system on a developer machine" {
            include *
            autoLayout lr
        }

        # 7. Dynamic — Add a task via Telegram
        dynamic apiApp "AddTaskFlow" "How a team member adds a task using the Telegram bot" {
            teamMember  -> telegramAPI  "Sends /addtodo Buy milk"
            telegramAPI -> botHandler   "Delivers update with message text"
            botHandler  -> authFilter   "Checks if user is registered"
            authFilter  -> botHandler   "User confirmed"
            botHandler  -> taskService  "createTask(userId, 'Buy milk')"
            taskService -> taskRepo     "save(task)"
            taskRepo    -> database     "INSERT INTO tasks ..."
            taskRepo    -> taskService  "saved task with id"
            taskService -> botHandler   "task created"
            botHandler  -> telegramAPI  "sendMessage('Task added: Buy milk [id=42]')"
            telegramAPI -> teamMember   "Displays confirmation message"
            autoLayout lr
        }

        # 8. Dynamic — View task list via browser
        dynamic apiApp "ViewTasksFlow" "How a team member views tasks in the browser" {
            teamMember   -> webApp        "Opens browser, navigates to app"
            webApp       -> restController "GET /api/todolist"
            restController -> taskService  "getTasks(userId)"
            taskService  -> taskRepo       "findByUserId(userId)"
            taskRepo     -> database       "SELECT * FROM tasks WHERE user_id = ?"
            taskRepo     -> taskService    "list of tasks"
            taskService  -> restController "list of tasks"
            restController -> webApp       "JSON response"
            webApp       -> teamMember     "Renders task list in browser"
            autoLayout lr
        }

        styles {
            element "Person" {
                shape Person
                background #1168bd
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "Database" {
                shape Cylinder
                background #f5a623
                color #000000
            }
            element "Web Browser" {
                shape WebBrowser
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Container" {
                background #23a3dd
                color #ffffff
            }
            element "Component" {
                background #85bbf0
                color #000000
            }
        }
    }

}