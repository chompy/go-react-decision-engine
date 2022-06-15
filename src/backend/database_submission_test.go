package main

import (
	"testing"
)

func TestDatabaseSubmission(t *testing.T) {
	if err := databaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer databaseClose()
	testCleanDatabase()
	rootUid := generateUID()
	ud1 := &Submission{
		Key:         "UD1",
		RootUID:     rootUid,
		RootVersion: 1,
		Answers:     map[string][]string{"question1": []string{"answer1"}, "question2": []string{"test1", "test2"}},
	}
	ud2 := &Submission{
		Key:         "UD2",
		RootUID:     rootUid,
		RootVersion: 2,
		Answers:     map[string][]string{"question1": []string{"answer1"}, "question2": []string{"test3", "test4"}},
	}
	if err := DatabaseSubmissionStore(ud1); err != nil {
		t.Error(err)
		return
	}
	if err := DatabaseSubmissionStore(ud2); err != nil {
		t.Error(err)
		return
	}

	userDataList, count, err := DatabaseSubmissionList(rootUid, 0, nil, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if count != 2 {
		t.Errorf("unexpected user data count, expected 2, got %d", count)
		return
	}
	userDataList, count, err = DatabaseSubmissionList(rootUid, 2, nil, 0)
	if count != 1 {
		t.Errorf("unexpected user data count, expected 1, got %d", count)
		return
	}
	if userDataList[0].Key != ud2.Key || userDataList[0].Answers["question2"][0] != "test3" {
		t.Errorf("unexpected user data object fetched")
		return
	}

	fetchedUserData, err := DatabaseSubmissionFetch(ud1.Key, rootUid, ud1.RootVersion)
	if err != nil {
		t.Error(err)
		return
	}
	if fetchedUserData.Answers["question2"][1] != "test2" {
		t.Errorf("unexpected user data object fetched")
		return
	}

	if err := DatabaseSubmissionDelete(ud2.Key, rootUid, ud2.RootVersion); err != nil {
		t.Error(err)
		return
	}
	userDataList, count, err = DatabaseSubmissionList(rootUid, 0, nil, 0)
	if err != nil {
		t.Error(err)
		return
	}
	if count != 1 {
		t.Errorf("unexpected user data count, expected 1, got %d", count)
		return
	}

}
