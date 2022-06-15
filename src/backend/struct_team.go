package main

import "time"

type Team struct {
	UID     string    `json:"uid"`
	Name    string    `json:"name"`
	Created time.Time `json:"created"`
	Creator string    `json:"creator"`
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
