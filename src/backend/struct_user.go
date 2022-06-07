package main

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	UID        string         `json:"uid"`
	Created    time.Time      `json:"created"`
	Modified   time.Time      `json:"modified"`
	Email      string         `json:"email"`
	Password   []byte         `json:"-"`
	Permission UserPermission `json:"permission"`
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
		Permission: PermGlobalAdmin,
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

func (u *User) FetchTeams() ([]*TeamUser, error) {
	t, _ := FetchTeamByUID("TEAM1")
	t2, _ := FetchTeamByUID("TEAM2")
	out := make([]*TeamUser, 0)
	tu, err := t.FetchUsers()
	if err != nil {
		return nil, err
	}
	out = append(out, tu...)
	tu, err = t2.FetchUsers()
	if err != nil {
		return nil, err
	}
	out = append(out, tu...)
	return out, nil
}

func (u *User) IsOnTeam(uid string) bool {
	return true
}
