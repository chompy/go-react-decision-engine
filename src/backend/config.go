package main

import (
	"io/ioutil"

	"gopkg.in/yaml.v2"
)

const configPath = "../../config.yaml"

type Config struct {
	DatabaseURI    string `yaml:"database_uri"`
	DatabaseName   string `yaml:"database_name"`
	HTTPPort       int    `yaml:"http_port"`
	HTTPSessionKey string `yaml:"http_session_key"`
}

func LoadConfig() (Config, error) {
	rawData, err := ioutil.ReadFile(configPath)
	if err != nil {
		return Config{}, err
	}
	out := Config{}
	if err := yaml.Unmarshal(rawData, &out); err != nil {
		return out, err
	}
	return out, nil
}
