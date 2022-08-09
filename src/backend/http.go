package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

const UserCanEdit = "edit"
const UserCanDelete = "delete"
const UserCanCreate = "create"

type HTTPMessage struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Count   int         `json:"count,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	UserCan []string    `json:"user_can,omitempty"`
}

type HTTPEndpoint struct {
	Path     string
	Function func(http.ResponseWriter, *http.Request)
	Methods  string
}

var httpEndpoints = []HTTPEndpoint{
	{"/api/user/login", HTTPUserLogin, "POST"},
	{"/api/user/logout", HTTPUserLogout, "GET,POST"},
	{"/api/user/me", HTTPUserMe, "GET"},
	{"/api/user/fetch", HTTPUserFetch, "GET"},
	{"/api/user/store", HTTPUserStore, "POST"},
	{"/api/user/delete", HTTPUserDelete, "POST"},
	{"/api/team/fetch", HTTPTeamFetch, "GET"},
	{"/api/team/store", HTTPTeamStore, "POST"},
	{"/api/team/users", HTTPTeamUsers, "GET"},
	{"/api/tree/fetch", HTTPTreeRootFetch, "GET"},
	{"/api/tree/list", HTTPTreeRootList, "GET"},
	{"/api/tree/store", HTTPTreeRootStore, "POST"},
	{"/api/tree/delete", HTTPTreeRootDelete, "POST"},
	{"/api/tree/version/fetch", HTTPTreeVersionFetch, "GET"},
	{"/api/tree/version/list", HTTPTreeVersionList, "GET"},
	{"/api/tree/version/store", HTTPTreeVersionStore, "POST"},
	{"/api/tree/version/delete", HTTPTreeVersionDelete, "POST"},
	{"/api/tree/version/publish", HTTPTreeVersionPublish, "POST"},
	{"/api/submission/fetch", HTTPFormSubmissionFetch, "GET"},
	{"/api/submission/list", HTTPFormSubmissionList, "GET"},
	{"/api/submission/store", HTTPFormSubmissionStore, "POST"},
	{"/api/submission/delete", HTTPFormSubmissionDelete, "POST"},
	{"/api/rule_template/fetch", HTTPRuleTemplateFetch, "GET"},
	{"/api/rule_template/list", HTTPRuleTemplateList, "GET"},
	{"/api/rule_template/list_all", HTTPRuleTemplateListAll, "GET"},
	{"/api/rule_template/store", HTTPRuleTemplateStore, "POST"},
	{"/api/rule_template/delete", HTTPRuleTemplateDelete, "POST"},
}

func HTTPStart(config *Config) error {
	r := mux.NewRouter()
	for _, e := range httpEndpoints {
		r.HandleFunc(e.Path, e.Function).Methods(strings.Split(e.Methods, ",")...)
	}
	r.HandleFunc("/api/batch", HTTPBatch).Methods("POST")
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
	rawBody, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}
	return json.Unmarshal(rawBody, payload)
}
