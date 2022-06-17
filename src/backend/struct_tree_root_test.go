package main

import (
	"errors"
	"testing"
)

func TestTreeRoot(t *testing.T) {
	// init database
	if err := databaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer databaseClose()
	testCleanDatabase()
	testUser := User{
		UID:        "USER1",
		Team:       "TEAM1",
		Permission: PermAdmin,
	}
	testTreeRoot := TreeRoot{
		UID:    "TREE1",
		Type:   TreeForm,
		Parent: testUser.Team,
		Label:  "Testing 123",
	}
	// test store
	if err := testTreeRoot.Store(&testUser); err != nil {
		t.Error(err)
		return
	}
	// test fetch
	testFetch, err := FetchTreeRoot(testTreeRoot.UID, &testUser)
	if err != nil {
		t.Error(err)
		return
	}
	if testFetch.Type != testTreeRoot.Type || testFetch.Parent != testTreeRoot.Parent || testFetch.Label != testTreeRoot.Label {
		t.Errorf("stored tree root does not match")
		return
	}
}

func TestTreeRootPermissions(t *testing.T) {
	if err := databaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer databaseClose()
	testCleanDatabase()
	testUser := User{
		UID:        "USER1",
		Team:       "TEAM1",
		Permission: PermCreateDocument,
	}
	testTreeRoot := TreeRoot{
		Type:   TreeForm,
		Parent: testUser.Team,
		Label:  "Testing 123",
	}
	err := testTreeRoot.Store(&testUser)
	if err == nil || !errors.Is(err, ErrInvalidPermission) {
		t.Errorf("expected permission error")
		return
	}
	testUser.Permission.Add(PermCreateForm)
	if err := testTreeRoot.Store(&testUser); err != nil {
		t.Error(err)
		return
	}
	err = testTreeRoot.Store(&User{UID: "USER2", Team: "TEAM1", Permission: PermCreateDocument})
	if err == nil || !errors.Is(err, ErrInvalidPermission) {
		t.Errorf("expected permission error")
		return
	}
	testTreeRoot.Label = "Testing 456"
	if err := testTreeRoot.Store(&testUser); err != nil {
		t.Error(err)
		return
	}
}
