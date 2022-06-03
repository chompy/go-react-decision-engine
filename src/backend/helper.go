package main

import (
	"math/rand"
	"strings"
	"time"

	"github.com/martinlindhe/base36"
	"go.mongodb.org/mongo-driver/bson"
)

func generateUID() string {
	ut := time.Now().Unix()
	return strings.ToLower(base36.Encode(uint64(ut)) + base36.Encode(uint64(rand.Intn(35))))
}

func getNodeTypeFromName(name string) interface{} {
	switch name {
	case "form", "document", "top":
		{
			return &NodeTop{}
		}
	default:
		{
			return &Node{}
		}
	}
}

func getDatabaseCollectionNameFromData(data interface{}) string {
	switch data.(type) {
	case NodeType, NodeTop, *NodeTop:
		{
			return "node-top"
		}
	case NodeVersion, *NodeVersion:
		{
			return "node-version"
		}
	case Node, *Node:
		{
			return "node"
		}
	case User, *User:
		{
			return "user"
		}
	case Team, *Team:
		{
			return "team"
		}
	case TeamUser, *TeamUser:
		{
			return "team-user"
		}
	}
	return ""
}

func getNodeUidVersion(data interface{}) (string, int) {
	switch o := data.(type) {
	case NodeTop:
		{
			return o.UID, 0
		}
	case *NodeTop:
		{
			return o.UID, 0
		}
	case NodeVersion:
		{
			return o.UID, o.Version
		}
	case *NodeVersion:
		{
			return o.UID, o.Version
		}
	case Node:
		{
			return o.UID, o.Version
		}
	case *Node:
		{
			return o.UID, o.Version
		}
	}
	return "", 0
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
