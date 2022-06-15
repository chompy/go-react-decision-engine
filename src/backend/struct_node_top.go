package main

import (
	"time"
)

// NodeType is the top level node type.
type NodeType string

const (
	NodeForm     NodeType = "form"
	NodeDocument NodeType = "document"
)

// NodeTop is a top level node for any decision tree.
type NodeTop struct {
	UID      string    `bson:"uid" json:"uid"`
	Created  time.Time `bson:"created" json:"created"`
	Modified time.Time `bson:"modified" json:"modified"`
	Creator  string    `bson:"creator" json:"creator"`
	Modifier string    `bson:"modifier" json:"modifier"`
	Type     NodeType  `bson:"type" json:"type"`
	Parent   string    `bson:"parent" json:"parent"`
	Label    string    `bson:"label" json:"label"`
}

func FetchNodeTopByUID(uid string) (*NodeTop, error) {
	return DatabaseNodeTopFetch(uid)
}
