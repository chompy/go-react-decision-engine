package main

import (
	"errors"
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"
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
		ID:         primitive.NewObjectID(),
		Team:       primitive.NewObjectID(),
		Permission: PermAdmin,
	}
	testTreeRoot := TreeRoot{
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
	testFetch, err := FetchTreeRoot(testTreeRoot.ID.Hex(), &testUser)
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
		ID:         primitive.NewObjectID(),
		Team:       primitive.NewObjectID(),
		Permission: PermNone,
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
	testUser.Permission = testUser.Permission.Add(PermCreateForm)
	if err := testTreeRoot.Store(&testUser); err != nil {
		t.Error(err)
		return
	}
	err = testTreeRoot.Store(&User{ID: primitive.NewObjectID(), Team: testUser.Team, Permission: PermCreateDocument})
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
