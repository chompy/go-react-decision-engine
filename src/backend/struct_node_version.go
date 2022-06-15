package main

import "time"

// NodeState is the current state of a node version
type NodeState string

const (
	NodeDraft     NodeState = "draft"
	NodePublished NodeState = "published"
	NodeArchived  NodeState = "archived"
)

// NodeVersion is a node's version and its state.
type NodeVersion struct {
	UID      string    `bson:"uid" json:"uid"`
	Created  time.Time `bson:"created" json:"created"`
	Modified time.Time `bson:"modified" json:"modified"`
	Creator  string    `bson:"creator" json:"creator"`
	Modifier string    `bson:"modifier" json:"modifier"`
	Version  int       `bson:"version" json:"version"`
	State    NodeState `bson:"state" json:"state"`
	Tree     Node      `bson:"tree" json:"tree"`
}
