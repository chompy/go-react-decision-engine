package main

import "time"

type Submission struct {
	Key         string              `bson:"key" json:"key"`
	RootUID     string              `bson:"root_uid" json:"root_uid"`
	RootVersion int                 `bson:"root_version" json:"root_version"`
	Created     time.Time           `bson:"created" json:"created"`
	Modified    time.Time           `bson:"modified" json:"modified"`
	Creator     string              `bson:"creator" json:"creator"`
	Modifier    string              `bson:"modifier" json:"modifier"`
	Answers     map[string][]string `bson:"answers" json:"answers"`
}
