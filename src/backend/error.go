package main

import "errors"

var (
	ErrNoDBConnection      = errors.New("no database connection")
	ErrUserNotFound        = errors.New("user not found")
	ErrInvalidCredientials = errors.New("invalid login credientials")
	ErrHTTPInvalidPayload  = errors.New("http invalid payload")
	ErrHTTPInvalidSession  = errors.New("http invalid session")
	ErrHTTPMissingParam    = errors.New("http missing query parameter")
	ErrHTTPLoginRequired   = errors.New("http login required")
)
