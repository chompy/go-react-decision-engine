package main

import (
	"net/http"
	"strconv"
)

type HTTPTeamPayload struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func HTTPTeamFetch(w http.ResponseWriter, r *http.Request) {
	// get team id, user current user team if team id not provided
	teamId := r.URL.Query().Get("id")
	if teamId == "" {
		s := HTTPGetSession(r)
		user := s.getUser()
		if user == nil {
			HTTPSendError(w, ErrHTTPLoginRequired)
			return
		}
		teamId = user.Team.String()
	}
	// fetch team
	team, err := FetchTeamByID(teamId, nil)
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

func HTTPTeamStore(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPTeamPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// build + validate
	if payload.ID == "" {
		HTTPSendError(w, ErrHTTPInvalidPayload)
		return
	}
	dbId := DatabaseIDFromString(payload.ID)
	team := Team{
		ID:   dbId,
		Name: payload.Name,
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// store
	if err := team.Store(user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
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
