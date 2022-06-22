package main

import (
	"net/http"
	"strconv"
)

func HTTPTeam(w http.ResponseWriter, r *http.Request) {
	// get user from session
	s := HTTPGetSession(r)
	user := s.getUser()
	if user == nil {
		HTTPSendError(w, ErrHTTPLoginRequired)
		return
	}
	// fetch team
	team, err := FetchTeamByID(user.ID.Hex(), user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// send success response
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    team,
	}, http.StatusOK)
}

func HTTPTeamUsers(w http.ResponseWriter, r *http.Request) {
	// get offset param
	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}
	// get user from session
	s := HTTPGetSession(r)
	user := s.getUser()
	if user == nil {
		HTTPSendError(w, ErrHTTPLoginRequired)
		return
	}
	// fetch team users
	userList, count, err := ListUserTeam(user, offset)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// send success response
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Count:   count,
		Data:    userList,
	}, http.StatusOK)
}
