package com.springboot.MyTodoList.model;

import jakarta.persistence.*;

@Entity
@Table(name = "APP_CONFIG")
public class AppConfig {

    @Id
    @Column(name = "CONFIG_KEY", length = 100)
    private String configKey;

    @Column(name = "CONFIG_VALUE", length = 500)
    private String configValue;

    public AppConfig() {}

    public AppConfig(String configKey, String configValue) {
        this.configKey = configKey;
        this.configValue = configValue;
    }

    public String getConfigKey() { return configKey; }
    public void setConfigKey(String configKey) { this.configKey = configKey; }

    public String getConfigValue() { return configValue; }
    public void setConfigValue(String configValue) { this.configValue = configValue; }
}
