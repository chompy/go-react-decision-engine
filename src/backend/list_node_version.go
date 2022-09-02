package main

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type NodeLookup struct {
	UID         string `bson:"_id" json:"uid"`
	Type        string `bson:"type" json:"type"`
	Version     int    `bson:"version" json:"version"`
	Label       string `bson:"label" json:"label"`
	Parent      string `bson:"parent" json:"parent"`
	AnswerValue string `bson:"answer_value" json:"answer_value"`
}

// ListNodeVersion lists all nodes created for given tree root up to given version.
func ListNodeVersion(id string, maxVersion int, user *User) ([]NodeLookup, error) {
	// collect params
	dbId := DatabaseIDFromString(id)
	// get collection
	col, err := databaseCollectionFromData(TreeVersion{})
	if err != nil {
		return nil, err
	}
	// build pipeline
	filter := bson.M{"root_id": dbId}
	if maxVersion > 0 {
		filter["version"] = bson.M{"$lte": maxVersion}
	}
	pipeline := mongo.Pipeline{
		bson.D{bson.E{Key: "$match", Value: filter}},
		bson.D{bson.E{Key: "$unwind", Value: "$tree"}},
		bson.D{bson.E{Key: "$group", Value: bson.M{
			"_id":          "$tree.uid",
			"version":      bson.M{"$max": "$version"},
			"type":         bson.M{"$max": "$tree.type"},
			"label":        bson.M{"$max": "$tree.label"},
			"parent":       bson.M{"$max": "$tree.parent"},
			"answer_value": bson.M{"$max": "$tree.data.value"},
		}}},
	}
	// perform aggregate query
	cur, err := col.Aggregate(databaseContext(), pipeline)
	if err != nil {
		return nil, err
	}
	defer cur.Close(databaseContext())
	// decode results
	res := make([]NodeLookup, 0)
	for cur.Next(databaseContext()) {
		node := NodeLookup{}
		if err := cur.Decode(&node); err != nil {
			return nil, err
		}
		res = append(res, node)
	}
	return res, nil
}
