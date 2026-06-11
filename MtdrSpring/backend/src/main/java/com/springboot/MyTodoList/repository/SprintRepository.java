package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Integer> {
    List<Sprint> findAllByOrderByIdSprintDesc();

    @Query("SELECT MAX(s.idSprint) FROM Sprint s")
    Optional<Integer> findMaxId();
}
