package main

import (
	"os"

	psh "github.com/platformsh/config-reader-go/v2"
	mongoPsh "github.com/platformsh/config-reader-go/v2/mongo"

	"gopkg.in/yaml.v2"
)

const configPath = "../../config.yaml"

type Config struct {
	DatabaseURI  string `yaml:"database_uri"`
	DatabaseName string `yaml:"database_name"`
	HTTPPort     int    `yaml:"http_port"`
}

func ConfigLoad() (Config, error) {
	rawData, err := os.ReadFile(configPath)
	if err != nil {
		return Config{}, err
	}
	out := Config{}
	if err := yaml.Unmarshal(rawData, &out); err != nil {
		return out, err
	}
	// platform.sh configurations
	pshConfig, err := psh.NewRuntimeConfig()
	if err == nil {
		mongoCreds, err := pshConfig.Credentials("database")
		if err != nil {
			return out, err
		}
		out.DatabaseURI, err = mongoPsh.FormattedCredentials(mongoCreds)
		if err != nil {
			return out, err
		}
	}
	return out, nil
}
