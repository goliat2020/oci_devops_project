package com.springboot.MyTodoList.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Catch-all controller for Single Page Application (SPA)
 * Forwards all non-API requests to index.html so React Router can handle them
 */
@Controller
public class FrontendController {

    @RequestMapping(value = "/{path:^(?!api|swagger|actuator).*}")
    public String forward() {
        return "forward:/index.html";
    }
}
