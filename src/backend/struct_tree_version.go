package main

import (
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/mongo"

	"go.mongodb.org/mongo-driver/bson"
)

// TreeState is the current state of a node version
type TreeState string

const (
	TreeDraft     TreeState = "draft"
	TreePublished TreeState = "published"
	TreeArchived  TreeState = "archived"
)

// TreeVersion is a tree's version and its state.
type TreeVersion struct {
	UID      string    `bson:"uid" json:"uid"`
	Created  time.Time `bson:"created" json:"created"`
	Modified time.Time `bson:"modified" json:"modified"`
	Creator  string    `bson:"creator" json:"creator"`
	Modifier string    `bson:"modifier" json:"modifier"`
	Version  int       `bson:"version" json:"version"`
	State    TreeState `bson:"state" json:"state"`
	Tree     Node      `bson:"tree" json:"tree"`
}

func FetchTreeVersion(uid string, version int, user *User) (*TreeVersion, error) {
	if user == nil {
		return nil, ErrNoUser
	}
	// database fetch
	res, err := databaseFetch(TreeVersion{}, bson.M{"uid": uid, "version": version}, nil)
	if err != nil {
		return nil, err
	}
	treeVersion := res.(*TreeVersion)
	// check if user has access
	if treeVersion.Creator != user.UID {
		if _, err := FetchTreeRoot(uid, user); err != nil {
			return nil, err
		}
	}
	return treeVersion, nil
}

func FetchTreeVersionLatest(uid string, user *User) (*TreeVersion, error) {
	if user == nil {
		return nil, ErrNoUser
	}
	// database fetch
	res, err := databaseFetch(TreeVersion{}, bson.M{"uid": uid}, bson.M{"version": -1})
	if err != nil {
		return nil, err
	}
	treeVersion := res.(*TreeVersion)
	// check if user has access
	if treeVersion.Creator != user.UID {
		if _, err := FetchTreeRoot(uid, user); err != nil {
			return nil, err
		}
	}
	return treeVersion, nil
}

func FetchTreeVersionLatestPublished(uid string, user *User) (*TreeVersion, error) {
	if user == nil {
		return nil, ErrNoUser
	}
	// database fetch
	res, err := databaseFetch(TreeVersion{}, bson.M{"uid": uid, "state": TreePublished}, bson.M{"version": -1})
	if err != nil {
		return nil, err
	}
	treeVersion := res.(*TreeVersion)
	// check if user has access
	if treeVersion.Creator != user.UID {
		if _, err := FetchTreeRoot(uid, user); err != nil {
			return nil, err
		}
	}
	return treeVersion, nil
}

func ListTreeVersion(uid string, user *User, offset int) ([]*TreeVersion, int, error) {
	if user == nil {
		return nil, 0, ErrNoUser
	}
	// database fetch
	res, count, err := databaseList(TreeVersion{}, bson.M{"uid": uid}, bson.M{"created": -1}, nil, offset)
	if err != nil {
		return nil, 0, err
	}
	// format output + check permissions
	hasCreator := false
	out := make([]*TreeVersion, 0)
	for _, item := range res {
		if item.(*TreeVersion).Creator == user.UID {
			hasCreator = true
		}
		out = append(out, item.(*TreeVersion))
	}
	if !hasCreator {
		if _, err := FetchTreeRoot(out[0].UID, user); err != nil {
			return nil, 0, err
		}
	}
	return out, count, nil
}

func (t *TreeVersion) Store(user *User) error {
	if user == nil {
		return ErrNoUser
	}
	if t.UID == "" {
		return ErrObjMissingParam
	}
	// fetch tree root for permission check
	treeRoot, err := FetchTreeRoot(t.UID, user)
	if err != nil {
		return err
	}
	t.Modifier = user.UID
	t.Modified = time.Now()
	// if no version set then assume this will be a new version
	if t.Version <= 0 {
		t.Creator = user.UID
		t.Created = t.Modified
		// check create permission
		if treeRoot.Creator != user.UID && ((treeRoot.Type == TreeForm && !user.HasPermission(PermCreateForm)) || (treeRoot.Type == TreeDocument && !user.HasPermission(PermCreateDocument))) {
			return ErrInvalidPermission
		}
		// determine version
		latestVersion, err := FetchTreeVersionLatest(t.UID, user)
		if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
			return err
		}
		t.Version = 1
		if latestVersion != nil {
			t.Version = latestVersion.Version + 1
		}

	} else if t.Creator != user.UID && ((treeRoot.Type == TreeForm && !user.HasPermission(PermEditForm)) || (treeRoot.Type == TreeDocument && !user.HasPermission(PermEditDocument))) {
		return ErrInvalidPermission
	}
	return databaseStoreOne(t)
}

// Delete the tree version.
func (t TreeVersion) Delete(user *User) error {
	if user == nil {
		return ErrNoUser
	}
	if t.UID == "" || t.Version <= 0 {
		return ErrObjMissingParam
	}
	// fetch tree root for permission check
	treeRoot, err := FetchTreeRoot(t.UID, user)
	if err != nil {
		return err
	}
	// check permission
	if t.Creator != user.UID && ((treeRoot.Type == TreeForm && !user.HasPermission(PermDeleteForm)) || (treeRoot.Type == TreeDocument && !user.HasPermission(PermDeleteDocument))) {
		return ErrInvalidPermission
	}
	return databaseDelete(TreeVersion{}, bson.M{"uid": t.UID})
}
