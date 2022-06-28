package main

// Node is a node in a form or document.
type Node struct {
	UID    string   `bson:"uid" json:"uid"`
	Type   string   `bson:"type" json:"type"`
	Tags   []string `bson:"tags" json:"tags"`
	Parent string   `bson:"parent" json:"parent"`
	Data   NodeData `bson:"data" json:"data"`
}

// NodeData is data related to a node.
type NodeData map[string]interface{}
