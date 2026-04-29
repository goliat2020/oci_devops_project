package com.springboot.MyTodoList.controller;
import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ToDoItemController {
    @Autowired
    private ToDoItemService toDoItemService;

    @Autowired
    private ObjectMapper objectMapper;
    //@CrossOrigin
    @GetMapping(value = "/todolist")
    public List<ToDoItem> getAllToDoItems(){
        return toDoItemService.findAll();
    }

    @GetMapping(value = "/tasks")
    public List<ToDoItem> getAllTasks(){
        return toDoItemService.findAll();
    }
    //@CrossOrigin
    @GetMapping(value = "/todolist/{id}")
    public ResponseEntity<ToDoItem> getToDoItemById(@PathVariable int id){
        try{
            ResponseEntity<ToDoItem> responseEntity = toDoItemService.getItemById(id);
            return new ResponseEntity<ToDoItem>(responseEntity.getBody(), HttpStatus.OK);
        }catch (Exception e){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping(value = "/tasks/{id}")
    public ResponseEntity<ToDoItem> getTaskById(@PathVariable int id){
        return getToDoItemById(id);
    }
    //@CrossOrigin
    @PostMapping(value = "/todolist")
    public ResponseEntity<ToDoItem> addToDoItem(@RequestBody String rawBody) throws Exception{
        // Workaround: some environments are failing to bind @RequestBody ToDoItem and return 415.
        // Parse JSON manually to restore POST support.
        ToDoItem todoItem = objectMapper.readValue(rawBody, ToDoItem.class);
        ToDoItem td = toDoItemService.addToDoItem(todoItem);
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("location",""+td.getID());
        responseHeaders.set("Access-Control-Expose-Headers","location");
        //URI location = URI.create(""+td.getID())

        return ResponseEntity.ok()
                .headers(responseHeaders).build();
    }

    @PostMapping(value = "/tasks")
    public ResponseEntity<ToDoItem> addTask(@RequestBody String rawBody) throws Exception{
        return addToDoItem(rawBody);
    }
    //@CrossOrigin
    @PutMapping(value = "todolist/{id}")
    public ResponseEntity<ToDoItem> updateToDoItem(@RequestBody ToDoItem toDoItem, @PathVariable int id){
        try{
            ToDoItem toDoItem1 = toDoItemService.updateToDoItem(id, toDoItem);
            System.out.println(toDoItem1.toString());
            return new ResponseEntity<>(toDoItem1,HttpStatus.OK);
        }catch (Exception e){
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping(value = "tasks/{id}")
    public ResponseEntity<ToDoItem> updateTask(@RequestBody ToDoItem toDoItem, @PathVariable int id){
        return updateToDoItem(toDoItem, id);
    }
    //@CrossOrigin
    @DeleteMapping(value = "todolist/{id}")
    public ResponseEntity<Boolean> deleteToDoItem(@PathVariable("id") int id){
        Boolean flag = false;
        try{
            flag = toDoItemService.deleteToDoItem(id);
            return new ResponseEntity<>(flag, HttpStatus.OK);
        }catch (Exception e){
            return new ResponseEntity<>(flag,HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping(value = "tasks/{id}")
    public ResponseEntity<Boolean> deleteTask(@PathVariable("id") int id){
        return deleteToDoItem(id);
    }



}
