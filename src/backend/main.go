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
	if err := DatabaseOpen(&config); err != nil {
		panic(err)
	}
	defer DatabaseClose()
	log.Println("Starting backend.")
	// start http
	if err := HTTPStart(&config); err != nil {
		panic(err)
	}
}
