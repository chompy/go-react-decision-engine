package main

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type TypeaheadTreeNode struct {
	UID     string `bson:"_id" json:"uid"`
	Type    string `bson:"type" json:"type"`
	Version int    `bson:"version" json:"version"`
	Label   string `bson:"label" json:"label"`
	Parent  string `bson:"parent" json:"parent"`
}

func ListTreeTypeahead(id string, maxVersion int, user *User) ([]TypeaheadTreeNode, error) {
	// collect params
	dbId := DatabaseIDFromString(id)
	// get collection
	col, err := databaseCollectionFromData(TreeVersion{})
	if err != nil {
		return nil, err
	}
	// build pipeline
	pipeline := mongo.Pipeline{
		bson.D{bson.E{Key: "$match", Value: bson.M{"root_id": dbId, "version": bson.M{"$lte": maxVersion}}}},
		bson.D{bson.E{Key: "$unwind", Value: "$tree"}},
		bson.D{bson.E{Key: "$group", Value: bson.M{
			"_id":     "$tree.uid",
			"version": bson.M{"$max": "$version"},
			"type":    bson.M{"$max": "$tree.type"},
			"label":   bson.M{"$max": "$tree.label"},
			"parent":  bson.M{"$max": "$tree.parent"},
		}}},
	}
	// perform aggregate query
	cur, err := col.Aggregate(databaseContext(), pipeline)
	if err != nil {
		return nil, err
	}
	defer cur.Close(databaseContext())
	// decode results
	res := make([]TypeaheadTreeNode, 0)
	for cur.Next(databaseContext()) {
		node := TypeaheadTreeNode{}
		if err := cur.Decode(&node); err != nil {
			return nil, err
		}
		res = append(res, node)
	}
	return res, nil
}
