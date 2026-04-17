package com.springboot.MyTodoList.repository;


import com.springboot.MyTodoList.model.ToDoItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.transaction.Transactional;

import java.util.List;

@Repository
@Transactional
@EnableTransactionManagement
public interface ToDoItemRepository extends JpaRepository<ToDoItem,Integer> {

		List<ToDoItem> findAllByOrderByIDDesc();

		    @Query(value = "SELECT " +
			    "t.ID_SPRINT AS sprintId, " +
			    "s.NOMBRE AS sprintNombre, " +
			    "t.ID_USUARIO AS userId, " +
			    "u.NOMBRE AS userNombre, " +
			    "COUNT(*) AS totalValue " +
			    "FROM TAREA t " +
			    "JOIN ESTADO_TAREA et ON et.ID_ESTADO = t.ID_ESTADO " +
			    "LEFT JOIN USUARIO u ON u.ID_USUARIO = t.ID_USUARIO " +
			    "LEFT JOIN SPRINT s ON s.ID_SPRINT = t.ID_SPRINT " +
				"WHERE et.ES_FINAL = 1 " +
				"AND t.ID_PROYECTO = 1 " +
			    "AND (:sprintId IS NULL OR t.ID_SPRINT = :sprintId) " +
			    "GROUP BY t.ID_SPRINT, s.NOMBRE, t.ID_USUARIO, u.NOMBRE " +
			    "ORDER BY t.ID_SPRINT, u.NOMBRE", nativeQuery = true)
		List<KpiPointProjection> findTasksCompletedByUserAndSprint(@Param("sprintId") Integer sprintId);

		    @Query(value = "SELECT " +
			    "t.ID_SPRINT AS sprintId, " +
			    "s.NOMBRE AS sprintNombre, " +
			    "t.ID_USUARIO AS userId, " +
			    "u.NOMBRE AS userNombre, " +
			    "NVL(SUM(t.HORAS_REALES), 0) AS totalValue " +
			    "FROM TAREA t " +
			    "LEFT JOIN USUARIO u ON u.ID_USUARIO = t.ID_USUARIO " +
			    "LEFT JOIN SPRINT s ON s.ID_SPRINT = t.ID_SPRINT " +
				    "WHERE t.ID_PROYECTO = 1 " +
				    "AND (:sprintId IS NULL OR t.ID_SPRINT = :sprintId) " +
			    "GROUP BY t.ID_SPRINT, s.NOMBRE, t.ID_USUARIO, u.NOMBRE " +
			    "ORDER BY t.ID_SPRINT, u.NOMBRE", nativeQuery = true)
		List<KpiPointProjection> findRealHoursByUserAndSprint(@Param("sprintId") Integer sprintId);


}
