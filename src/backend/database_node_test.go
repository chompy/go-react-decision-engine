package main

import (
	"testing"
)

func TestStoreFetchNodeTop(t *testing.T) {
	if err := DatabaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer DatabaseClose()
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
	if err := DatabaseNodeTopStore(&topForm); err != nil {
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
	if err := DatabaseNodeTopStore(&topDoc); err != nil {
		t.Error(err)
		return
	}
	// test form retrieve
	formRes, formCount, err := DatabaseNodeTopList(team, NodeForm, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if formCount != 1 {
		t.Errorf("unexpected result count")
		return
	}
	if formRes[0].UID != topForm.UID {
		t.Errorf("unexpected form uid, expected %s, got %s", topForm.UID, formRes[0].UID)
		return
	}
	// test document retrieve
	docRes, docCount, err := DatabaseNodeTopList(topForm.UID, NodeDocument, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if docCount != 1 {
		t.Errorf("unexpected result count")
		return
	}
	if docRes[0].UID != topDoc.UID {
		t.Errorf("unexpected doc uid, expected %s, got %s", topDoc.UID, docRes[0].UID)
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

func TestStoreFetchNodeVersion(t *testing.T) {
	if err := DatabaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer DatabaseClose()
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
	ver, err := DatabaseNodeVersionNew(&nodeVersion)
	if err != nil {
		t.Error(err)
		return
	}
	if ver != 1 {
		t.Errorf("unexpected version, expected 1, got %d", ver)
		return
	}
	// check if version exists
	verExist, err := DatabaseNodeVersionExists(topForm.UID, ver)
	if err != nil {
		t.Error(err)
		return
	}
	if !verExist {
		t.Errorf("expected version %d to exist", ver)
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
	ver, err = DatabaseNodeVersionNew(&nodeVersion2)
	if err != nil {
		t.Error(err)
		return
	}
	if ver != 2 {
		t.Errorf("unexpected version, expected 2, got %d", ver)
		return
	}
	// check latest version
	ver, err = DatabaseNodeVersionLatest(topForm.UID)
	if err != nil {
		t.Error(err)
		return
	}
	if ver != 2 {
		t.Errorf("unexpected version, expected 2, got %d", ver)
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
	if err := DatabaseNodeVersionDelete(topForm.UID, ver); err != nil {
		t.Error(err)
		return
	}
	// check latest version
	ver, err = DatabaseNodeVersionLatest(topForm.UID)
	if err != nil {
		t.Error(err)
		return
	}
	if ver != 1 {
		t.Errorf("unexpected version, expected 1, got %d", ver)
		return
	}
}

func TestStoreFetchNode(t *testing.T) {
	if err := DatabaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer DatabaseClose()
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
	ver, err := DatabaseNodeVersionNew(&nodeVersion)
	if err != nil {
		t.Error(err)
		return
	}
	if ver != 1 {
		t.Errorf("unexpected version, expected 1, got %d", ver)
		return
	}
	// store test nodes
	nodeList := getTestNodes(topForm.UID)
	if err := DatabaseNodeStore(nodeList); err != nil {
		t.Error(err)
		return
	}
	// fetch test nodes from database
	dbNodeList, err := DatabaseNodeList(topForm.UID, ver, "")
	if err != nil {
		t.Error(err)
		return
	}
	if len(dbNodeList) != len(nodeList) {
		t.Errorf("unexpected database node list length, expected %d, got %d", len(nodeList), len(dbNodeList))
		return
	}
	// fetch sub list
	dbNodeList, err = DatabaseNodeList(topForm.UID, ver, nodeList[0].UID)
	if err != nil {
		t.Error(err)
		return
	}
	if len(dbNodeList) != 3 {
		t.Errorf("unexpected database node list length, expected 3, got %d", len(dbNodeList))
		return
	}
	if dbNodeList[2].UID != "node-a-1-2" {
		t.Errorf("unexpected UID value from 3rd item in data node list, expected 'node-a-1-2', got %s", dbNodeList[2].UID)
		return
	}
	// overwrite existing
	nodeList[1].Data["label"] = "Testing 123"
	if err := DatabaseNodeStore([]*Node{nodeList[1]}); err != nil {
		t.Error(err)
		return
	}
	// refetch test nodes from database
	dbNodeList, err = DatabaseNodeList(topForm.UID, ver, "")
	if err != nil {
		t.Error(err)
		return
	}
	if dbNodeList[1].Data["label"] != nodeList[1].Data["label"] {
		t.Errorf("unexpected node label, expected %s, got %s", nodeList[1].Data["label"], dbNodeList[1].Data["label"])
		return
	}
	// delete existing
	if err := DatabaseNodeDelete(topForm.UID, ver, []string{nodeList[2].UID}); err != nil {
		t.Error(err)
		return
	}
	// refetch test nodes from database
	dbNodeList, err = DatabaseNodeList(topForm.UID, ver, "")
	if err != nil {
		t.Error(err)
		return
	}
	if len(dbNodeList) != len(nodeList)-1 {
		t.Errorf("expected length of database node list to decrease by one")
		return
	}
	// delete version
	if err := DatabaseNodeVersionDelete(topForm.UID, ver); err != nil {
		t.Error(err)
		return
	}
	// refetch test nodes from database
	dbNodeList, err = DatabaseNodeList(topForm.UID, ver, "")
	if err != nil {
		t.Error(err)
		return
	}
	if len(dbNodeList) != 0 {
		t.Errorf("expected length of database node list to be be zero")
		return
	}
}
