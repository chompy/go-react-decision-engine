package main

import (
	"testing"

	"go.mongodb.org/mongo-driver/bson"
)

func TestDatabaseNodeTop(t *testing.T) {
	if err := databaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer databaseClose()
	testCleanDatabase()
	team := "TESTTEAMA"
	// generate sample form top
	topForm := NodeTop{
		UID:    generateUID(),
		Type:   NodeForm,
		Label:  "Test Form",
		Parent: team,
	}
	// store
	if err := databaseStoreOne(&topForm); err != nil {
		t.Error(err)
		return
	}
	// generate sample document top
	topDoc := NodeTop{
		UID:    generateUID(),
		Type:   NodeDocument,
		Label:  "Test Document",
		Parent: topForm.UID,
	}
	// store
	if err := databaseStoreOne(&topDoc); err != nil {
		t.Error(err)
		return
	}
	// test form retrieve
	formRes, formCount, err := databaseList(topForm, bson.M{"parent": team, "type": string(NodeForm)}, nil, nil, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if formCount != 1 {
		t.Errorf("unexpected result count")
		return
	}
	if formRes[0].(*NodeTop).UID != topForm.UID {
		t.Errorf("unexpected form uid, expected %s, got %s", topForm.UID, formRes[0].(*NodeTop).UID)
		return
	}
	// test document retrieve
	docRes, docCount, err := databaseList(topForm, bson.M{"parent": topForm.UID, "type": string(NodeDocument)}, nil, nil, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if docCount != 1 {
		t.Errorf("unexpected result count")
		return
	}
	if docRes[0].(*NodeTop).UID != topDoc.UID {
		t.Errorf("unexpected doc uid, expected %s, got %s", topDoc.UID, docRes[0].(*NodeTop).UID)
		return
	}
	// delete
	if err := DatabaseNodeTopDelete(topForm.UID); err != nil {
		t.Error(err)
		return
	}
	// check
	_, docCount, err = DatabaseNodeTopList(topForm.UID, NodeDocument, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if docCount != 1 {
		t.Errorf("expected one top node")
		return
	}
}

func TestDatabaseNodeVersion(t *testing.T) {
	if err := databaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer databaseClose()
	testCleanDatabase()
	// create form top
	team := "TESTTEAMA"
	topForm := NodeTop{
		UID:    generateUID(),
		Type:   NodeForm,
		Label:  "Test Form",
		Parent: team,
	}
	if err := DatabaseNodeTopStore(&topForm); err != nil {
		t.Error(err)
		return
	}
	// create version
	nodeVersion := NodeVersion{
		UID:   topForm.UID,
		State: NodeDraft,
	}
	verNo, err := DatabaseNodeVersionNew(&nodeVersion)
	if err != nil {
		t.Error(err)
		return
	}
	if verNo != 1 {
		t.Errorf("unexpected version, expected 1, got %d", verNo)
		return
	}
	// check if version exists
	verExist, err := DatabaseNodeVersionExists(topForm.UID, verNo)
	if err != nil {
		t.Error(err)
		return
	}
	if !verExist {
		t.Errorf("expected version %d to exist", verNo)
	}
	// publish
	nodeVersion.State = NodePublished
	if err := DatabaseNodeVersionUpdate(&nodeVersion); err != nil {
		t.Error(err)
		return
	}
	// new version, 2
	nodeVersion2 := NodeVersion{
		UID:   topForm.UID,
		State: NodeDraft,
	}
	verNo, err = DatabaseNodeVersionNew(&nodeVersion2)
	if err != nil {
		t.Error(err)
		return
	}
	if verNo != 2 {
		t.Errorf("unexpected version, expected 2, got %d", verNo)
		return
	}
	// check latest version
	latestVer, err := DatabaseNodeVersionLatest(topForm.UID)
	if err != nil {
		t.Error(err)
		return
	}
	if latestVer.Version != 2 {
		t.Errorf("unexpected version, expected 2, got %d", latestVer.Version)
		return
	}
	// fetch version list
	nodeVersionList, count, err := DatabaseNodeVersionList(topForm.UID, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if len(nodeVersionList) != 2 || count != 2 {
		t.Errorf("expected node version list to contain 2 items, got %d", count)
		return
	}
	// delete ver 2
	if err := DatabaseNodeVersionDelete(topForm.UID, verNo); err != nil {
		t.Error(err)
		return
	}
	// check latest version
	latestVer, err = DatabaseNodeVersionLatest(topForm.UID)
	if err != nil {
		t.Error(err)
		return
	}
	if latestVer.Version != 1 {
		t.Errorf("unexpected version, expected 1, got %d", latestVer.Version)
		return
	}
}

func TestDatabaseNode(t *testing.T) {
	if err := databaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer databaseClose()
	testCleanDatabase()
	// create form top
	team := "TESTTEAMA"
	topForm := NodeTop{
		UID:    generateUID(),
		Type:   NodeForm,
		Label:  "Test Form",
		Parent: team,
	}
	if err := DatabaseNodeTopStore(&topForm); err != nil {
		t.Error(err)
		return
	}
	// create version
	nodeVersion := NodeVersion{
		UID:   topForm.UID,
		State: NodeDraft,
		Tree:  getTestTree(topForm.UID),
	}
	ver, err := DatabaseNodeVersionNew(&nodeVersion)
	if err != nil {
		t.Error(err)
		return
	}
	if ver != 1 {
		t.Errorf("unexpected version, expected 1, got %d", ver)
		return
	}
	// fetch
	fetchedVersion, err := DatabaseNodeVersionFetch(topForm.UID, ver)
	if err != nil {
		t.Error(err)
		return
	}
	if nodeVersion.Tree.Count() != fetchedVersion.Tree.Count() {
		t.Errorf("unexpected database node list length, expected %d, got %d", nodeVersion.Tree.Count(), fetchedVersion.Tree.Count())
		return
	}
	// overwrite existing
	nodeVersion.Tree.Children[0].Children[0].Data["label"] = "Testing 123"
	if err := DatabaseNodeVersionUpdate(&nodeVersion); err != nil {
		t.Error(err)
		return
	}
	// refetch test nodes from database
	fetchedVersion, err = DatabaseNodeVersionFetch(topForm.UID, ver)
	if err != nil {
		t.Error(err)
		return
	}
	if nodeVersion.Tree.Children[0].Children[0].Data["label"] != fetchedVersion.Tree.Children[0].Children[0].Data["label"] {
		t.Errorf("unexpected node label, expected %s, got %s", nodeVersion.Tree.Children[0].Children[0].Data["label"], fetchedVersion.Tree.Children[0].Children[0].Data["label"])
		return
	}
	if nodeVersion.Tree.Hash() != fetchedVersion.Tree.Hash() {
		t.Errorf("unexpected node tree hash")
		return
	}
}
