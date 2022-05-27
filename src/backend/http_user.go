package main

import (
	"net/http"
)

func HTTPUserLogin(w http.ResponseWriter, r *http.Request) {
	// read payload
	payload := HTTPUserLoginPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// validate payload
	if payload.Email == "" || payload.Password == "" {
		HTTPSendError(w, ErrInvalidCredientials)
	}
	// fetch user
	user, err := FetchUserByEmail(payload.Email)
	if err != nil {
		HTTPSendError(w, ErrInvalidCredientials)
		return
	}
	// check password
	if err := user.CheckPassword(payload.Password); err != nil {
		HTTPSendError(w, ErrInvalidCredientials)
		return
	}
	// set session
	HTTPNewSession(w, user)
	// send success response
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
	}, http.StatusOK)
}

func HTTPUserMe(w http.ResponseWriter, r *http.Request) {
	s := HTTPGetSession(r)
	user := s.getUser()
	if user == nil {
		HTTPSendError(w, ErrHTTPInvalidSession)
		return
	}
	// send success response
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    user,
	}, http.StatusOK)
}
