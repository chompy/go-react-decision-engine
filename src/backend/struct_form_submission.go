package main

import "time"

type FormSubmission struct {
	Key         string              `bson:"key" json:"key"`
	TreeUID     string              `bson:"tree_uid" json:"tree_uid"`
	TreeVersion int                 `bson:"tree_version" json:"tree_version"`
	Created     time.Time           `bson:"created" json:"created"`
	Modified    time.Time           `bson:"modified" json:"modified"`
	Creator     string              `bson:"creator" json:"creator"`
	Modifier    string              `bson:"modifier" json:"modifier"`
	Answers     map[string][]string `bson:"answers" json:"answers"`
}
