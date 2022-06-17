package main

func getTestTree(root string) Node {
	return Node{
		UID:  root,
		Type: "root",
		Tags: []string{"test"},
		Children: []Node{
			Node{
				UID:  "node-a",
				Type: "group",
				Children: []Node{
					Node{
						UID:  "node-a-1",
						Type: "question",
						Data: map[string]interface{}{
							"label": "Is this a test question?",
						},
						Children: []Node{
							Node{
								UID:  "node-a-1-1",
								Type: "answer",
								Data: map[string]interface{}{
									"label": "Yes",
									"value": "yes",
								},
							},
							Node{
								UID:  "node-a-1-2",
								Type: "answer",
								Data: map[string]interface{}{
									"label": "No",
									"value": "no",
								},
							},
						},
					},
				},
			},
			Node{
				UID:  "node-b",
				Type: "group",
				Children: []Node{
					Node{
						UID:  "node-b-1",
						Type: "question",
						Data: map[string]interface{}{
							"label": "Enter something...",
						},
					},
				},
			},
		},
	}
}
