package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID         DatabaseID     `bson:"_id" json:"id"`
	Created    time.Time      `bson:"created,omitempty" json:"created"`
	Modified   time.Time      `bson:"modified,omitempty" json:"modified"`
	Creator    DatabaseID     `bson:"creator,omitempty" json:"creator"`
	Modifier   DatabaseID     `bson:"modifier,omitempty" json:"modifier"`
	Email      string         `bson:"email" json:"email"`
	Password   []byte         `bson:"password,omitempty" json:"-"`
	Team       DatabaseID     `bson:"team,omitempty" json:"team"`
	Permission UserPermission `bson:"permission" json:"permission"`
}

func FetchUserByID(id string) (*User, error) {
	dbId := DatabaseIDFromString(id)
	res, err := databaseFetch(User{}, bson.M{"_id": dbId}, nil)
	if err != nil {
		return nil, err
	}
	user := res.(*User)
	return user, nil
}

func FetchUserByTeamEmail(team string, email string) (*User, error) {
	dbTeam := DatabaseIDFromString(team)
	res, err := databaseFetch(User{}, bson.M{"team": dbTeam, "email": email}, nil)
	if err != nil {
		return nil, err
	}
	user := res.(*User)
	return user, nil
}

func ListUserTeam(user *User, offset int) ([]*User, int, error) {
	if user == nil {
		return nil, 0, ErrNoUser
	}
	// databse fetch
	res, count, err := databaseList(User{}, bson.M{"team": user.Team}, bson.M{"created": -1}, nil, offset)
	if err != nil {
		return nil, 0, err
	}
	// check permission
	if len(res) > 0 {
		if err := checkFetchPermission(res[0], user); err != nil {
			return nil, 0, err
		}
	}
	// format output
	out := make([]*User, 0)
	for _, item := range res {
		out = append(out, item.(*User))
	}
	return out, count, nil
}

func HashPassword(password string) ([]byte, error) {
	hashedPw, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	return hashedPw, nil
}

func (u *User) Store(editor *User) error {
	if err := checkStorePermission(u, editor); err != nil {
		return err
	}
	u.Modified = time.Now()
	u.Modifier = DatabaseID{}
	if editor != nil {
		u.Modifier = editor.ID
		u.Team = editor.Team
	}
	if u.ID.IsEmpty() {
		u.ID = GenerateDatabaseId()
		u.Created = u.Modified
		if editor != nil {
			u.Creator = editor.ID
		}
	}
	/*if u.Creator.IsEmpty() {
		prevUser, err := FetchUserByID(u.ID.String())
		if err != nil {
			return err
		}
		u.Creator = prevUser.Creator
		u.Created = prevUser.Created
	}*/
	return databaseStoreOne(u)
}

func (u *User) Delete(editor *User) error {
	if u.ID.IsEmpty() {
		return ErrObjMissingParam
	}
	// check permission
	if err := checkDeletePermission(u, editor); err != nil {
		return err
	}
	return databaseDelete(User{}, bson.M{"_id": u.ID})
}

func (u User) CheckPassword(password string) error {
	if err := bcrypt.CompareHashAndPassword(u.Password, []byte(password)); err != nil {
		return ErrInvalidCredentials
	}
	return nil
}

func (u User) HasPermission(perm string) bool {
	return u.Permission.Has(PermAdmin) || u.Permission.Has(perm)
}
