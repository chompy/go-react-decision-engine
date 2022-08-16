package main

import (
	"net/http"
	"strconv"
)

func HTTPTreeTypeaheadList(w http.ResponseWriter, r *http.Request) {
	// get id
	id := r.URL.Query().Get("id")
	if id == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// get max ver
	maxVerStr := r.URL.Query().Get("version")
	maxVer, _ := strconv.Atoi(maxVerStr)
	if maxVer <= 0 {
		maxVer = 1
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	typeaheadList, err := ListTreeTypeahead(id, maxVer, user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    typeaheadList,
	}, http.StatusOK)
}
