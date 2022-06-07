package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
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
	if err := DatabaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer DatabaseClose()
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
	HTTPNodeTopNew(w, r)
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
	log.Println(r.URL.Query())
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
}
