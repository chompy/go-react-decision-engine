package main

import (
	"time"
)

// NodeBase contains base data that all node related structs should contain.
type NodeBase struct {
	UID      string    `bson:"uid" json:"uid"`
	Created  time.Time `bson:"created" json:"created"`
	Modified time.Time `bson:"modified" json:"modified"`
}

// NodeType is the top level node type.
type NodeType string

const (
	NodeForm     NodeType = "form"
	NodeDocument NodeType = "document"
)

// NodeTop is a top level node for any decision tree.
type NodeTop struct {
	NodeBase
	Type   NodeType `bson:"type" json:"type"`
	Parent string   `bson:"parent" json:"parent"`
	Label  string   `bson:"label" json:"label"`
}

// NodeState is the current state of a node version
type NodeState string

const (
	NodeDraft     NodeState = "draft"
	NodePublished NodeState = "published"
	NodeArchived  NodeState = "archived"
)

// NodeVersion is a node's version and its state.
type NodeVersion struct {
	NodeBase
	Version int       `bson:"version" json:"version"`
	State   NodeState `bson:"state" json:"state"`
}

// Node is a node in a form or document.
type Node struct {
	NodeBase
	Version int                    `bson:"version" json:"version"`
	Root    string                 `bson:"root" json:"root"`
	Parent  string                 `bson:"parent" json:"parent"`
	Type    string                 `bson:"type" json:"type"`
	Tags    []string               `bson:"tags" json:"tags"`
	Data    map[string]interface{} `bson:"data" json:"data"`
}
