package main

/*
func HTTPTeam(w http.ResponseWriter, r *http.Request) {
	// uid param
	uid := r.URL.Query().Get("uid")
	if uid == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// check session
	s := HTTPGetSession(r)
	if s.uid == "" {
		HTTPSendError(w, ErrHTTPLoginRequired)
		return
	}
	// fetch team
	team, err := FetchTeamByUID(uid)
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
	// uid param
	uid := r.URL.Query().Get("uid")
	if uid == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// check session
	s := HTTPGetSession(r)
	if s.uid == "" {
		HTTPSendError(w, ErrHTTPLoginRequired)
		return
	}
	// fetch team
	team, err := FetchTeamByUID(uid)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	teamUsers, err := team.FetchUsers()
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// send success response
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    teamUsers,
	}, http.StatusOK)
}
*/
