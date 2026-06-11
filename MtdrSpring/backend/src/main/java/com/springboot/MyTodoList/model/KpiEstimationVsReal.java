package com.springboot.MyTodoList.model;

public class KpiEstimationVsReal {
    private Integer sprintId;
    private String sprintNombre;
    private Double horasEstimadas;
    private Double horasReales;
    private Double ratioEficiencia;

    public KpiEstimationVsReal() {}

    public KpiEstimationVsReal(Integer sprintId, String sprintNombre, Double horasEstimadas, Double horasReales, Double ratioEficiencia) {
        this.sprintId = sprintId;
        this.sprintNombre = sprintNombre;
        this.horasEstimadas = horasEstimadas;
        this.horasReales = horasReales;
        this.ratioEficiencia = ratioEficiencia;
    }

    public Integer getSprintId() { return sprintId; }
    public void setSprintId(Integer sprintId) { this.sprintId = sprintId; }

    public String getSprintNombre() { return sprintNombre; }
    public void setSprintNombre(String sprintNombre) { this.sprintNombre = sprintNombre; }

    public Double getHorasEstimadas() { return horasEstimadas; }
    public void setHorasEstimadas(Double horasEstimadas) { this.horasEstimadas = horasEstimadas; }

    public Double getHorasReales() { return horasReales; }
    public void setHorasReales(Double horasReales) { this.horasReales = horasReales; }

    public Double getRatioEficiencia() { return ratioEficiencia; }
    public void setRatioEficiencia(Double ratioEficiencia) { this.ratioEficiencia = ratioEficiencia; }
}
