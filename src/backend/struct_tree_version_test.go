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
		ID:         GenerateDatabaseId(),
		Team:       GenerateDatabaseId(),
		Permission: PermCreateForm | PermEditForm,
	}
	testTreeRoot := TreeRoot{
		Type: TreeForm,
	}
	if err := testTreeRoot.Store(&testUser); err != nil {
		t.Error(err)
		return
	}
	if testTreeRoot.ID.IsEmpty() {
		t.Errorf("expect uid to be generated")
		return
	}

	// store
	testTreeVersion := TreeVersion{
		RootID: testTreeRoot.ID,
		State:  TreeDraft,
		Tree:   getTestTree(testTreeRoot.ID.String()),
	}
	if err := testTreeVersion.Store(&testUser); err != nil {
		t.Error(err)
		return
	}

	// fetch latest
	fetchLatest, err := FetchTreeVersionLatest(testTreeRoot.ID.String(), &testUser)
	if err != nil {
		t.Error(err)
		return
	}
	if fetchLatest.Version != 2 {
		t.Errorf("expected latest version to be version 2")
		return
	}

	// test tree nodes
	if fetchLatest.Tree[1].UID != testTreeVersion.Tree[1].UID {
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
	if testTreeVersion2.Version != 3 {
		t.Errorf("unexpected version")
		return
	}

	// fetch latest again and check that new latest version is 3
	fetchLatest, err = FetchTreeVersionLatest(testTreeVersion.RootID.String(), &testUser)
	if err != nil {
		t.Error(err)
		return
	}
	if fetchLatest.Version != 3 {
		t.Errorf("expected latest version to be version 2")
		return
	}

	// fetch latest published version
	fetchLatest, err = FetchTreeVersionLatestPublished(testTreeVersion.RootID.String(), &testUser)
	if err != nil {
		t.Error(err)
		return
	}
	if fetchLatest.Version != 2 {
		t.Errorf("expected latest published version to be version 2")
		return
	}

	// list all versions
	_, count, err := ListTreeVersion(testTreeVersion.RootID.String(), &testUser, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if count != 3 {
		t.Errorf("expected three versions")
		return
	}

}
