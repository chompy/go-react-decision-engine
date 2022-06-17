package main

import (
	"net/http"
	"strconv"
)

type HTTPTreeRootPayload struct {
	UID   string `json:"uid"`
	Team  string `json:"team"`
	Form  string `json:"form"`
	Type  string `json:"type"`
	Label string `json:"label"`
}

func HTTPTreeRootFetch(w http.ResponseWriter, r *http.Request) {
	// get uid
	uid := r.URL.Query().Get("uid")
	if uid == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	treeRoot, err := FetchTreeRoot(uid, user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    treeRoot,
	}, http.StatusOK)
}

func HTTPTreeRootList(w http.ResponseWriter, r *http.Request) {
	// get offset
	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// determine type + fetch
	var res []*TreeRoot
	var err error
	count := 0
	rootType := r.URL.Query().Get("type")
	formUid := r.URL.Query().Get("form")
	switch rootType {
	case string(TreeDocument):
		{
			if formUid == "" {
				HTTPSendError(w, ErrHTTPMissingParam)
				return
			}
			res, count, err = ListDocumentRoot(formUid, user, offset)
			break
		}
	default:
		{
			res, count, err = ListFormRoot(user, offset)
			break
		}
	}
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

func HTTPTreeRootStore(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPTreeRootPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// build + validate
	treeRoot := TreeRoot{
		UID:   payload.UID,
		Label: payload.Label,
	}
	switch payload.Type {
	case string(TreeForm):
		{
			if payload.UID == "" && payload.Team == "" {
				HTTPSendError(w, ErrHTTPInvalidPayload)
				return
			}
			treeRoot.Type = TreeForm
			treeRoot.Parent = payload.Team
			break
		}
	case string(TreeDocument):
		{
			if payload.UID == "" && payload.Form == "" {
				HTTPSendError(w, ErrHTTPInvalidPayload)
				return
			}
			treeRoot.Type = TreeDocument
			treeRoot.Parent = payload.Form
			break
		}
	default:
		{
			HTTPSendError(w, ErrHTTPInvalidPayload)
			return
		}
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// store
	if err := treeRoot.Store(user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    treeRoot,
	}, http.StatusOK)
}

func HTTPTreeRootDelete(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPTreeRootPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// missing uid
	if payload.UID == "" {
		HTTPSendError(w, ErrHTTPInvalidPayload)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	treeRoot, err := FetchTreeRoot(payload.UID, user)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// delete
	if err := treeRoot.Delete(user); err != nil {
		HTTPSendError(w, err)
		return
	}
	// send results
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
	}, http.StatusOK)
}
