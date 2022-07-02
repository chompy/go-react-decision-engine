package main

import (
	"net/http"
	"strconv"
)

type HTTPFormSubmissionPayload struct {
	ID          string              `json:"id"`
	FormID      string              `json:"form_id"`
	FormVersion int                 `json:"form_version"`
	Answers     map[string][]string `json:"answers"`
}

func HTTPFormSubmissionFetch(w http.ResponseWriter, r *http.Request) {
	// get params
	id := r.URL.Query().Get("id")
	if id == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	res, err := FetchFormSubmission(id, user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    res,
	}, http.StatusOK)
}

func HTTPFormSubmissionList(w http.ResponseWriter, r *http.Request) {
	// get params
	formId := r.URL.Query().Get("form")
	if formId == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	res, count, err := ListFormSubmission(formId, user, offset)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Count:   count,
		Data:    res,
	}, http.StatusOK)
}

func HTTPFormSubmissionStore(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPFormSubmissionPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// missing params
	if (payload.ID == "" && payload.FormID == "") || payload.FormVersion <= 0 {
		HTTPSendError(w, ErrHTTPInvalidPayload)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// build
	submission := FormSubmission{
		ID:          DatabaseIDFromString(payload.ID),
		FormID:      DatabaseIDFromString(payload.FormID),
		FormVersion: payload.FormVersion,
		Answers:     payload.Answers,
	}
	// store
	if err := submission.Store(user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    submission,
	}, http.StatusOK)
}
