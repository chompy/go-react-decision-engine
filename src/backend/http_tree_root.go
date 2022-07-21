package main

import (
	"net/http"
	"strconv"
)

type HTTPTreeRootPayload struct {
	ID    string `json:"id"`
	Team  string `json:"team"`
	Form  string `json:"form"`
	Type  string `json:"type"`
	Label string `json:"label"`
}

func HTTPTreeRootFetch(w http.ResponseWriter, r *http.Request) {
	// get id
	id := r.URL.Query().Get("id")
	if id == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	treeRoot, err := FetchTreeRoot(id, user)
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
	// require published items only
	requirePublished := r.URL.Query().Get("published") != ""
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// determine type + fetch
	var res []*TreeRoot
	var err error
	count := 0
	rootType := r.URL.Query().Get("type")
	formId := r.URL.Query().Get("form")
	switch rootType {
	case string(TreeDocument):
		{
			if formId == "" {
				HTTPSendError(w, ErrHTTPMissingParam)
				return
			}
			if requirePublished {
				res, count, err = ListPublishedDocumentRoot(formId, user, offset)
				break
			}
			res, count, err = ListDocumentRoot(formId, user, offset)
			break
		}
	default:
		{
			if requirePublished {
				res, count, err = ListPublishedFormRoot(user, offset)
				break
			}
			res, count, err = ListFormRoot(user, offset)
			break
		}
	}
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	// TODO let front end know user permissions
	/*userPermOpts := make([]string, 0)
	if err := checkStorePermission(&TreeRoot{Team: user.Team, Type: TreeForm}, user); err == nil {
		userPermOpts = append(userPermOpts, UserCanEdit)
	}
	if err := checkDeletePermission(&TreeRoot{Team: user.Team, Type: TreeForm}, user); err == nil {
		userPermOpts = append(userPermOpts, UserCanDelete)
	}*/
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
	treeRootId := DatabaseIDFromString(payload.ID)
	treeRoot := TreeRoot{
		ID:    treeRootId,
		Label: payload.Label,
	}
	switch payload.Type {
	case string(TreeForm):
		{
			if payload.Team == "" {
				HTTPSendError(w, ErrHTTPInvalidPayload)
				return
			}
			treeRoot.Type = TreeForm
			treeRoot.Parent = DatabaseIDFromString(payload.Team)
			break
		}
	case string(TreeDocument):
		{
			if payload.Form == "" {
				HTTPSendError(w, ErrHTTPInvalidPayload)
				return
			}
			treeRoot.Type = TreeDocument
			treeRoot.Parent = DatabaseIDFromString(payload.Form)
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
	// missing id
	if payload.ID == "" {
		HTTPSendError(w, ErrHTTPInvalidPayload)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	// fetch
	treeRoot, err := FetchTreeRoot(payload.ID, user)
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
