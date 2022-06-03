package main

import "errors"

var (
	ErrNoData              = errors.New("no data provided")
	ErrNoDBConnection      = errors.New("no database connection")
	ErrUserNotFound        = errors.New("user not found")
	ErrUserNotOnTeam       = errors.New("user does not belong to team")
	ErrInvalidCredentials  = errors.New("invalid login credentials")
	ErrHTTPInvalidPayload  = errors.New("http invalid payload")
	ErrHTTPInvalidSession  = errors.New("http invalid session")
	ErrHTTPMissingParam    = errors.New("http missing query parameter")
	ErrHTTPLoginRequired   = errors.New("http login required")
	ErrDBInvalidObjectType = errors.New("invalid object type for database storage")
	ErrNodeMissingUID      = errors.New("node missing uid")
	ErrNodeMissingParam    = errors.New("node missing parameter")
	ErrNodeMissingType     = errors.New("node missing type")
	ErrNodeNotRoot         = errors.New("expected root node")
)
