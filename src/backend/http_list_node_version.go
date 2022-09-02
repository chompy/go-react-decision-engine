package main

import (
	"net/http"
	"strconv"
)

func HTTPListNodeVersion(w http.ResponseWriter, r *http.Request) {
	// get id
	id := r.URL.Query().Get("id")
	if id == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// get max ver
	maxVerStr := r.URL.Query().Get("version")
	maxVer, _ := strconv.Atoi(maxVerStr)
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	if user == nil {
		HTTPSendError(w, ErrHTTPInvalidSession)
		return
	}
	if err := checkFetchPermission(&TreeRoot{Parent: user.Team}, user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// fetch
	nodeList, err := ListNodeVersion(id, maxVer, user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    nodeList,
	}, http.StatusOK)
}
