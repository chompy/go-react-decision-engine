package main

import (
	"net/http"
	"strconv"
)

type HTTPTreeVersionPayload struct {
	UID     string `json:"uid"`
	Version int    `json:"version"`
	State   string `json:"state"`
	Tree    []Node `json:"tree"`
}

func HTTPTreeVersionFetch(w http.ResponseWriter, r *http.Request) {
	// get params
	uid := r.URL.Query().Get("uid")
	verStr := r.URL.Query().Get("version")
	if uid == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	ver, _ := strconv.Atoi(verStr)
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch (if version not provided fetch the latest version)
	var err error
	var res *TreeVersion
	if ver > 0 {
		res, err = FetchTreeVersion(uid, ver, user)
	} else {
		res, err = FetchTreeVersionLatestPublished(uid, user)
	}
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

func HTTPTreeVersionList(w http.ResponseWriter, r *http.Request) {

	uid := r.URL.Query().Get("uid")
	if uid == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
}

func HTTPTreeVersionStore(w http.ResponseWriter, r *http.Request) {
}

func HTTPTreeVersionDelete(w http.ResponseWriter, r *http.Request) {

}
