package main

import (
	"net/http"
	"strconv"
)

type HTTPTreeVersionPayload struct {
	RootID  string `json:"id"`
	Version int    `json:"version"`
	State   string `json:"state"`
	Tree    []Node `json:"tree"`
}

func HTTPTreeVersionFetch(w http.ResponseWriter, r *http.Request) {
	// get params
	id := r.URL.Query().Get("id")
	verStr := r.URL.Query().Get("version")
	if id == "" {
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
		res, err = FetchTreeVersion(id, ver, user)
	} else {
		res, err = FetchTreeVersionLatestPublished(id, user)
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
	// get params
	id := r.URL.Query().Get("id")
	if id == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	res, count, err := ListTreeVersion(id, user, offset)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Count:   count,
		Data:    res,
	}, http.StatusOK)
}

func HTTPTreeVersionStore(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPTreeVersionPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// missing root id
	if payload.RootID == "" {
		HTTPSendError(w, ErrHTTPInvalidPayload)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// build
	treeVersion := TreeVersion{
		RootID:  DatabaseIDFromString(payload.RootID),
		Version: payload.Version,
		State:   TreeState(payload.State),
		Tree:    payload.Tree,
	}
	// store
	if err := treeVersion.Store(user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    treeVersion,
	}, http.StatusOK)
}

func HTTPTreeVersionDelete(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPTreeVersionPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// missing uid or version
	if payload.RootID == "" || payload.Version <= 0 {
		HTTPSendError(w, ErrHTTPInvalidPayload)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	treeVersion, err := FetchTreeVersion(payload.RootID, payload.Version, user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// delete
	if err := treeVersion.Delete(user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
	}, http.StatusOK)
}

func HTTPTreeVersionPublish(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPTreeVersionPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// missing uid or version
	if payload.RootID == "" || payload.Version <= 0 {
		HTTPSendError(w, ErrHTTPInvalidPayload)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	treeVersion, err := FetchTreeVersion(payload.RootID, payload.Version, user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// publish
	if err := treeVersion.Publish(user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    treeVersion,
	}, http.StatusOK)
}
