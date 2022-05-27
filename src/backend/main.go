package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type spaHandler struct {
	staticPath string
	indexPath  string
}

func usernameHandler(w http.ResponseWriter, r *http.Request) {
	type User struct {
		Username string `json:"username"`
	}
	user := User{os.Getenv("USERNAME")}
	p, _ := json.Marshal(user)
	w.Write(p)
}

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
