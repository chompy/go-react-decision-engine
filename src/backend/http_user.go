package main

import "net/http"

type HTTPUserLoginPayload struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Team     string `json:"team"`
}

type HTTPUserPayload struct {
	ID         string         `json:"id"`
	Email      string         `json:"email"`
	Password   string         `json:"password"`
	Permission UserPermission `json:"permission"`
}

func HTTPUserLogin(w http.ResponseWriter, r *http.Request) {
	// read payload
	payload := HTTPUserLoginPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// validate payload
	if payload.Team == "" || payload.Email == "" || payload.Password == "" {
		HTTPSendError(w, ErrInvalidCredentials)
		return
	}
	// fetch user
	user, err := FetchUserByTeamEmail(payload.Team, payload.Email)
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

func HTTPUserFetch(w http.ResponseWriter, r *http.Request) {
	// get id
	id := r.URL.Query().Get("id")
	if id == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// must be logged in
	s := HTTPGetSession(r)
	user := s.getUser()
	if user == nil {
		HTTPSendError(w, ErrHTTPInvalidSession)
		return
	}
	// fetch
	fetchedUser, err := FetchUserByID(id)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	if fetchedUser.Team != user.Team {
		HTTPSendError(w, ErrInvalidPermission)
		return
	}
	// done
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    fetchedUser,
	}, http.StatusOK)
}

func HTTPUserStore(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPUserPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// build + validate
	dbId := DatabaseIDFromString(payload.ID)
	userEdit := User{
		ID:         dbId,
		Email:      payload.Email,
		Permission: payload.Permission,
	}
	// password
	if payload.Password != "" {
		password, err := HashPassword(payload.Password)
		if err != nil {
			HTTPSendError(w, err)
			return
		}
		userEdit.Password = password
	}
	// store
	if err := userEdit.Store(user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    userEdit,
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
