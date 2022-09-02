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
		Permission: UserPermission{PermManageForm, PermManageDocument},
	}
	testTreeRoot := TreeRoot{
		Parent: testUser.Team,
		Type:   TreeForm,
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

func TestTreeTypeahead(t *testing.T) {

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
		Permission: UserPermission{PermManageForm, PermManageDocument},
	}
	testTreeRoot := TreeRoot{
		Parent: testUser.Team,
		Type:   TreeForm,
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
		RootID:  testTreeRoot.ID,
		State:   TreeDraft,
		Version: 1,
		Tree: []Node{
			Node{
				UID:    testTreeRoot.ID.String(),
				Type:   "root",
				Tags:   []string{"test"},
				Parent: "",
			},
			Node{
				UID:    "node-a",
				Type:   "question",
				Parent: testTreeRoot.ID.String(),
				Data: map[string]interface{}{
					"label": "Node A",
				},
			},
			Node{
				UID:    "node-b",
				Type:   "question",
				Parent: testTreeRoot.ID.String(),
				Data: map[string]interface{}{
					"label": "Node B",
				},
			},
		},
	}
	if err := testTreeVersion.Store(&testUser); err != nil {
		t.Error(err)
		return
	}
	// store version 2
	testTreeVersion2 := TreeVersion{
		RootID: testTreeRoot.ID,
		State:  TreeDraft,
		Tree: []Node{
			Node{
				UID:    testTreeRoot.ID.String(),
				Type:   "root",
				Tags:   []string{"test"},
				Parent: "",
			},
			Node{
				UID:    "node-a",
				Type:   "question",
				Parent: testTreeRoot.ID.String(),
				Data: map[string]interface{}{
					"label": "Node A",
				},
			},
			Node{
				UID:    "node-c",
				Type:   "question",
				Parent: testTreeRoot.ID.String(),
				Data: map[string]interface{}{
					"label": "Node C",
				},
			},
		},
	}
	if err := testTreeVersion2.Store(&testUser); err != nil {
		t.Error(err)
		return
	}

	nodes, err := ListNodeVersion(testTreeRoot.ID.String(), 2, &testUser)
	if err != nil {
		t.Error(err)
		return
	}
	hasNodeB := false
	for _, n := range nodes {
		if n.UID == "node-b" && n.Version == 1 {
			hasNodeB = true
			break
		}
	}
	if !hasNodeB {
		t.Error("expected node-b to return as version 1")
	}

}
