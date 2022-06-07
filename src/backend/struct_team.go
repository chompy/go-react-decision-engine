package main

import "time"

type Team struct {
	UID     string    `json:"uid"`
	Name    string    `json:"name"`
	Created time.Time `json:"created"`
	Creator string    `json:"creator"`
}

type TeamUser struct {
	User       string         `json:"user"`
	Team       string         `json:"team"`
	Permission UserPermission `json:"permission"`
}

func FetchTeamByUID(uid string) (*Team, error) {
	// stubbed out team
	return &Team{
		UID:     uid,
		Name:    "Test Team {" + uid + "}",
		Created: time.Now(),
		Creator: "USER1",
	}, nil
}

func (t *Team) FetchUsers() ([]*TeamUser, error) {
	// stubbed out team user
	return []*TeamUser{
		&TeamUser{
			User:       "USER1",
			Team:       t.UID,
			Permission: PermTeamAdmin,
		},
	}, nil
}
