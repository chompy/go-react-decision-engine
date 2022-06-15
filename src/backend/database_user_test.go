package main

import (
	"testing"
)

func TestDatabaseUser(t *testing.T) {
	if err := databaseOpen(testGetConfig()); err != nil {
		t.Error(err)
		return
	}
	defer databaseClose()
	testCleanDatabase()
	// store
	hpw, _ := HashPassword("test1234")
	u := &User{
		UID:        generateUID(),
		Email:      "test@test.com",
		Password:   hpw,
		Team:       "TEAM1",
		Permission: PermAdmin,
	}
	if err := DatabaseUserStore(u); err != nil {
		t.Error(err)
		return
	}
	// fetch
	fetchedUser, err := DatabaseUserFetch(u.UID)
	if err != nil {
		t.Error(err)
		return
	}
	if fetchedUser.Email != u.Email || string(fetchedUser.Password) != string(u.Password) {
		t.Errorf("fetched user doesn't matched stored user")
		return
	}
	// update
	u.Email = "test2@test.com"
	if err := DatabaseUserStore(u); err != nil {
		t.Error(err)
		return
	}
	fetchedUser, err = DatabaseUserFetch(u.UID)
	if err != nil {
		t.Error(err)
		return
	}
	if fetchedUser.Email != u.Email {
		t.Errorf("fetched user doesn't matched updated stored user")
		return
	}
}
