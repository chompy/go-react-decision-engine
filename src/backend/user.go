package main

import "time"

type UserType int

const (
	UserTypeNone   UserType = 0 // UserTypeNone is a non user.
	UserTypeNormal UserType = 1 // UserTypeNormal is a standard user.
	UserTypeAdmin  UserType = 2 // UserTypeAdmin is an admin user.
)

type User struct {
	UID      string    `json:"uid"`
	Email    string    `json:"email"`
	Password string    `json:"password"`
	Created  time.Time `json:"created"`
}
