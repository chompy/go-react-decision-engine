package main

import (
	"testing"
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
		UID:        "USER1",
		Team:       "TEAM1",
		Permission: PermCreateForm,
	}
	testTreeRoot := TreeRoot{
		Type: TreeForm,
	}
	if err := testTreeRoot.Store(&testUser); err != nil {
		t.Error(err)
		return
	}
	if testTreeRoot.UID == "" {
		t.Errorf("expect uid to be generated")
		return
	}

	// store
	testTreeVersion := TreeVersion{
		UID:   testTreeRoot.UID,
		State: TreeDraft,
		Tree:  getTestTree(testTreeRoot.UID),
	}
	if err := testTreeVersion.Store(&testUser); err != nil {
		t.Error(err)
		return
	}

	// fetch latest
	fetchLatest, err := FetchTreeVersionLatest(testTreeRoot.UID, &testUser)
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
		UID:   testTreeRoot.UID,
		State: TreeDraft,
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
	fetchLatest, err = FetchTreeVersionLatest(testTreeVersion.UID, &testUser)
	if err != nil {
		t.Error(err)
		return
	}
	if fetchLatest.Version != 2 {
		t.Errorf("expected latest version to be version 2")
		return
	}

	// fetch latest published version
	fetchLatest, err = FetchTreeVersionLatestPublished(testTreeVersion.UID, &testUser)
	if err != nil {
		t.Error(err)
		return
	}
	if fetchLatest.Version != 1 {
		t.Errorf("expected latest published version to be version 1")
		return
	}

	// list all versions
	_, count, err := ListTreeVersion(testTreeVersion.UID, &testUser, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if count != 2 {
		t.Errorf("expected two versions")
		return
	}

}
