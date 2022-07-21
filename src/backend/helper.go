package main

import (
	"go.mongodb.org/mongo-driver/bson"
)

func getDatabaseCollectionNameFromData(data interface{}) string {
	switch data.(type) {
	case TreeType, TreeRoot, *TreeRoot:
		{
			return "tree_root"
		}
	case TreeVersion, *TreeVersion:
		{
			return "tree_version"
		}
	case FormSubmission, *FormSubmission:
		{
			return "submission"
		}
	case User, *User:
		{
			return "user"
		}
	case Team, *Team:
		{
			return "team"
		}
	case RuleTemplate, *RuleTemplate:
		{
			return "rule_template"
		}
	}
	return ""
}

func toBSONDoc(data interface{}) (*bson.D, error) {
	docRaw, err := bson.Marshal(data)
	if err != nil {
		return nil, err
	}
	doc := &bson.D{}
	err = bson.Unmarshal(docRaw, doc)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func getEmptyStruct(dataType interface{}) interface{} {
	switch dataType.(type) {
	case TreeRoot, *TreeRoot:
		{
			return &TreeRoot{}
		}
	case TreeVersion, *TreeVersion:
		{
			return &TreeVersion{}
		}
	case Node, *Node:
		{
			return &Node{}
		}
	case FormSubmission, *FormSubmission:
		{
			return &FormSubmission{}
		}
	case User, *User:
		{
			return &User{}
		}
	case Team, *Team:
		{
			return &Team{}
		}
	case RuleTemplate, *RuleTemplate:
		{
			return &RuleTemplate{}
		}
	}
	return nil
}
