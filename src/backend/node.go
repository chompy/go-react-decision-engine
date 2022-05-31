package main

import (
	"time"
)

// RootNode is the top level node of a decision tree.
type RootNode struct {
	UID       string
	Version   int
	Created   time.Time
	Documents []string
}

// Node is a node in a decision tree.
type Node struct {
	UID     string                 `json:"uid"`
	Version int                    `json:"ver"`
	Root    string                 `json:"root"`
	Parent  string                 `json:"par"`
	Type    string                 `json:"typ"`
	Tags    []string               `json:"tag"`
	Label   string                 `json:"lab"`
	Data    map[string]interface{} `json:"dat"`
}

/*
export const KEY_UID = '_uid';
export const KEY_VERSION = '_ver';
export const KEY_CHILDREN = '_chi';
export const KEY_TYPE = '_typ';
export const KEY_LANGUAGE = '_lan';
export const KEY_PRIORITY = '_pri';
export const KEY_TAGS = '_tag';
*/
