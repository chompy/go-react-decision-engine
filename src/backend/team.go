package main

import "time"

type Team struct {
	UID     string    `json:"uid"`
	Name    string    `json:"name"`
	Created time.Time `json:"created"`
}

type TeamUser struct {
	User       string `json:"user"`
	Team       string `json:"team"`
	PermInvite bool   `json:"perm_invite"`
	PermAdmin  bool   `json:"perm_admin"`
}

func FetchTeamByUID(uid string) (*Team, error) {
	// stubbed out team
	return &Team{
		UID:     uid,
		Name:    "Test Team {" + uid + "}",
		Created: time.Now(),
	}, nil
}

func (t *Team) FetchUsers() ([]*TeamUser, error) {
	// stubbed out team user
	return []*TeamUser{
		&TeamUser{
			User:       "USER1",
			Team:       t.UID,
			PermInvite: true,
			PermAdmin:  true,
		},
	}, nil
}
