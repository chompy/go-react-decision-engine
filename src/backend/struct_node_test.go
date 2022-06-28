package main

func getTestTree(root string) []Node {
	return []Node{
		Node{
			UID:    root,
			Type:   "root",
			Tags:   []string{"test"},
			Parent: "",
		},
		Node{
			UID:    "node-a",
			Type:   "group",
			Parent: root,
		},
		Node{
			UID:    "node-a-1",
			Type:   "question",
			Parent: "node-a",
			Data: map[string]interface{}{
				"label": "Is this a test question?",
			},
		},
		Node{
			UID:    "node-a-1-1",
			Type:   "answer",
			Parent: "node-a-1",
			Data: map[string]interface{}{
				"label": "Yes",
				"value": "yes",
			},
		},
		Node{
			UID:    "node-a-1-2",
			Type:   "answer",
			Parent: "node-a-1",
			Data: map[string]interface{}{
				"label": "No",
				"value": "no",
			},
		},
		Node{
			UID:    "node-b",
			Type:   "group",
			Parent: root,
		},
		Node{
			UID:    "node-b-1",
			Type:   "question",
			Parent: "node-b",
			Data: map[string]interface{}{
				"label": "Enter something...",
			},
		},
	}
}
