package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
)

func testFetchTestUser() *User {
	return &User{
		UID:        "USER1",
		Email:      "test@example.com",
		Password:   []byte(""),
		Permission: PermGlobalAdmin,
	}
}

func testHTTPRequest(payload interface{}) (MockResponseWriter, *http.Request) {
	payloadJSON, _ := json.Marshal(payload)
	w := NewMockResponseWriter()
	HTTPNewSession(w, testFetchTestUser())
	var r *http.Request
	if payload == nil {
		r, _ = http.NewRequest("GET", "/", nil)
	} else {
		r, _ = http.NewRequest("POST", "/", bytes.NewReader(payloadJSON))
	}
	for k := range httpSessions {
		r.AddCookie(&http.Cookie{
			Name:  httpSessionCookieName,
			Value: k,
		})
	}
	return w, r
}

func TestHTTPNodeTopNew(t *testing.T) {
	// init database
	if err := databaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer databaseClose()
	testCleanDatabase()
	httpCleanUpSessions()
	team := "TESTTEAMA"
	// send http request, create new top node
	payload := HTTPNodeTopPayload{
		Team:  team,
		Type:  string(NodeForm),
		Label: "Test Form A",
	}
	w, r := testHTTPRequest(&payload)
	HTTPNodeTopStore(w, r)
	// check response
	if !w.Response.Success {
		t.Errorf("expected success")
		return
	}
	// send http request, list top nodes
	w, r = testHTTPRequest(nil)
	r.URL.Query().Add("type", string(NodeForm))
	r.URL.Query().Add("team", team)
	r.URL, _ = r.URL.Parse(fmt.Sprintf("/?type=%s&team=%s", string(NodeForm), team))
	HTTPNodeTopList(w, r)
	// check response
	if !w.Response.Success {
		t.Errorf("expected success")
		return
	}
	if w.Response.Count != 1 {
		t.Errorf("expected response count to be 1, got %d", w.Response.Count)
		return
	}
	// get uid
	uid := w.Response.Data.([]interface{})[0].(map[string]interface{})["uid"].(string)
	if uid == "" {
		t.Errorf("expected uid in response")
		return
	}
	// update
	payload.UID = uid
	payload.Label = "Test Form A1"
	w, r = testHTTPRequest(&payload)
	HTTPNodeTopStore(w, r)
	nodeList, _, err := DatabaseNodeTopList(team, NodeForm, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if len(nodeList) != 1 {
		t.Errorf("expected one item in top node list")
		return
	}
	if nodeList[0].Label != payload.Label {
		t.Errorf("unexpected label for top node expected %s, got %s", payload.Label, nodeList[0].Label)
	}
}
