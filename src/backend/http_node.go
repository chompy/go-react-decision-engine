package main

type HTTPNodeTopPayload struct {
	UID   string `json:"uid"`
	Team  string `json:"team"`
	Form  string `json:"form"`
	Type  string `json:"type"`
	Label string `json:"label"`
}

type HTTPNodeVersionPayload struct {
	UID     string `json:"uid"`
	Version int    `json:"version"`
	State   string `json:"state"`
}

/*func HTTPNodeTopStore(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPNodeTopPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// payload must include type
	if payload.Type == "" {
		HTTPSendError(w, ErrHTTPInvalidPayload)
		return
	}
	// params
	uid := payload.UID
	if uid == "" {
		uid = generateUID()
	}
	now := time.Now()
	nodeType := NodeForm
	team := payload.Team
	parent := payload.Team
	perm := PermTeamCreateForm
	switch payload.Type {
	case string(NodeForm):
		{
			// payload must include team
			if payload.Team == "" {
				HTTPSendError(w, ErrHTTPInvalidPayload)
				return
			}
			if payload.UID != "" {
				perm = PermTeamEditForm
			}
			break
		}
	case string(NodeDocument):
		{
			// payload must include form
			if payload.Form == "" {
				HTTPSendError(w, ErrHTTPInvalidPayload)
				return
			}
			nodeType = NodeDocument
			parent = payload.Form
			// fetch related form to ensure doc has form and to get team
			nodeForm, err := DatabaseNodeTopFetch(payload.Form)
			if err != nil {
				HTTPSendError(w, err)
				return
			}
			team = nodeForm.Parent
			break
		}
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	if user == nil {
		HTTPSendError(w, ErrInvalidPermission)
		return
	}
	// if uid provided then expect top node to already exist
	var nodeTopExisting *NodeTop
	if payload.UID != "" {
		var err error
		nodeTopExisting, err = DatabaseNodeTopFetch(payload.UID)
		if err != nil {
			if errors.Is(err, mongo.ErrNilDocument) {
				HTTPSendError(w, ErrNodeTopNotFound)
				return
			}
			HTTPSendError(w, err)
			return
		}
	}
	// check permission, bypass if user is creator of the existing
	if (nodeTopExisting != nil && nodeTopExisting.Creator != user.UID) && !httpUserCheckTeamPermission(r, team, perm) {
		HTTPSendError(w, ErrInvalidPermission)
		return
	}
	// creation time / creator
	creator := user.UID
	created := now
	if nodeTopExisting != nil {
		creator = nodeTopExisting.Creator
		created = nodeTopExisting.Created
	}
	// create/update
	nodeTop := NodeTop{
		UID:      uid,
		Created:  created,
		Modified: now,
		Creator:  creator,
		Modifier: user.UID,
		Type:     nodeType,
		Parent:   parent,
		Label:    payload.Label,
	}
	if err := DatabaseNodeTopStore(&nodeTop); err != nil {
		HTTPSendError(w, err)
		return
	}
	// success
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    nodeTop,
	}, http.StatusOK)
}

func HTTPNodeTopDelete(w http.ResponseWriter, r *http.Request) {
}

func HTTPNodeTopList(w http.ResponseWriter, r *http.Request) {
	nodeType := r.URL.Query().Get("type")
	parent := ""
	switch nodeType {
	case string(NodeForm):
		{
			parent = r.URL.Query().Get("team")
			break
		}
	case string(NodeDocument):
		{
			parent = r.URL.Query().Get("form")
			break
		}
	default:
		{
			HTTPSendError(w, ErrHTTPMissingParam)
			return
		}
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if offset < 0 {
		offset = 0
	}
	res, total, err := DatabaseNodeTopList(parent, NodeType(nodeType), offset)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Count:   total,
		Data:    res,
	}, http.StatusOK)
}

func HTTPNodeVersionStore(w http.ResponseWriter, r *http.Request) {
	// parse payload
	payload := HTTPNodeVersionPayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// payload must include uid
	if payload.UID == "" {
		HTTPSendError(w, ErrHTTPInvalidPayload)
		return
	}
	// get user
	s := HTTPGetSession(r)
	user := s.getUser()
	if user == nil {
		HTTPSendError(w, ErrInvalidPermission)
		return
	}
	// fetch node top, make sure it exists
	nodeTop, err := DatabaseNodeTopFetch(payload.UID)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	if nodeTop == nil {
		HTTPSendError(w, ErrNodeTopNotFound)
		return
	}
	// fetch existing version + check permission
	var existingNodeVersion *NodeVersion
	perm := PermTeamCreateDocument
	if payload.Version > 0 {
		perm = PermTeamEditDocument
		existingNodeVersion, err = DatabaseNodeVersionFetch(payload.UID, payload.Version)
		if err != nil {
			HTTPSendError(w, err)
			return
		}
		if existingNodeVersion == nil {
			HTTPSendError(w, ErrNodeVersionNotFound)
			return
		}
	}
	if nodeTop.Creator != user.UID && (existingNodeVersion == nil || existingNodeVersion.Creator != user.UID) && !httpUserCheckTeamPermission(r, nodeTop.Parent, perm) {
		HTTPSendError(w, ErrInvalidPermission)
		return
	}
	// params
	state := payload.State
	if state == "" {
		state = string(NodeDraft)
	}
	now := time.Now()
	created := now
	creator := user.UID
	if existingNodeVersion != nil {
		created = existingNodeVersion.Created
		creator = existingNodeVersion.Creator
	}
	nodeVersion := &NodeVersion{
		UID:      payload.UID,
		Created:  created,
		Modified: now,
		Creator:  creator,
		Modifier: user.UID,
		Version:  payload.Version,
		State:    NodeState(state),
	}
	// new version
	if payload.Version <= 0 {
		_, err = DatabaseNodeVersionNew(nodeVersion)
		if err != nil {
			HTTPSendError(w, err)
			return
		}
		return
	}
	// update version
	if err := DatabaseNodeVersionUpdate(nodeVersion); err != nil {
		HTTPSendError(w, err)
		return
	}
}

func HTTPNodeVersionDelete(w http.ResponseWriter, r *http.Request) {

}

func HTTPNodeVersionList(w http.ResponseWriter, r *http.Request) {
}
*/
