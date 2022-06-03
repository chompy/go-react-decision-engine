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
	Version  int       `bson:"version" json:"version"`
	State    NodeState `bson:"state" json:"state"`
}

// Node is a node in a form or document.
type Node struct {
	UID      string                 `bson:"uid" json:"uid"`
	Created  time.Time              `bson:"created" json:"created"`
	Modified time.Time              `bson:"modified" json:"modified"`
	Version  int                    `bson:"version" json:"version"`
	ERoot    string                 `bson:"-" json:"root,omitempty"`
	EParent  string                 `bson:"-" json:"parent,omitempty"`
	Path     []string               `bson:"path" json:"path"`
	Type     string                 `bson:"type" json:"type"`
	Tags     []string               `bson:"tags" json:"tags"`
	Data     map[string]interface{} `bson:"data" json:"data"`
}

func (n Node) Root() string {
	if len(n.Path) > 0 {
		return n.Path[len(n.Path)-1]
	}
	return n.ERoot
}

func (n Node) Parent() string {
	if len(n.Path) > 0 {
		return n.Path[0]
	}
	return n.EParent
}

func NodeListResolvePathes(nodes []*Node) {
	var crawlParents func(currentNode *Node) []string
	crawlParents = func(currentNode *Node) []string {
		out := make([]string, 0)
		if currentNode.EParent == "" {
			return out
		}
		for _, node := range nodes {
			if node.UID == currentNode.EParent {
				out = append(out, node.UID)
				out = append(out, crawlParents(node)...)
				break
			}
		}
		return out
	}
	for _, node := range nodes {
		if node.ERoot == "" || node.ERoot == node.UID {
			continue
		}
		node.Path = make([]string, 0)
		node.Path = append(node.Path, node.ERoot)
		if node.EParent != "" {
			node.Path = append(node.Path, crawlParents(node)...)
		}
	}
}

func NodeListCheck(nodes []*Node) error {
	ver := nodes[0].Version
	root := nodes[0].Root()
	if root == "" {
		return ErrNodeMissingRoot
	}
	for _, node := range nodes {
		if node.UID == "" {
			return ErrNodeMissingUID
		}
		if ver != node.Version {
			return ErrNodeVersionMismatch
		}
	}
	return nil
}
