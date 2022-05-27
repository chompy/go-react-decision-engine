package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
)

type HTTPMessage struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

type HTTPUserLoginPayload struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

var sessionStore *sessions.CookieStore

func HTTPStart(config *Config) error {
	// init sessions
	sessionStore = sessions.NewCookieStore([]byte(config.HTTPSessionKey))
	// init routes
	r := mux.NewRouter()
	r.HandleFunc("/api/user/login", HTTPUserLogin).Methods("POST")
	log.Println("HTTP listening.")
	// start server
	return http.ListenAndServe(fmt.Sprintf(":%d", config.HTTPPort), r)
}

func HTTPSendMessage(w http.ResponseWriter, msg *HTTPMessage, status int) {
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(status)
	p, _ := json.Marshal(msg)
	w.Write(p)
}

func HTTPSendError(w http.ResponseWriter, err error) {
	HTTPSendMessage(w, &HTTPMessage{
		Success: false, Message: err.Error(),
	}, http.StatusInternalServerError)
}

func HTTPReadPayload(r *http.Request, payload interface{}) error {
	rawBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return err
	}
	return json.Unmarshal(rawBody, payload)
}
