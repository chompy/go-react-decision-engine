package main

import (
	"net/http"
	"strconv"
)

type HTTPRuleTemplatePayload struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Script string `json:"script"`
}

func HTTPRuleTemplateFetch(w http.ResponseWriter, r *http.Request) {
	// get id
	id := r.URL.Query().Get("id")
	if id == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	ruleTemplate, err := FetchRuleTemplate(id, user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    ruleTemplate,
	}, http.StatusOK)
}

func HTTPRuleTemplateList(w http.ResponseWriter, r *http.Request) {
	// get offset
	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	res, count, err := ListRuleTemplate(user, offset)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Count:   count,
		Data:    res,
	}, http.StatusOK)
}

func HTTPRuleTemplateStore(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPRuleTemplatePayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// build + validate
	dbId := DatabaseIDFromString(payload.ID)
	ruleTemplate := RuleTemplate{
		ID:     dbId,
		Label:  payload.Label,
		Script: payload.Script,
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// store
	if err := ruleTemplate.Store(user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    ruleTemplate,
	}, http.StatusOK)
}

func HTTPRuleTemplateDelete(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPRuleTemplatePayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// missing id
	if payload.ID == "" {
		HTTPSendError(w, ErrHTTPInvalidPayload)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	treeRoot, err := FetchTreeRoot(payload.ID, user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// delete
	if err := treeRoot.Delete(user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
	}, http.StatusOK)
}
