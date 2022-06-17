package main

import (
	"math/rand"
	"strings"
	"time"

	"github.com/martinlindhe/base36"
	"go.mongodb.org/mongo-driver/bson"
)

func generateUID() string {
	rand.Seed(time.Now().UnixMicro())
	ut := time.Now().Unix()
	return strings.ToLower(base36.Encode(uint64(ut)) + base36.Encode(uint64(rand.Intn(35))))
}

func getDatabaseCollectionNameFromData(data interface{}) string {
	switch data.(type) {
	case TreeType, TreeRoot, *TreeRoot:
		{
			return "tree_root"
		}
	case TreeVersion, *TreeVersion:
		{
			return "tree_version"
		}
	case FormSubmission, *FormSubmission:
		{
			return "submission"
		}
	case User, *User:
		{
			return "user"
		}
	case Team, *Team:
		{
			return "team"
		}
	}
	return ""
}

func toBSONDoc(data interface{}) (*bson.D, error) {
	docRaw, err := bson.Marshal(data)
	if err != nil {
		return nil, err
	}
	doc := &bson.D{}
	err = bson.Unmarshal(docRaw, doc)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func getEmptyStruct(dataType interface{}) interface{} {
	switch dataType.(type) {
	case TreeRoot, *TreeRoot:
		{
			return &TreeRoot{}
		}
	case TreeVersion, *TreeVersion:
		{
			return &TreeVersion{}
		}
	case Node, *Node:
		{
			return &Node{}
		}
	case FormSubmission, *FormSubmission:
		{
			return &FormSubmission{}
		}
	case User, *User:
		{
			return &User{}
		}
	case Team, *Team:
		{
			return &Team{}
		}
	}
	return nil
}
