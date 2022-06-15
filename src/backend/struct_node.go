package main

import (
	"crypto/md5"
	"fmt"
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

// Node is a node in a form or document.
type Node struct {
	UID      string   `bson:"uid" json:"uid"`
	Type     string   `bson:"type" json:"type"`
	Tags     []string `bson:"tags" json:"tags"`
	Children []Node   `bson:"children" json:"children"`
	Data     NodeData `bson:"data" json:"data"`
}

// Count returns the number of nodes under the given node.
func (n Node) Count() int {
	out := 1
	for _, c := range n.Children {
		out += c.Count()
	}
	return out
}

// Hash returns a hash unique to node and its children. Used to test equally of two trees.
func (n Node) Hash() string {
	out := n.UID + n.Type
	for _, tag := range n.Tags {
		out += tag
	}
	for k, v := range n.Data {
		switch v := v.(type) {
		case string:
			{
				out += k + v
				break
			}
		}
	}
	for _, c := range n.Children {
		out += c.Hash()
	}
	return fmt.Sprintf("%x", md5.Sum([]byte(out)))
}

// NodeData is data related to a node.
type NodeData map[string]interface{}
