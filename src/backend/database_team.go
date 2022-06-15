package main

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

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

func DatabaseTeamUserStore(teamUser *TeamUser) error {
	if teamUser == nil {
		return ErrNoData
	}
	col, err := databaseCollectionFromData(teamUser)
	if err != nil {
		return err
	}
	opts := options.Update()
	opts.SetUpsert(true)
	doc, err := toBSONDoc(teamUser)
	if err != nil {
		return err
	}
	_, err = col.UpdateOne(databaseContext(), bson.M{"user": teamUser.User, "team": teamUser.Team}, bson.D{{Key: "$set", Value: doc}}, opts)
	return err
}

func DatabaseTeamUserFetch(userUid string, teamUid string) (*TeamUser, error) {
	col, err := databaseCollectionFromData(TeamUser{})
	if err != nil {
		return nil, err
	}
	res := col.FindOne(databaseContext(), bson.M{"user": userUid, "team": teamUid})
	if res.Err() != nil {
		return nil, res.Err()
	}
	t := &TeamUser{}
	err = res.Decode(t)
	return t, err
}

func DatabaseTeamUserDelete(userUid string, teamUid string) error {
	col, err := databaseCollectionFromData(TeamUser{})
	if err != nil {
		return err
	}
	_, err = col.DeleteOne(databaseContext(), bson.M{"user": userUid, "team": teamUid})
	return err
}

//func DatabaseTeamUserList(team string, offset int) ([]*TeamUser, int, error)
