package com.springboot.MyTodoList.repository;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.springboot.MyTodoList.model.TaskSearchResult;

/**
 * Repository for Oracle 26ai VECTOR operations.
 * Uses JdbcTemplate with TO_VECTOR() so no ojdbc-specific types are needed.
 *
 * Prerequisite DDL (run once after 26ai upgrade):
 *   ALTER TABLE TAREA        ADD EMBEDDING VECTOR(768, FLOAT32);
 *   ALTER TABLE PROYECTO     ADD EMBEDDING VECTOR(768, FLOAT32);
 *   ALTER TABLE SPRINT       ADD EMBEDDING VECTOR(768, FLOAT32);
 *   CREATE VECTOR INDEX idx_vec_tarea   ON TAREA(EMBEDDING)   ORGANIZATION NEIGHBOR PARTITIONS WITH DISTANCE COSINE;
 *   CREATE VECTOR INDEX idx_vec_proy    ON PROYECTO(EMBEDDING) ORGANIZATION NEIGHBOR PARTITIONS WITH DISTANCE COSINE;
 */
@Repository
public class VectorSearchRepository {

    private final JdbcTemplate jdbc;

    public VectorSearchRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ─────────────────────────────────────────────
    // SIMILARITY SEARCH
    // ─────────────────────────────────────────────

    /**
     * Finds the 5 most semantically similar unassigned, non-finished tasks
     * in the given sprint using cosine distance.
     *
     * @param vectorString Oracle-formatted vector string "[0.1,0.2,...]"
     * @param sprintId     Active sprint to filter by
     */
    public List<TaskSearchResult> findSimilarTasks(String vectorString, Integer sprintId) {
        String sql = "SELECT t.ID_TAREA, t.TITULO, t.DESCRIPCION, t.PRIORIDAD, " +
                     "t.ESTIMACION_HORAS, e.NOMBRE AS ESTADO, " +
                     "VECTOR_DISTANCE(t.EMBEDDING, TO_VECTOR(CAST(? AS VARCHAR2(32767))), COSINE) AS SIMILITUD " +
                     "FROM TAREA t " +
                     "JOIN ESTADO_TAREA e ON e.ID_ESTADO = t.ID_ESTADO " +
                     "WHERE t.ID_SPRINT = ? " +
                     "AND t.EMBEDDING IS NOT NULL " +
                     "AND e.ES_FINAL = 0 " +
                     "ORDER BY SIMILITUD ASC " +
                     "FETCH FIRST 5 ROWS ONLY";

        return jdbc.query(sql, (rs, rowNum) -> {
            TaskSearchResult r = new TaskSearchResult();
            r.setIdTarea(rs.getInt("ID_TAREA"));
            r.setTitulo(rs.getString("TITULO"));
            r.setDescripcion(rs.getString("DESCRIPCION"));
            r.setPrioridad(rs.getString("PRIORIDAD"));
            r.setEstimacionHoras(rs.getDouble("ESTIMACION_HORAS"));
            r.setEstado(rs.getString("ESTADO"));
            r.setSimilitud(rs.getDouble("SIMILITUD"));
            return r;
        }, vectorString, sprintId);
    }

    // ─────────────────────────────────────────────
    // EMBEDDING UPDATES (called after INSERT/UPDATE)
    // ─────────────────────────────────────────────

    public void updateTareaEmbedding(Integer idTarea, String vectorString) {
        jdbc.update("UPDATE TAREA SET EMBEDDING = TO_VECTOR(CAST(? AS VARCHAR2(32767))) WHERE ID_TAREA = ?",
                vectorString, idTarea);
    }

    public void updateProyectoEmbedding(Integer idProyecto, String vectorString) {
        jdbc.update("UPDATE PROYECTO SET EMBEDDING = TO_VECTOR(CAST(? AS VARCHAR2(32767))) WHERE ID_PROYECTO = ?",
                vectorString, idProyecto);
    }

    public void updateSprintEmbedding(Integer idSprint, String vectorString) {
        jdbc.update("UPDATE SPRINT SET EMBEDDING = TO_VECTOR(CAST(? AS VARCHAR2(32767))) WHERE ID_SPRINT = ?",
                vectorString, idSprint);
    }

    // ─────────────────────────────────────────────
    // INGESTION HELPERS (used by EmbeddingIngestionService)
    // ─────────────────────────────────────────────

    public List<Map<String, Object>> findTareasWithoutEmbedding() {
        return jdbc.queryForList(
                "SELECT ID_TAREA, TITULO, DESCRIPCION, PRIORIDAD FROM TAREA WHERE EMBEDDING IS NULL");
    }

    public List<Map<String, Object>> findProyectosWithoutEmbedding() {
        return jdbc.queryForList(
                "SELECT ID_PROYECTO, NOMBRE, DESCRIPCION FROM PROYECTO WHERE EMBEDDING IS NULL");
    }

    public List<Map<String, Object>> findSprintsWithoutEmbedding() {
        return jdbc.queryForList(
                "SELECT ID_SPRINT, NOMBRE, OBJETIVO FROM SPRINT WHERE EMBEDDING IS NULL");
    }
}