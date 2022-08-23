package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

const TeamOptionAllowNewUser = "allow_new_user"

type Team struct {
	ID        DatabaseID        `bson:"_id" json:"id"`
	Created   time.Time         `bson:"created,omitempty" json:"created"`
	Modified  time.Time         `bson:"modified,omitempty" json:"modified"`
	Creator   DatabaseID        `bson:"creator,omitempty" json:"creator"`
	Modifier  DatabaseID        `bson:"modifier,omitempty" json:"modifier"`
	Name      string            `bson:"name,omitempty" json:"name"`
	Customize map[string]string `bson:"customize,omitempty" json:"customize"`
	Options   map[string]string `bson:"options,omitempty" json:"options"`
}

func FetchTeamByID(id string, user *User) (*Team, error) {
	if user != nil && id != user.Team.String() {
		return nil, ErrInvalidPermission
	}
	dbId := DatabaseIDFromString(id)
	res, err := databaseFetch(Team{}, bson.M{"_id": dbId}, nil)
	if err != nil {
		return nil, err
	}
	team := res.(*Team)
	return team, nil
}

func (t *Team) Store(user *User) error {
	if err := checkStorePermission(t, user); err != nil {
		return err
	}
	t.Modified = time.Now()
	t.Modifier = user.ID
	if t.ID.IsEmpty() {
		t.ID = GenerateDatabaseId()
		t.Created = t.Modified
		t.Creator = user.ID
	}
	return databaseStoreOne(t)
}

func (t *Team) Delete(user *User) error {
	if t.Creator != user.ID {
		return ErrInvalidPermission
	}
	// TODO technically this should delete team, users, and all documents under team.......
	return nil
}
