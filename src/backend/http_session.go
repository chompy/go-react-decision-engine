package main

import (
	"net/http"
	"time"

	"github.com/google/uuid"
)

const httpSessionCookieName = "ccde_session"
const httpSessionExpire = 3600

type httpSession struct {
	uid     string
	created time.Time
}

var httpSessions = map[string]httpSession{}

func HTTPNewSession(w http.ResponseWriter, user *User) {
	// clean up sessions before creating a new one
	httpCleanUpSessions()
	// generate token
	sessionToken := uuid.NewString()
	// store session
	httpSessions[sessionToken] = httpSession{
		uid:     user.UID,
		created: time.Now(),
	}
	// set session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     httpSessionCookieName,
		Value:    sessionToken,
		Expires:  time.Now().Add(time.Second * httpSessionExpire),
		Path:     "/api",
		SameSite: http.SameSiteStrictMode,
	})
}

func HTTPExpireSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     httpSessionCookieName,
		Value:    "",
		Expires:  time.Now(),
		Path:     "/api",
		SameSite: http.SameSiteStrictMode,
	})
}

func HTTPGetSession(r *http.Request) httpSession {
	c, err := r.Cookie(httpSessionCookieName)
	if err != nil {
		return httpSession{}
	}
	return httpSessions[c.Value]
}

func (s httpSession) hasExpired() bool {
	expireTime := s.created.Add(time.Second * httpSessionExpire)
	return time.Now().After(expireTime)
}

func (s httpSession) getUser() *User {
	if s.uid == "" {
		return nil
	}
	user, _ := FetchUserByUID(s.uid)
	return user
}

func httpCleanUpSessions() {
	for t := range httpSessions {
		if httpSessions[t].hasExpired() {
			delete(httpSessions, t)
			httpCleanUpSessions()
			break
		}
	}
}
