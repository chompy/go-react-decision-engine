package main

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	UID        string         `bson:"uid" json:"uid"`
	Created    time.Time      `bson:"created" json:"created"`
	Modified   time.Time      `bson:"modified" json:"modified"`
	Email      string         `bson:"email" json:"email"`
	Password   []byte         `bson:"password" json:"-"`
	Team       string         `bson:"team" json:"team"`
	Permission UserPermission `bson:"permission" json:"permission"`
}

func FetchUserByUID(uid string) (*User, error) {
	// stubbed out user
	hashedPw, err := HashPassword("test1234")
	if err != nil {
		return nil, err
	}
	return &User{
		UID:        "USER1",
		Email:      "admin@example.com",
		Password:   hashedPw,
		Created:    time.Now(),
		Team:       "TEAM1",
		Permission: PermAdmin,
	}, nil
}

func FetchUserByEmail(email string) (*User, error) {
	// stubbed out for now
	if email != "admin@example.com" {
		return nil, ErrUserNotFound
	}
	return FetchUserByUID("USER1")
}

func HashPassword(password string) ([]byte, error) {
	hashedPw, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	return hashedPw, nil
}

func (u *User) CheckPassword(password string) error {
	if err := bcrypt.CompareHashAndPassword(u.Password, []byte(password)); err != nil {
		return ErrInvalidCredentials
	}
	return nil
}

func (u *User) HasPermission(perm UserPermission) bool {
	return u.Permission.Has(PermAdmin) || u.Permission.Has(perm)
}

func (u *User) HasEditPermission(o interface{}) bool {
	switch o := o.(type) {
	case *NodeTop:
		{
			if o.Creator == u.UID {
				return true
			}
			switch o.Type {
			case NodeForm:
				{
					return u.HasPermission(PermEditForm)
				}
			case NodeDocument:
				{
					return u.HasPermission(PermEditDocument)
				}
			}
			return false
		}
	case *NodeVersion:
		{
			if o.Creator == u.UID {
				return true
			}
			nodeTop, err := DatabaseNodeTopFetch(o.UID)
			if err != nil {
				return false
			}
			if nodeTop.Creator == u.UID {
				return true
			}
			switch nodeTop.Type {
			case NodeForm:
				{
					return u.HasPermission(PermEditForm)
				}
			case NodeDocument:
				{
					return u.HasPermission(PermEditDocument)
				}
			}
			return false
		}
	case *Submission:
		{
			if o.Creator == u.UID {
				return true
			}
			return u.HasPermission(PermEditSubmission)
		}
	case *User:
		{
			if u.UID == o.UID {
				return true
			}
			return u.HasPermission(PermEditUser)
		}
	}
	return false
}

func (u *User) HasDeletePermission(o interface{}) bool {
	switch o := o.(type) {
	case *NodeTop:
		{
			if o.Creator == u.UID {
				return true
			}
			switch o.Type {
			case NodeForm:
				{
					return u.HasPermission(PermDeleteForm)
				}
			case NodeDocument:
				{
					return u.HasPermission(PermEdit)
				}
			}
			return false
		}
	case *NodeVersion:
		{
			if o.Creator == u.UID {
				return true
			}
			nodeTop, err := DatabaseNodeTopFetch(o.UID)
			if err != nil {
				return false
			}
			if nodeTop.Creator == u.UID {
				return true
			}
			switch nodeTop.Type {
			case NodeForm:
				{
					return u.HasPermission(PermEditForm)
				}
			case NodeDocument:
				{
					return u.HasPermission(PermEditDocument)
				}
			}
			return false
		}
	case *Submission:
		{
			if o.Creator == u.UID {
				return true
			}
			return u.HasPermission(PermEditSubmission)
		}
	case *User:
		{
			if u.UID == o.UID {
				return true
			}
			return u.HasPermission(PermEditUser)
		}
	}
	return false
}
