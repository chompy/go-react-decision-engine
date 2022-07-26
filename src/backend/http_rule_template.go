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

func HTTPRuleTemplateListAll(w http.ResponseWriter, r *http.Request) {
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	res, err := ListAllRuleTemplate(user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// convert results to map of id to label
	out := make(map[string]string)
	for _, r := range res {
		out[r.ID.String()] = r.Label
	}
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Count:   len(res),
		Data:    out,
	}, http.StatusOK)
}

func HTTPRuleTemplateStore(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPRuleTemplatePayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// build + validate
	dbId := DatabaseIDFromString(payload.ID)
	ruleTemplate := RuleTemplate{
		ID:     dbId,
		Label:  payload.Label,
		Script: payload.Script,
		Team:   user.Team,
	}
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
	ruleTemplate, err := FetchRuleTemplate(payload.ID, user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// delete
	if err := ruleTemplate.Delete(user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
	}, http.StatusOK)
}
