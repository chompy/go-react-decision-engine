package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Team struct {
	ID       primitive.ObjectID `bson:"_id" json:"id"`
	Created  time.Time          `bson:"created,omitempty" json:"created"`
	Modified time.Time          `bson:"modified,omitempty" json:"modified"`
	Creator  primitive.ObjectID `bson:"creator,omitempty" json:"creator"`
	Modifier primitive.ObjectID `bson:"modifier,omitempty" json:"modifier"`
	Name     string             `bson:"name" json:"name"`
}

func FetchTeamByID(id string, user *User) (*Team, error) {
	if user != nil && id != user.Team.Hex() {
		return nil, ErrInvalidPermission
	}
	pId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	res, err := databaseFetch(Team{}, bson.M{"_id": pId}, nil)
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
	if t.ID.IsZero() {
		t.ID = primitive.NewObjectID()
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
