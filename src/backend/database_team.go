package main

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func DatabaseTeamFetch(uid string) (*Team, error) {
	col, err := databaseCollectionFromData(Team{})
	if err != nil {
		return nil, err
	}
	res := col.FindOne(databaseContext(), bson.M{"uid": uid})
	if res.Err() != nil {
		return nil, res.Err()
	}
	t := &Team{}
	err = res.Decode(t)
	return t, err
}

func DatabaseTeamStore(team *Team) error {
	if team == nil {
		return ErrNoData
	}
	col, err := databaseCollectionFromData(team)
	if err != nil {
		return err
	}
	opts := options.Update()
	opts.SetUpsert(true)
	doc, err := toBSONDoc(team)
	if err != nil {
		return err
	}
	_, err = col.UpdateOne(databaseContext(), bson.M{"uid": team.UID}, bson.D{{Key: "$set", Value: doc}}, opts)
	return err
}
