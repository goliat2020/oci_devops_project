package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Usuario;
import com.springboot.MyTodoList.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Map<String, Object>> getAllUsuarios() {
        return usuarioRepository.findAll().stream()
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getIdUsuario());
                    map.put("nombre", u.getNombre());
                    map.put("email", u.getEmail());
                    map.put("activo", u.getActivo());
                    return map;
                })
                .collect(Collectors.toList());
    }
}
