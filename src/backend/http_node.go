package main

type HTTPNodeTopPayload struct {
	Team string
	Form string
	Type string
}

type HTTPNodePayload struct {
	Team  string        `json:"team"`
	Type  string        `json:"type"`
	Form  string        `json:"form"`
	Nodes []interface{} `json:"nodes"`
}

/*func httpPayloadToNode(payload interface{}) (Node, NodeData) {
	node := Node{}
	nodeData := NodeData{}
	payloadRaw, err := json.Marshal(payload)
	if err != nil {
		return node, nodeData
	}
	json.Unmarshal(payloadRaw, &node)
	json.Unmarshal(payloadRaw, &nodeData)
	return node, nodeData
}

func HTTPNodeList(w http.ResponseWriter, r *http.Request) {
	// query params
	team := r.URL.Query().Get("team")
	typeName := r.URL.Query().Get("type")
	offsetStr := r.URL.Query().Get("offset")
	if team == "" || typeName == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// get offset
	offset := 0
	if offsetStr != "" {
		offset, _ = strconv.Atoi(offsetStr)
	}
	// check session
	s := HTTPGetSession(r)
	if s.uid == "" {
		HTTPSendError(w, ErrHTTPLoginRequired)
		return
	}
	// check team
	user := s.getUser()
	if !user.IsOnTeam(team) {
		HTTPSendError(w, ErrUserNotOnTeam)
		return
	}
	// perform fetch
	res, err := DatabaseNodeList(team, getNodeTypeFromName(typeName), offset)
	if err != nil {
		HTTPSendError(w, err)
		return
	}
	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Data:    res,
	}, http.StatusOK)
}

func HTTPNodeNew(w http.ResponseWriter, r *http.Request) {
	// read payload
	payload := HTTPNodePayload{}
	if err := HTTPReadPayload(r, &payload); err != nil {
		HTTPSendError(w, err)
		return
	}
	// validate payload
	if payload.Team == "" || payload.Type == "" {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// check session
	s := HTTPGetSession(r)
	if s.uid == "" {
		HTTPSendError(w, ErrHTTPLoginRequired)
		return
	}
	// check team
	user := s.getUser()
	if !user.IsOnTeam(payload.Team) {
		HTTPSendError(w, ErrUserNotOnTeam)
		return
	}
	// must contain at least one node
	if payload.Nodes == nil {
		HTTPSendError(w, ErrHTTPMissingParam)
		return
	}
	// read first node, make sure it is a root node
	rootNode, _ := httpPayloadToNode(payload.Nodes[0])
	if rootNode.Type != "root" {
		HTTPSendError(w, ErrNodeNotRoot)
		return
	}
	// get top node type
	topNode := getNodeTypeFromName(payload.Type)
	// check if top node is in database
	var dbRes interface{} = nil
	if rootNode.UID != "" {
		var err error
		dbRes, err = DatabaseNodeFetch(rootNode.UID, topNode)
		if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
			HTTPSendError(w, err)
			return
		}
	}
	// build top node
	switch t := topNode.(type) {
	case *NodeTopForm:
		{
			if dbRes == nil {
				t.UID = generateUID()
			}
			t.Created = rootNode.Created
			t.Modified = time.Now()
			t.Team = payload.Team
			t.Label = rootNode.Label
			if dbRes != nil {
				t.UID = dbRes.(*NodeTopForm).UID
				t.Created = dbRes.(*NodeTopForm).Created
			}
			break
		}
	case *NodeTopDocument:
		{
			if dbRes == nil {
				t.UID = generateUID()
			}
			t.Created = rootNode.Created
			t.Modified = time.Now()
			t.Form = payload.Form
			t.Label = rootNode.Label
			if dbRes != nil {
				t.UID = dbRes.(*NodeTopForm).UID
				t.Created = dbRes.(*NodeTopForm).Created
			}
			break
		}
	}

	// update top level node
	if err := DatabaseNodeStore(topNode); err != nil {
		HTTPSendError(w, err)
		return
	}
	// update children

	uid, ver := getNodeUidVersion(topNode)

	for _, rawNode := range payload.Nodes[1:] {
		node, nodeData := httpPayloadToNode(rawNode)

		if err := DatabaseNodeStore(node); err != nil {
			HTTPSendError(w, err)
			return
		}
		if err := DatabaseNodeStore(nodeData); err != nil {
			HTTPSendError(w, err)
			return
		}
	}

}
*/
