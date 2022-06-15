package main

import (
	"crypto/md5"
	"fmt"
)

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
