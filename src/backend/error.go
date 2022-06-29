package main

import "errors"

var (
	ErrNoData                  = errors.New("no data provided")
	ErrNoUser                  = errors.New("no user provided")
	ErrNoDBConnection          = errors.New("no database connection")
	ErrUserNotFound            = errors.New("user not found")
	ErrUserNotOnTeam           = errors.New("user does not belong to team")
	ErrInvalidCredentials      = errors.New("invalid login credentials")
	ErrInvalidPermission       = errors.New("user does not have permission")
	ErrHTTPInvalidPayload      = errors.New("http invalid payload")
	ErrHTTPInvalidSession      = errors.New("http invalid session")
	ErrHTTPMissingParam        = errors.New("http missing query parameter")
	ErrHTTPLoginRequired       = errors.New("http login required")
	ErrDBInvalidObjectType     = errors.New("invalid object type for database storage")
	ErrObjMissingParam         = errors.New("object missing required parameter")
	ErrObjInvalidParam         = errors.New("object has an invalid parameter")
	ErrCannotDeleteOnlyVersion = errors.New("cannot delete only tree version")
)
