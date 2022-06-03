package main

import (
	"context"
	"testing"

	"go.mongodb.org/mongo-driver/bson"
)

func testGetConfig() *Config {
	return &Config{
		DatabaseURI:  "mongodb://localhost:27017",
		DatabaseName: "ccde_testing",
	}
}

func testCleanDatabase() error {
	nodeTopCol, err := DatabaseCollectionFromData(NodeTop{})
	if err != nil {
		return err
	}
	_, err = nodeTopCol.DeleteMany(context.Background(), bson.D{})
	if err != nil {
		return err
	}
	return nil

}

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
}
