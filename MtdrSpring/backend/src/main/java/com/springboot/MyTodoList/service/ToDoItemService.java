package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.repository.ToDoItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ToDoItemService {

    private static final int ESTADO_TODO = 1;
    private static final int DEFAULT_PROJECT_ID = 1;

    @Autowired
    private ToDoItemRepository toDoItemRepository;

    public List<ToDoItem> findAll(){
        List<ToDoItem> todoItems = toDoItemRepository.findAllByOrderByIDDesc();
        return todoItems;
    }

    public ResponseEntity<ToDoItem> getItemById(int id){
        Optional<ToDoItem> todoData = toDoItemRepository.findById(id);
        if (todoData.isPresent()){
            return new ResponseEntity<>(todoData.get(), HttpStatus.OK);
        }else{
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    public ToDoItem getToDoItemById(int id){
        Optional<ToDoItem> todoData = toDoItemRepository.findById(id);
        if (todoData.isPresent()){
            return todoData.get();
        }else{
            return null;
        }
    }

    
    public ToDoItem addToDoItem(ToDoItem toDoItem){
        prepareTaskDefaults(toDoItem);
        if (toDoItem.getID() == null) {
            toDoItem.setID(nextTaskId());
        }
        return toDoItemRepository.save(toDoItem);
    }

    public boolean deleteToDoItem(int id){
        try{
            toDoItemRepository.deleteById(id);
            return true;
        }catch(Exception e){
            return false;
        }
    }
    public ToDoItem updateToDoItem(int id, ToDoItem td){
        Optional<ToDoItem> toDoItemData = toDoItemRepository.findById(id);
        if(toDoItemData.isPresent()){
            ToDoItem toDoItem = toDoItemData.get();
            toDoItem.setID(id);
            mergeTask(toDoItem, td);
            prepareTaskDefaults(toDoItem);
            return toDoItemRepository.save(toDoItem);
        }else{
            return null;
        }
    }

    private void prepareTaskDefaults(ToDoItem task) {
        if ((task.getTitulo() == null || task.getTitulo().isBlank()) && task.getDescription() != null) {
            task.setTitulo(task.getDescription());
        }
        if (task.getCreation_ts() == null) {
            task.setCreation_ts(LocalDate.now());
        }
        // Current product scope uses a single project only.
        task.setIdProyecto(DEFAULT_PROJECT_ID);
        if (task.getIdEstado() == null) {
            task.setIdEstado(ESTADO_TODO);
        }
        task.resetDoneProvided();
    }

    private void mergeTask(ToDoItem current, ToDoItem incoming) {
        if (incoming.getTitulo() != null && !incoming.getTitulo().isBlank()) {
            current.setTitulo(incoming.getTitulo());
        }
        if (incoming.getDescripcion() != null && !incoming.getDescripcion().isBlank()) {
            current.setDescripcion(incoming.getDescripcion());
        }
        if (incoming.getDescription() != null && !incoming.getDescription().isBlank()) {
            current.setDescription(incoming.getDescription());
        }
        if (incoming.getCreation_ts() != null) {
            current.setCreation_ts(incoming.getCreation_ts());
        }
        if (incoming.getFechaFinEstimada() != null) {
            current.setFechaFinEstimada(incoming.getFechaFinEstimada());
        }
        if (incoming.getFechaFinReal() != null) {
            current.setFechaFinReal(incoming.getFechaFinReal());
        }
        if (incoming.getEstimacionHoras() != null) {
            current.setEstimacionHoras(incoming.getEstimacionHoras());
        }
        if (incoming.getHorasReales() != null) {
            current.setHorasReales(incoming.getHorasReales());
        }
        if (incoming.getPrioridad() != null && !incoming.getPrioridad().isBlank()) {
            current.setPrioridad(incoming.getPrioridad());
        }
        if (incoming.getIdUsuario() != null) {
            current.setIdUsuario(incoming.getIdUsuario());
        }
        if (incoming.getIdEstado() != null) {
            current.setIdEstado(incoming.getIdEstado());
        }
        // ID_PROYECTO is fixed to DEFAULT_PROJECT_ID in this stage.
        current.setIdProyecto(DEFAULT_PROJECT_ID);
        if (incoming.getIdSprint() != null) {
            current.setIdSprint(incoming.getIdSprint());
        }
        if (incoming.isDoneProvided()) {
            current.setDone(incoming.isDone());
        }
    }

    private int nextTaskId() {
        List<ToDoItem> tasks = toDoItemRepository.findAllByOrderByIDDesc();
        if (tasks == null || tasks.isEmpty() || tasks.get(0).getID() == null) {
            return 1;
        }
        return tasks.get(0).getID() + 1;
    }

}
