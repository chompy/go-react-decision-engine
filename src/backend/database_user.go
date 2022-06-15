package main

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func DatabaseUserStore(user *User) error {
	if user == nil {
		return ErrNoData
	}
	col, err := databaseCollectionFromData(user)
	if err != nil {
		return err
	}
	opts := options.Update()
	opts.SetUpsert(true)
	doc, err := toBSONDoc(user)
	if err != nil {
		return err
	}
	_, err = col.UpdateOne(databaseContext(), bson.M{"uid": user.UID}, bson.D{{Key: "$set", Value: doc}}, opts)
	return err
}

func DatabaseUserFetch(uid string) (*User, error) {
	col, err := databaseCollectionFromData(User{})
	if err != nil {
		return nil, err
	}
	res := col.FindOne(databaseContext(), bson.M{"uid": uid})
	if res.Err() != nil {
		return nil, res.Err()
	}
	u := &User{}
	err = res.Decode(u)
	return u, err
}
