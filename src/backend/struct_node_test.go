package main

import (
	"testing"
)

func getTestNodes(root string) []*Node {
	return []*Node{
		&Node{
			UID:     "node-a",
			Version: 1,
			Type:    "group",
			ERoot:   root,
			EParent: root,
		},
		&Node{
			UID:     "node-a-1",
			Version: 1,
			Type:    "question",
			ERoot:   root,
			EParent: "node-a",
			Data: map[string]interface{}{
				"label": "Is this a test question?",
			},
		},
		&Node{
			UID:     "node-a-1-1",
			Version: 1,
			Type:    "answer",
			ERoot:   root,
			EParent: "node-a-1",
			Data: map[string]interface{}{
				"label": "Yes",
				"value": "yes",
			},
		},
		&Node{
			UID:     "node-a-1-2",
			Version: 1,
			Type:    "answer",
			ERoot:   root,
			EParent: "node-a-1",
			Data: map[string]interface{}{
				"label": "No",
				"value": "no",
			},
		},
		&Node{
			UID:     "node-b",
			Version: 1,
			Type:    "group",
			ERoot:   root,
			EParent: root,
		},
		&Node{
			UID:     "node-b-1",
			Version: 1,
			Type:    "question",
			ERoot:   root,
			EParent: "node-b",
			Data: map[string]interface{}{
				"label": "Enter something...",
			},
		},
	}
}

func TestNodeListResolvePathes(t *testing.T) {
	root := generateUID()
	nodeList := getTestNodes(root)
	NodeListResolvePathes(nodeList)
	if nodeList[2].UID != "node-a-1-1" {
		t.Errorf("expected 4th node to be 'node-a-1-1'")
		return
	}
	if len(nodeList[2].Path) != 3 {
		t.Errorf("expected node 'node-a-1-1' to contain 3 items in path")
		return
	}
	if nodeList[2].Path[0] != "node-a-1" || nodeList[2].Path[1] != "node-a" || nodeList[2].Path[2] != root {
		t.Errorf("one or more items in 'node-a-1-1' are unexpected")
		return
	}
	if len(nodeList[0].Path) != 1 || nodeList[0].Path[0] != root {
		t.Errorf("expected 2nd node to contain only the root in path")
		return
	}
}
