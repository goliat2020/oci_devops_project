(The file `c:\Users\braul\Dev\Tec\6th Semester\Reto\oci_devops_project\README.md` exists, but is empty)
# OCI DevOps Project — MyTodoList

Este repositorio contiene una aplicación full-stack (Spring Boot backend + React frontend) diseñada para gestionar una lista de tareas y mostrar KPIs. Este README explica cómo configurar y ejecutar el backend localmente, tanto con la base de datos Oracle (como en producción) como con una alternativa H2 para desarrollo, además de cómo conectar el frontend (modo mock y modo real).

## Estructura relevante

- `MtdrSpring/backend` — proyecto Spring Boot (API REST, JPA, servicios, controladores)
- `MtdrSpring/backend/src/main/frontend` — aplicación React (CRA) usada como frontend

## Requisitos previos

- Java 17+ (o la versión requerida por el `pom.xml`)
- Maven (o usa el wrapper `mvnw.cmd` incluido)
- Node.js + npm (para la carpeta `src/main/frontend`)
- Si vas a usar Oracle como en producción: credenciales / wallet y acceso a la base de datos

## Configurar y ejecutar el backend (Oracle)

1. Abre `MtdrSpring/backend/src/main/resources/application.properties`. Por defecto el proyecto puede estar configurado para usar un wallet de Oracle; asegúrate de proveer la configuración correcta para tu entorno. Ejemplos de propiedades (devuelve tus valores reales):

```properties
spring.datasource.url=jdbc:oracle:thin:@<HOST>:<PORT>/<SERVICE>
spring.datasource.username=your_db_user
spring.datasource.password=your_db_password
# si usas TNS/WALLET, configura TNS_ADMIN en el sistema o en variables de entorno
```

2. (Opcional) Si usas Wallet/TNS, ajusta `TNS_ADMIN` en el sistema o exporta la variable antes de ejecutar la app.

3. Ejecuta la aplicación Spring Boot desde PowerShell (desde la carpeta `MtdrSpring/backend`):

```powershell
cd "c:\Users\braul\Dev\Tec\6th Semester\Reto\oci_devops_project\MtdrSpring\backend"
.\mvnw.cmd spring-boot:run
```

4. Revisa la salida en la consola. Si la aplicación arranca correctamente escuchará en el puerto configurado (por defecto 8080). Si hay errores de conexión a la BD revisa las credenciales y la accesibilidad de la base.

### Nota sobre credenciales y seguridad
No publiques tus credenciales ni el wallet en el repositorio. Usa variables de entorno o un archivo `application-local.properties` excluido del control de versiones para datos sensibles.

## Ejecutar el backend en modo desarrollo sin Oracle (H2)

Si no tienes Oracle disponible, puedes probar la API con una base en memoria H2 para desarrollo. Hay dos opciones:

- A) Cambiar `application.properties` temporalmente para usar H2 (recomendado crear un perfil `local`).
- B) Yo puedo añadir un perfil `local` y las dependencias necesarias; dime si quieres que lo haga y lo incluyo.

Ejemplo rápido (cambios manuales mínimos):

1. Añade la dependencia H2 al `pom.xml` (solo para desarrollo):

```xml
<!-- agregar en la sección <dependencies> -->
<dependency>
	<groupId>com.h2database</groupId>
	<artifactId>h2</artifactId>
	<scope>runtime</scope>
</dependency>
```

2. Añade (temporalmente) en `application.properties`:

```properties
spring.datasource.url=jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update
```

3. Ejecuta la app con `.
mvnw.cmd spring-boot:run` como se muestra arriba.

Si quieres, puedo crear un perfil `local` y agregar estos cambios de forma segura (con instrucciones para activarlo con `-Dspring.profiles.active=local`).

## Habilitar CORS (desarrollo)

Si ejecutas frontend en `localhost:3000`/`3001` y backend en `localhost:8080`, debes permitir CORS para que el navegador permita llamadas cross-origin.

Opciones rápidas:

- Añadir una anotación `@CrossOrigin` en el controlador durante dev: por ejemplo en `ToDoItemController`:

```java
@RestController
@CrossOrigin(origins = "http://localhost:3001") // o "*" solo para desarrollo
public class ToDoItemController {
		// ...
}
```

- O crear una configuración global `WebMvcConfigurer` para habilitar CORS para entornos de desarrollo.

La app ya expone el header `location` (Access-Control-Expose-Headers) en la respuesta POST para que el frontend pueda leer el id creado.

## Ejecutar el frontend

1. Ve a la carpeta del frontend:

```powershell
cd "c:\Users\braul\Dev\Tec\6th Semester\Reto\oci_devops_project\MtdrSpring\backend\src\main\frontend"
```

2. Instala dependencias (si no lo has hecho):

```powershell
npm install
```

3. Modo mock local (no necesita backend):

```powershell
npm run start:mock
```

Esto arranca la app en el puerto 3001 con datos en memoria (REACT_APP_USE_MOCK=true). Útil para desarrollo UI.

4. Modo real (con backend corriendo en `localhost:8080` y CORS habilitado):

```powershell
npm start
```

Si el backend corre en un host/puerto distinto, habilita CORS o configura un `proxy` en el `package.json` del frontend.

## Cómo cambiar entre mock y backend real

- Mock: usa `npm run start:mock` (REACT_APP_USE_MOCK=true). La UI usará datos en memoria y no tocará tu backend.
- Real: `npm start` (o eliminar la variable REACT_APP_USE_MOCK). La app hará llamadas a `/todolist` (mismo host que sirve la app) o al host configurado por CORS/proxy.

## Ejemplo de payload y prueba rápida (curl)

Payload de ejemplo que coincide con la entidad `ToDoItem` en el backend:

```json
{
	"titulo": "Revisar PR #42",
	"descripcion": "Revisar cambios y dejar comentarios",
	"prioridad": "MEDIUM",
	"estimacionHoras": 4,
	"horasReales": 0,
	"idUsuario": 2,
	"idSprint": 1
}
```

Prueba con curl (desde PowerShell) cuando el backend está corriendo en `localhost:8080`:

```powershell
curl -X POST "http://localhost:8080/todolist" -H "Content-Type: application/json" -d '{"titulo":"PR test","descripcion":"curl test","prioridad":"LOW","estimacionHoras":1}' -i
```

La respuesta HTTP incluirá un header `location` con el ID creado si todo va bien.

## Problemas comunes y soluciones rápidas

- Error de conexión a la base de datos: revisa `spring.datasource.*` en `application.properties` y que la DB sea accesible desde tu máquina.
- CORS bloqueando peticiones: añade `@CrossOrigin` o una configuración global en el backend para permitir `http://localhost:3001`.
- Frontend muestra un id vacío tras POST: asegúrate de que el backend devuelve el header `location` (el controlador ya lo hace) y que CORS expone ese header.

## Siguientes pasos opcionales (puedo hacerlo por ti)

- Añadir un perfil `local` con H2 para ejecutar el backend sin Oracle.
- Añadir una configuración CORS global (WebMvcConfigurer) para desarrollo.
- Hacer que el frontend recupere la lista real de usuarios y sprints desde endpoints REST (si existen) en vez de usar selectores mock.

Si quieres que implemente automáticamente cualquiera de las opciones anteriores (perfil H2 o CORS global), dime cuál prefieres y lo preparo y pruebo localmente.

---

Fecha: 2026-04-17
