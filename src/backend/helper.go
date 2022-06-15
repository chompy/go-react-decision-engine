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
	case NodeType, NodeTop, *NodeTop:
		{
			return "node_top"
		}
	case NodeVersion, *NodeVersion:
		{
			return "node_version"
		}
	case UserData, *UserData:
		{
			return "user_data"
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
	case NodeTop, *NodeTop:
		{
			return &NodeTop{}
		}
	case NodeVersion, *NodeVersion:
		{
			return &NodeVersion{}
		}
	case Node, *Node:
		{
			return &Node{}
		}
	case UserData, *UserData:
		{
			return &UserData{}
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
