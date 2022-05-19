package main

import "errors"

var (
	ErrNoDBConnection = errors.New("no database connection")
)
