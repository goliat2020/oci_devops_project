package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Rol;
import com.springboot.MyTodoList.model.Usuario;
import com.springboot.MyTodoList.model.dto.AuthResponse;
import com.springboot.MyTodoList.model.dto.LoginRequest;
import com.springboot.MyTodoList.model.dto.RegisterRequest;
import com.springboot.MyTodoList.repository.RolRepository;
import com.springboot.MyTodoList.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final String SESSION_ATTR_USER_ID = "AUTH_USER_ID";
    private static final String SESSION_ATTR_EMAIL = "AUTH_EMAIL";
    private static final String GENERIC_ERROR = "Credenciales inv\u00e1lidas. Verifica tus datos.";
    private static final int DEFAULT_ROL_ID = 1;

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                return new AuthResponse(false, "El correo es obligatorio.");
            }
            if (request.getPassword() == null || request.getPassword().length() < 8) {
                return new AuthResponse(false, "La contrase\u00f1a debe tener al menos 8 caracteres.");
            }
            if (request.getNombre() == null || request.getNombre().isBlank()) {
                return new AuthResponse(false, "El nombre es obligatorio.");
            }

            if (usuarioRepository.existsByEmail(request.getEmail())) {
                return new AuthResponse(false, "No se pudo completar el registro. Verifica los datos ingresados.");
            }

            Optional<Integer> maxId = usuarioRepository.findMaxId();
            int newId = maxId.map(i -> i + 1).orElse(1);

            Rol defaultRol = rolRepository.findById(DEFAULT_ROL_ID)
                    .orElseGet(() -> {
                        Rol rol = new Rol();
                        rol.setIdRol(DEFAULT_ROL_ID);
                        rol.setNombre("Usuario");
                        rol.setDescripcion("Usuario est\u00e1ndar");
                        return rolRepository.save(rol);
                    });

            Usuario usuario = new Usuario();
            usuario.setIdUsuario(newId);
            usuario.setNombre(request.getNombre());
            usuario.setEmail(request.getEmail());
            usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            usuario.setActivo(1);
            usuario.setFechaIngreso(LocalDate.now());
            usuario.setRol(defaultRol);

            usuarioRepository.save(usuario);

            logger.info("Nuevo usuario registrado: id={}", newId);
            return new AuthResponse(true, "Registro exitoso.");
        } catch (Exception e) {
            logger.error("Error en registro", e);
            return new AuthResponse(false, "Error al registrar. Intenta m\u00e1s tarde.");
        }
    }

    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return new AuthResponse(false, GENERIC_ERROR);
        }

        Optional<Usuario> optUsuario = usuarioRepository.findByEmail(request.getEmail());
        if (optUsuario.isEmpty()) {
            return new AuthResponse(false, GENERIC_ERROR);
        }

        Usuario usuario = optUsuario.get();

        if (usuario.getActivo() != null && usuario.getActivo() == 0) {
            return new AuthResponse(false, GENERIC_ERROR);
        }

        if (usuario.getPasswordHash() == null) {
            return new AuthResponse(false, GENERIC_ERROR);
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPasswordHash())) {
            return new AuthResponse(false, GENERIC_ERROR);
        }

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(SESSION_ATTR_USER_ID, usuario.getIdUsuario());
        session.setAttribute(SESSION_ATTR_EMAIL, usuario.getEmail());
        session.setMaxInactiveInterval(30 * 60);

        String rolNombre = usuario.getRol() != null ? usuario.getRol().getNombre() : "SIN_ROL";

        logger.info("Login exitoso: email={}", usuario.getEmail());

        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                usuario.getIdUsuario(),
                usuario.getNombre(),
                usuario.getEmail(),
                rolNombre
        );
        return new AuthResponse(true, "Login exitoso.", userInfo);
    }

    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
            logger.info("Sesi\u00f3n cerrada");
        }
    }

    public AuthResponse getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return new AuthResponse(false, "No hay sesi\u00f3n activa.");
        }

        Integer userId = (Integer) session.getAttribute(SESSION_ATTR_USER_ID);
        if (userId == null) {
            return new AuthResponse(false, "No hay sesi\u00f3n activa.");
        }

        Optional<Usuario> optUsuario = usuarioRepository.findById(userId);
        if (optUsuario.isEmpty()) {
            session.invalidate();
            return new AuthResponse(false, "Sesi\u00f3n inv\u00e1lida.");
        }

        Usuario usuario = optUsuario.get();
        String rolNombre = usuario.getRol() != null ? usuario.getRol().getNombre() : "SIN_ROL";

        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                usuario.getIdUsuario(),
                usuario.getNombre(),
                usuario.getEmail(),
                rolNombre
        );
        return new AuthResponse(true, "Sesi\u00f3n activa.", userInfo);
    }
}
