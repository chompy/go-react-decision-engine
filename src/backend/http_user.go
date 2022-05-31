package main

import (
	"net/http"
)

type HTTPUserLoginPayload struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func HTTPUserLogin(w http.ResponseWriter, r *http.Request) {
	// read payload
	payload := HTTPUserLoginPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// validate payload
	if payload.Email == "" || payload.Password == "" {
		HTTPSendError(w, ErrInvalidCredentials)
		return
	}
	// fetch user
	user, err := FetchUserByEmail(payload.Email)
	if err != nil {
		HTTPSendError(w, ErrInvalidCredentials)
		return
	}
	// check password
	if err := user.CheckPassword(payload.Password); err != nil {
		HTTPSendError(w, ErrInvalidCredentials)
		return
	}
	// set session
	HTTPNewSession(w, user)
	// send success response
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
	}, http.StatusOK)
}

func HTTPUserLogout(w http.ResponseWriter, r *http.Request) {
	HTTPExpireSession(w)
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

func HTTPUserTeams(w http.ResponseWriter, r *http.Request) {
	// fetch session + user
	s := HTTPGetSession(r)
	user := s.getUser()
	if user == nil {
		HTTPSendError(w, ErrHTTPInvalidSession)
		return
	}
	// fetch teams
	teamUsers, err := user.FetchTeams()
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// merge TeamUser in to Team struct
	teams := make([]map[string]interface{}, 0)
	for _, teamUser := range teamUsers {
		team, err := FetchTeamByUID(teamUser.Team)
		if err != nil {
			HTTPSendError(w, err)
			return
		}
		teams = append(teams, map[string]interface{}{
			"uid":         team.UID,
			"name":        team.Name,
			"created":     team.Created,
			"perm_invite": teamUser.PermInvite,
			"perm_admin":  teamUser.PermAdmin,
		})
	}
	// send success response
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    teams,
	}, http.StatusOK)
}
