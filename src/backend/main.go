package main

import (
	"log"
)

func main() {
	// load config
	log.Println("Load config.")
	config, err := ConfigLoad()
	if err != nil {
		panic(err)
	}
	// open database
	log.Println("Open database.")
	if err := databaseOpen(&config); err != nil {
		panic(err)
	}
	defer databaseClose()
	log.Println("Starting backend.")
	// start http
	if err := HTTPStart(&config); err != nil {
		panic(err)
	}
}
