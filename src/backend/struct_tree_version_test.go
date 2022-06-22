package main

import (
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestTreeVersion(t *testing.T) {
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
		Permission: PermCreateForm | PermEditForm,
	}
	testTreeRoot := TreeRoot{
		Type: TreeForm,
	}
	if err := testTreeRoot.Store(&testUser); err != nil {
		t.Error(err)
		return
	}
	if testTreeRoot.ID.IsZero() {
		t.Errorf("expect uid to be generated")
		return
	}

	// store
	testTreeVersion := TreeVersion{
		RootID: testTreeRoot.ID,
		State:  TreeDraft,
		Tree:   getTestTree(testTreeRoot.ID.Hex()),
	}
	if err := testTreeVersion.Store(&testUser); err != nil {
		t.Error(err)
		return
	}

	// fetch latest
	fetchLatest, err := FetchTreeVersionLatest(testTreeRoot.ID.Hex(), &testUser)
	if err != nil {
		t.Error(err)
		return
	}
	if fetchLatest.Version != 1 {
		t.Errorf("expected latest version to be version 1")
		return
	}

	// test tree nodes
	if fetchLatest.Tree.Children[0].UID != testTreeVersion.Tree.Children[0].UID {

		t.Errorf("tree mismatch")
		return
	}

	// set state
	testTreeVersion.State = TreePublished
	if err := testTreeVersion.Store(&testUser); err != nil {
		t.Error(err)
		return
	}

	// create new version, check that version number is incrementedc
	testTreeVersion2 := TreeVersion{
		RootID: testTreeRoot.ID,
		State:  TreeDraft,
	}
	if err := testTreeVersion2.Store(&testUser); err != nil {
		t.Error(err)
		return
	}
	if testTreeVersion2.Version != 2 {
		t.Errorf("unexpected version")
		return
	}

	// fetch latest again and check that new latest version is 2
	fetchLatest, err = FetchTreeVersionLatest(testTreeVersion.RootID.Hex(), &testUser)
	if err != nil {
		t.Error(err)
		return
	}
	if fetchLatest.Version != 2 {
		t.Errorf("expected latest version to be version 2")
		return
	}

	// fetch latest published version
	fetchLatest, err = FetchTreeVersionLatestPublished(testTreeVersion.RootID.Hex(), &testUser)
	if err != nil {
		t.Error(err)
		return
	}
	if fetchLatest.Version != 1 {
		t.Errorf("expected latest published version to be version 1")
		return
	}

	// list all versions
	_, count, err := ListTreeVersion(testTreeVersion.RootID.Hex(), &testUser, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if count != 2 {
		t.Errorf("expected two versions")
		return
	}

}
