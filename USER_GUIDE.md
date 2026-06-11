# Guía Preliminar de Usuario - OCI DevOps Project (OracleChatBot)

> **Versión:** 1.0-preliminar
> **Aplicación:** MyToDoList, Spring Boot + React + Oracle DB  
> **Entorno:** OCI DevOps · OKE (mx-queretaro-1) · GraalVM 22 · Docker  
> **Sistemas operativos:** Linux · macOS · Windows (WSL2)  
> **Última revisión:** Mayo 2026

> **Equipo 42**

---

## Tabla de Contenidos

1. [Inicio Rápido](#1--inicio-rápido)
2. [¿Qué es este proyecto?](#2-qué-es-este-proyecto)
3. [Arquitectura del sistema](#3-arquitectura-del-sistema)
4. [Requisitos previos y acceso](#4-requisitos-previos-y-acceso)
5. [Cómo ejecutar la aplicación en local](#5-cómo-ejecutar-la-aplicación-en-local)
6. [Cómo construir la imagen Docker](#6-cómo-construir-la-imagen-docker)
7. [Cómo ejecutar el Build Pipeline en OCI DevOps](#7-cómo-ejecutar-el-build-pipeline-en-oci-devops)
8. [Cómo desplegar en Kubernetes (OKE)](#8-cómo-desplegar-en-kubernetes-oke)
9. [API REST  Referencia de endpoints](#9-api-rest--referencia-de-endpoints)
10. [Errores frecuentes y soluciones](#10-errores-frecuentes-y-soluciones)
11. [Glosario](#11-glosario)

---

## 1. Inicio Rápido

> Para usuarios que ya tienen OCI configurado y solo quieren levantar el proyecto.

1. Clona el repositorio: `git clone https://github.com/goliat2020/oci_devops_project.git`
2. Coloca el **wallet de Oracle DB** dentro de `MtdrSpring/backend/wallet/`
3. Desde `MtdrSpring/backend/` ejecuta: `./mvnw spring-boot:run`
4. Abre el navegador en `http://localhost:8080`

Para el pipeline CI/CD completo en OCI, continúa en la [Sección 7](#7-cómo-ejecutar-el-build-pipeline-en-oci-devops).

---

## 2. ¿Qué es este proyecto?

**MyToDoList** es una aplicación web de lista de tareas con integración de inteligencia artificial, construida con:

- **Backend:** Java 22 + Spring Boot (compilado con GraalVM Enterprise 22)
- **Frontend:** React (servido como estático desde el backend)
- **Base de datos:** Oracle Autonomous Database (conexión vía wallet TLS)
- **Bot:** Integración con Telegram para gestión de tareas desde mensajería
- **IA:** Integración con Gemini y DeepSeek para planeación automática de tareas (`AiPlanner`)
- **CI/CD:** OCI DevOps, Build Pipeline automatizado que compila, empaqueta en Docker, publica en OCIR y despliega en OKE (región `mx-queretaro-1`)

### Estructura del repositorio

```
oci_devops_project/
├── build_spec.yaml                   # Pipeline de CI/CD para OCI DevOps
├── MtdrSpring/
│   ├── backend/
│   │   ├── Dockerfile                # Imagen de producción (openjdk:22)
│   │   ├── DockerfileDev             # Imagen de desarrollo (incluye wallet y variables)
│   │   ├── build.sh                  # Script: compilar + empaquetar + push a OCIR
│   │   ├── deploy.sh                 # Script: sustituir variables y aplicar en OKE
│   │   ├── undeploy.sh               # Script: eliminar recursos de Kubernetes
│   │   ├── pom.xml                   # Dependencias Maven del proyecto Java
│   │   └── src/main/
│   │       ├── frontend/             # Código fuente React (AiPlanner, KpiDashboard, etc.)
│   │       ├── java/                 # Código fuente Java (controllers, models, services)
│   │       └── resources/
│   │           └── todolistapp-springboot.yaml   # Manifiesto de Kubernetes
│   ├── terraform/                    # Infraestructura como código (OKE, VCN, DB, etc.)
│   ├── utils/                        # Scripts de configuración y setup del entorno
│   ├── env.sh                        # Variables de entorno del proyecto
│   └── setup.sh                      # Script de configuración inicial
└── videos/                           # Videos de referencia por día de sprint
```

---

## 3. Arquitectura del sistema

El flujo completo desde un commit hasta la aplicación en producción es el siguiente:

```
Developer → git push
     │
     ▼
[OCI DevOps Trigger]
     │ detecta el commit en el repositorio
     ▼
[Build Pipeline - build_spec.yaml]
  1. Instala GraalVM Enterprise 22 (yum)
  2. Descarga configuración del entorno desde OCI Object Storage
     (bucket: reacttodo-fpoyo / archivo: deployment_config.tgz)
  3. Docker login → mx-queretaro-1.ocir.io
  4. Compila frontend React + backend Spring Boot (build.sh)
  5. Construye imagen Docker → OCIR
  6. Instala kubectl + configura kubeconfig para OKE
  7. Undeploy de la versión anterior (undeploy.sh)
     │
     ▼
[OKE Cluster - mx-queretaro-1]
  - Namespace: mtdrworkshop
  - Deployment: todolistapp-springboot-deployment (2 réplicas)
  - Service: LoadBalancer en puerto 80 → contenedor 8080
  - Base de datos: Oracle ATP vía wallet montado como Secret de Kubernetes
     │
     ▼
[Usuario Final]
  Accede vía IP pública del Load Balancer de OCI
```

### Componentes de la aplicación

| Capa | Tecnología | Detalle |
|---|---|---|
| Frontend | React 17+ | `App.js`, `NewItem.js`, `KpiDashboard.js`, `AiPlanner.js` |
| Backend API | Spring Boot (Java 22) | Controllers: `ToDoItemController`, `KpiController`, `AiPlannerController` |
| Base de datos | Oracle Autonomous DB | Conexión JDBC con wallet TLS; tabla `todoitem` |
| Autenticación UI | Spring Security | Variables `ui_username` / `ui_password` |
| Bot Telegram | Java (TelegramBots) | `MyTodoListBot`, `BotActions`, comandos en `BotCommands` |
| IA | Gemini + DeepSeek | `GeminiService.java`, `DeepSeekService.java` |
| Container | Docker (openjdk:22) | Puerto 8080, JAR: `MyTodoList-0.0.1-SNAPSHOT.jar` |
| Orquestación | Kubernetes (OKE) | 2 réplicas, LoadBalancer, secrets para DB y frontend |
| Infraestructura | Terraform | OKE, VCN, API Gateway, Object Storage, Container Registry |

---

## 4. Requisitos previos y acceso

> **Rol requerido:** Debes tener permisos de administrador en el compartimento OCI del proyecto, o el rol equivalente de **Workspace Admin**.

> **Precaución:** Sin el wallet de la base de datos Oracle, la aplicación no puede conectarse al ATP. Solicita el archivo `deployment_config.tgz` al administrador del proyecto antes de comenzar.

### Herramientas necesarias

| Herramienta | Versión mínima | Requerido |
|---|---|---|
| Git | 2.x |  Sí |
| Java JDK | 22 (GraalVM Enterprise recomendado) |  Sí |
| Maven Wrapper (`mvnw`) | 3.8.4 (incluido en el repo) |  Sí |
| Docker Engine / Docker Desktop | 20.x |  Sí |
| OCI CLI | 3.x |  Sí |
| kubectl | 1.28+ |  Sí |
| Cuenta Oracle Cloud (OCI) | Activa, región mx-queretaro-1 |  Sí |
| Wallet Oracle Autonomous DB | Archivo `deployment_config.tgz` |  Sí |
| Terraform CLI | 1.x | Opcional (para infra) |

### Configuración de OCI CLI

1. Instala OCI CLI:
   ```bash
   bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
   ```

2. Ejecuta el asistente de configuración:
   ```bash
   oci setup config
   ```
   El asistente pedirá: OCID de usuario, OCID de tenancy y región (`mx-queretaro-1`).

3. Sube la clave pública generada (`~/.oci/oci_api_key_public.pem`) en la consola OCI:
   **Mi Perfil** → **Claves API** → **Agregar clave API**.

4. Verifica la conexión:
   ```bash
   oci iam region list
   ```

---

## 5. Cómo ejecutar la aplicación en local

### Opción A - Con Maven directamente (recomendado para desarrollo)

1. Clona el repositorio:
   ```bash
   git clone https://github.com/goliat2020/oci_devops_project.git
   cd oci_devops_project
   ```

2. Coloca el wallet de Oracle DB en la carpeta correcta:
   ```bash
   # Copia los archivos del wallet (tnsnames.ora, cwallet.sso, etc.)
   cp -r /ruta/a/tu/wallet/* MtdrSpring/backend/wallet/
   ```

3. Desde la carpeta del backend, ejecuta la aplicación:
   ```bash
   cd MtdrSpring/backend
   ./mvnw spring-boot:run
   ```

4. Abre el navegador en `http://localhost:8080`. La interfaz de React se sirve desde el mismo puerto.

> **Pro-Tip:** La primera ejecución descarga todas las dependencias de Maven (~200 MB). Las ejecuciones siguientes son mucho más rápidas porque las dependencias quedan en caché local.

### Opción B - Con Docker (entorno de desarrollo)

1. Construye la imagen de desarrollo (incluye el wallet y variables preconfiguradas):
   ```bash
   cd MtdrSpring/backend
   docker build -f DockerfileDev -t todolistapp-dev .
   ```

2. Ejecuta el contenedor:
   ```bash
   docker run -p 8080:8080 todolistapp-dev
   ```

3. Accede en `http://localhost:8080`.

> **Precaución:** El `DockerfileDev` contiene variables de entorno con credenciales de ejemplo (`ui_password`, `dbpassword`). **No uses esta imagen en producción.** Para producción utiliza el `Dockerfile` estándar con secrets de Kubernetes.

---

## 6. Cómo construir la imagen Docker

El script `build.sh` en `MtdrSpring/backend/` automatiza la compilación Maven, la construcción de la imagen Docker y el push al Container Registry de OCI (OCIR).

### Pasos

1. Asegúrate de que la variable `DOCKER_REGISTRY` está configurada:
   ```bash
   export DOCKER_REGISTRY=mx-queretaro-1.ocir.io/<namespace>/<repositorio>
   ```
   Donde `<namespace>` es el namespace de tu tenancy OCI y `<repositorio>` es el nombre del repo en OCIR.

2. Inicia sesión en OCIR:
   ```bash
   docker login mx-queretaro-1.ocir.io
   # Usuario: <namespace-tenancy>/<tu-email>
   # Contraseña: Auth Token de OCI (no tu contraseña de cuenta)
   ```

3. Ejecuta el script de build desde `MtdrSpring/backend/`:
   ```bash
   cd MtdrSpring/backend
   source build.sh
   ```
   El script ejecuta en orden:
   - `mvn clean package spring-boot:repackage` - compila el backend y empaqueta el JAR
   - `docker build -f Dockerfile -t $IMAGE .` - construye la imagen con el JAR resultante
   - `docker push $IMAGE` - sube la imagen a OCIR
   - Elimina la imagen local tras el push exitoso

4. Verifica en la consola OCI que la imagen `todolistapp-springboot:0.1` aparece en **Container Registry**.

> **Precaución:** Si `DOCKER_REGISTRY` no está definido, el script termina con error: `DOCKER_REGISTRY env variable needs to be set!`. Asegúrate de exportarla antes de ejecutar el script.

---

## 7. Cómo ejecutar el Build Pipeline en OCI DevOps

El archivo `build_spec.yaml` en la raíz del repositorio define el pipeline completo de CI/CD. OCI DevOps lo lee automáticamente al ejecutar un Build Pipeline.

### Qué hace el pipeline (etapa por etapa)

| Etapa | Nombre | Descripción |
|---|---|---|
| 1 | Install GraalVM | Instala GraalVM Enterprise 22 para Java 22 via `yum` |
| 2 | Set PATH | Configura `JAVA_HOME=/usr/lib64/graalvm/graalvm-java22` |
| 3 | Docker Login | Descarga `deployment_config.tgz` desde OCI Object Storage (bucket `reacttodo-fpoyo`), extrae `env.sh` y autentica contra `mx-queretaro-1.ocir.io` |
| 4 | Build | Ejecuta `build.sh`: compila frontend React + backend Spring Boot, construye imagen Docker y hace push a OCIR |
| 5 | Install K8s | Descarga `kubectl` v1.31.2, configura `kubeconfig` para el cluster OKE `ocid1.cluster.oc1.mx-queretaro-1...` |
| 6 | Undeploy | Elimina el deployment anterior en Kubernetes (`undeploy.sh`) - falla silenciosa si no existe |

### Cómo ejecutar el pipeline manualmente

1. En la consola OCI, ve a **Developer Services** → **DevOps** → tu proyecto.

2. Selecciona **Build Pipelines** en el menú lateral.

3. Haz clic en el nombre del pipeline y luego en **Start Manual Run**.

4. Deja los parámetros por defecto (tomará el último commit de la rama `main`) y confirma.

5. Monitorea el progreso haciendo clic en la ejecución activa. Cada etapa muestra su estado en tiempo real; los logs completos están disponibles al expandir cada paso.

6. Al finalizar exitosamente, verifica en **Container Registry** que existe una nueva imagen con la versión correspondiente.

> **Pro-Tip:** La variable `BuildServiceDemoVersion` se exporta desde el pipeline. Si no se especifica un valor, toma automáticamente la fecha y hora actual en formato `YYYYMMDDHHmmss`. Esta versión se usa como etiqueta de la imagen Docker.

> **Precaución:** La etapa de **Docker Login** depende de que el archivo `deployment_config.tgz` exista en el bucket `reacttodo-fpoyo` de OCI Object Storage. Si este archivo no está disponible, el pipeline fallará en esa etapa con un error de acceso a Object Storage.

---

## 8. Cómo desplegar en Kubernetes (OKE)

El despliegue se realiza con el script `deploy.sh` y el manifiesto `todolistapp-springboot.yaml`. El pipeline de CI/CD ejecuta el undeploy de la versión anterior; el deploy de la nueva versión debe encadenarse como etapa adicional o ejecutarse manualmente.

### Variables de entorno requeridas para el despliegue

Antes de ejecutar `deploy.sh`, estas variables deben estar definidas:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DOCKER_REGISTRY` | URL del Container Registry OCI | `mx-queretaro-1.ocir.io/axavu6shp9jt/...` |
| `TODO_PDB_NAME` | Nombre del Pluggable Database Oracle | `mibasededatos_tp` |
| `OCI_REGION` | Región OCI del cluster | `mx-queretaro-1` |
| `UI_USERNAME` | Usuario para la interfaz web | `admin` |
| `IMAGE_VERSION` | Versión de la imagen Docker a desplegar | `20260529120000` |

### Pasos para desplegar

1. Carga las variables del entorno del proyecto:
   ```bash
   cd MtdrSpring
   source env.sh
   ```

2. Configura el acceso al cluster OKE:
   ```bash
   oci ce cluster create-kubeconfig \
     --cluster-id ocid1.cluster.oc1.mx-queretaro-1.aaaaaaaasu4y2kuzyk4edovsnnwnc4bomnm2ieg7golm5pnb2cfwxbimnucq \
     --file $HOME/.kube/config \
     --region mx-queretaro-1 \
     --token-version 2.0.0 \
     --kube-endpoint PUBLIC_ENDPOINT
   export KUBECONFIG=$HOME/.kube/config
   ```

3. Verifica que puedes acceder al cluster:
   ```bash
   kubectl get nodes
   ```
   Deben aparecer los nodos del cluster en estado `Ready`.

4. Ejecuta el script de despliegue desde `MtdrSpring/backend/`:
   ```bash
   cd MtdrSpring/backend
   source deploy.sh
   ```
   El script sustituye las variables (`%DOCKER_REGISTRY%`, `%IMAGE_VERSION%`, `%TODO_PDB_NAME%`, `%OCI_REGION%`, `%UI_USERNAME%`) en el manifiesto YAML y ejecuta `kubectl apply` en el namespace `mtdrworkshop`.

5. Verifica que los pods están corriendo:
   ```bash
   kubectl get pods -n mtdrworkshop
   kubectl get services -n mtdrworkshop
   ```
   El Deployment crea **2 réplicas** del pod `todolistapp-springboot`. Todos deben estar en estado `Running`.

6. Obtén la IP pública del Load Balancer:
   ```bash
   kubectl get service todolistapp-springboot-service -n mtdrworkshop
   ```
   La columna `EXTERNAL-IP` muestra la IP del Load Balancer de OCI. Accede a la aplicación en `http://<EXTERNAL-IP>`.

### Secrets de Kubernetes necesarios

El manifiesto de Kubernetes requiere estos secrets creados previamente en el cluster:

| Secret | Clave | Contenido |
|---|---|---|
| `dbuser` | `dbpassword` | Contraseña del usuario Oracle `TODOUSER` |
| `frontendadmin` | `password` | Contraseña de la interfaz web |
| `db-wallet-secret` | - | Archivos del wallet Oracle montados en `/mtdrworkshop/creds` |

Para crear el secret del wallet:
```bash
kubectl create secret generic db-wallet-secret \
  --from-file=/ruta/a/los/archivos/del/wallet/ \
  -n mtdrworkshop
```

> **Precaución:** Antes de ejecutar `terraform destroy` o cualquier limpieza de infraestructura, elimina manualmente el Load Balancer desde la consola OCI. Kubernetes lo crea fuera del alcance de Terraform, y si no se elimina primero, el proceso de destrucción quedará bloqueado.

---

## 9. API REST - Referencia de endpoints

La aplicación expone una API REST documentada con Swagger. La documentación interactiva está disponible en:
```
http://<host>:8080/swagger-ui/
```

### Endpoints disponibles

#### `GET /todolist`
Retorna la lista completa de tareas.

**Respuesta exitosa (200):**
```json
[
  {
    "id": 1,
    "description": "Completar el sprint",
    "createdAt": "2026-05-29T10:00:00Z",
    "done": false
  }
]
```

#### `POST /todolist`
Agrega una nueva tarea a la lista.

**Cuerpo de la petición:**
```json
{ "description": "Nueva tarea" }
```

**Respuesta:** `201 Created`

#### `GET /todolist/{itemId}`
Retorna una tarea específica por su ID.

**Parámetro:** `itemId` (entero, requerido)  
**Respuestas:** `200 OK` · `400 ID inválido` · `404 No encontrado`

#### `PUT /todolist/{itemId}`
Actualiza la descripción o el estado de completado de una tarea.

**Cuerpo de la petición:**
```json
{ "description": "Tarea actualizada", "done": true }
```

**Respuestas:** `200 OK` · `400 ID inválido` · `404 No encontrado` · `405 Error de validación`

#### `DELETE /todolist/{itemId}`
Elimina una tarea de la lista.

**Parámetro:** `itemId` (entero, requerido)  
**Respuestas:** `204 Sin contenido` · `400 ID inválido` · `404 No encontrado`

---

## 10. Errores frecuentes y soluciones

| Error | Causa probable | Solución |
|---|---|---|
| `DOCKER_REGISTRY env variable needs to be set!` | La variable no está exportada antes de ejecutar `build.sh` o `deploy.sh` | Ejecuta `export DOCKER_REGISTRY=mx-queretaro-1.ocir.io/<namespace>/...` antes del script |
| `TODO_PDB_NAME env variable needs to be set!` | Variable faltante en `deploy.sh` | Ejecuta `source env.sh` desde `MtdrSpring/` antes del deploy |
| Pipeline falla en la etapa "Docker Login" | El archivo `deployment_config.tgz` no existe en el bucket `reacttodo-fpoyo` | Verifica que el archivo existe en OCI Object Storage y que el pipeline tiene permisos de lectura |
| Pods en estado `ImagePullBackOff` | OKE no tiene permisos para leer OCIR | Crea un `imagePullSecret` con las credenciales de OCIR y referencíalo en el deployment |
| `./mvnw spring-boot:run` falla con error de conexión a DB | El wallet no está en `MtdrSpring/backend/wallet/` o las variables de DB son incorrectas | Verifica que el wallet esté copiado y que `application.properties` tenga los valores correctos |
| `kubectl get nodes` retorna error de autenticación | El kubeconfig no está configurado o expiró el token | Re-ejecuta el comando `oci ce cluster create-kubeconfig ...` para renovar la configuración |
| El Load Balancer no tiene EXTERNAL-IP después de varios minutos | OCI está aprovisionando el Load Balancer (proceso normal de 2-5 minutos) | Espera y vuelve a ejecutar `kubectl get service` |
| `terraform destroy` queda bloqueado | El Load Balancer creado por Kubernetes no es gestionado por Terraform | Elimina el LB manualmente desde la consola OCI → Networking → Load Balancers, luego reintenta |
| Error `wallet not found` en el contenedor | El secret `db-wallet-secret` no existe en el namespace `mtdrworkshop` | Crea el secret con `kubectl create secret generic db-wallet-secret --from-file=...` |

---

## 11. Glosario

| Término | Definición |
|---|---|
| **OCI** | Oracle Cloud Infrastructure. Plataforma de servicios en la nube de Oracle. |
| **OKE** | Oracle Container Engine for Kubernetes. Servicio administrado de Kubernetes en OCI. |
| **OCIR** | OCI Container Registry. Registro privado de imágenes Docker en OCI (equivalente a Docker Hub). |
| **ATP** | Autonomous Transaction Processing. Tipo de base de datos Oracle Autonomous en la nube. |
| **Wallet** | Conjunto de archivos de configuración y certificados TLS necesarios para conectarse de forma segura a Oracle ATP. Incluye `tnsnames.ora`, `cwallet.sso`, entre otros. |
| **build_spec.yaml** | Archivo en la raíz del repositorio que define las etapas y comandos del Build Pipeline de OCI DevOps. |
| **GraalVM Enterprise** | JDK alternativo de Oracle con optimizaciones de rendimiento. Este proyecto usa la versión 22 para compilar el backend Java. |
| **mvnw** | Maven Wrapper. Script incluido en el repositorio que descarga y ejecuta la versión correcta de Maven sin necesidad de instalarlo manualmente. |
| **Build Pipeline** | Secuencia de pasos automatizados en OCI DevOps que compila el código, construye la imagen Docker y la publica en OCIR. |
| **Namespace `mtdrworkshop`** | Espacio de nombres de Kubernetes donde se despliegan todos los recursos de esta aplicación. |
| **deployment_config.tgz** | Archivo comprimido almacenado en OCI Object Storage que contiene `env.sh` y `at.cfg` (token de autenticación para OCIR), descargado por el pipeline durante la etapa de Docker Login. |
| **env.sh** | Script de shell que exporta todas las variables de entorno del proyecto (DOCKER_REGISTRY, TODO_PDB_NAME, OCI_REGION, etc.). Debe ejecutarse con `source env.sh`. |
| **TODOUSER** | Usuario de Oracle DB configurado en el Kubernetes Deployment para acceder a la tabla `todoitem`. |
| **Secret de Kubernetes** | Recurso de Kubernetes que almacena datos sensibles (contraseñas, certificados) de forma codificada. Este proyecto usa `dbuser`, `frontendadmin` y `db-wallet-secret`. |
| **LoadBalancer** | Tipo de Service de Kubernetes que aprovisiona automáticamente un Load Balancer de OCI para exponer la aplicación a internet en el puerto 80. |
| **AiPlanner** | Funcionalidad de la aplicación que usa los modelos Gemini y DeepSeek para generar y planificar tareas automáticamente desde la interfaz web. |
| **CI/CD** | Integración Continua y Entrega Continua. Práctica de automatizar la compilación, prueba y despliegue de software en cada cambio de código. |

---

> **Licencia:** Universal Permissive License (UPL) v1.0 - Oracle and/or its affiliates.  
> **Repositorio:** [github.com/goliat2020/oci_devops_project](https://github.com/goliat2020/oci_devops_project)  
> **¿Encontraste un error en esta guía?** Abre un issue en el repositorio o contacta al equipo del sprint.