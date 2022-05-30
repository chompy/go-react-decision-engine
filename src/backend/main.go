package main

import (
	"log"
)

func main() {
	// load config
	log.Println("Load config.")
	config, err := LoadConfig()
	if err != nil {
		panic(err)
	}
	// open database
	log.Println("Open database.")
	if err := OpenDatabase(&config); err != nil {
		panic(err)
	}
	defer CloseDatabase()
	log.Println("Starting Backend")
	// start http
	if err := HTTPStart(&config); err != nil {
		panic(err)
	}
}
