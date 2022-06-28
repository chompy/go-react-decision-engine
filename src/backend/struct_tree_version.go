package main

import (
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
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
	RootID   primitive.ObjectID `bson:"root_id" json:"root_id"`
	Created  time.Time          `bson:"created,omitempty" json:"created"`
	Modified time.Time          `bson:"modified,omitempty" json:"modified"`
	Creator  primitive.ObjectID `bson:"creator,omitempty" json:"creator"`
	Modifier primitive.ObjectID `bson:"modifier,omitempty" json:"modifier"`
	Version  int                `bson:"version" json:"version"`
	State    TreeState          `bson:"state" json:"state"`
	Tree     []Node             `bson:"tree" json:"tree"`
}

func FetchTreeVersion(rootId string, version int, user *User) (*TreeVersion, error) {
	// database fetch
	pRootId, err := primitive.ObjectIDFromHex(rootId)
	if err != nil {
		return nil, err
	}
	res, err := databaseFetch(TreeVersion{}, bson.M{"root_id": pRootId, "version": version}, nil)
	if err != nil {
		return nil, err
	}
	treeVersion := res.(*TreeVersion)
	// check permission
	if err := checkFetchPermission(res, user); err != nil {
		return nil, err
	}
	return treeVersion, nil
}

func FetchTreeVersionLatest(rootId string, user *User) (*TreeVersion, error) {
	// database fetch
	pRootId, err := primitive.ObjectIDFromHex(rootId)
	if err != nil {
		return nil, err
	}
	res, err := databaseFetch(TreeVersion{}, bson.M{"root_id": pRootId}, bson.M{"version": -1})
	if err != nil {
		return nil, err
	}
	treeVersion := res.(*TreeVersion)
	// check permission
	if err := checkFetchPermission(res, user); err != nil {
		return nil, err
	}
	return treeVersion, nil
}

func FetchTreeVersionLatestPublished(rootId string, user *User) (*TreeVersion, error) {
	// database fetch
	pRootId, err := primitive.ObjectIDFromHex(rootId)
	if err != nil {
		return nil, err
	}
	res, err := databaseFetch(TreeVersion{}, bson.M{"root_id": pRootId, "state": TreePublished}, bson.M{"version": -1})
	if err != nil {
		return nil, err
	}
	treeVersion := res.(*TreeVersion)
	// check permission
	if err := checkFetchPermission(res, user); err != nil {
		return nil, err
	}
	return treeVersion, nil
}

func ListTreeVersion(rootId string, user *User, offset int) ([]*TreeVersion, int, error) {
	// database fetch
	pRootId, err := primitive.ObjectIDFromHex(rootId)
	if err != nil {
		return nil, 0, err
	}
	res, count, err := databaseList(TreeVersion{}, bson.M{"root_id": pRootId}, bson.M{"created": -1}, nil, offset)
	if err != nil {
		return nil, 0, err
	}
	// check permission
	if len(res) > 0 {
		if err := checkFetchPermission(res[0], user); err != nil {
			return nil, 0, err
		}
	}
	// format output + check permissions
	out := make([]*TreeVersion, 0)
	for _, item := range res {
		out = append(out, item.(*TreeVersion))
	}
	return out, count, nil
}

func (t *TreeVersion) Store(user *User) error {
	// check params
	if t.RootID.IsZero() {
		return ErrObjMissingParam
	}
	// check permission
	if err := checkStorePermission(t, user); err != nil {
		return err
	}
	// update modifier
	t.Modifier = user.ID
	t.Modified = time.Now()
	// new
	if t.Version <= 0 {
		t.Creator = user.ID
		t.Created = t.Modified
		// determine version
		latestVersion, err := FetchTreeVersionLatest(t.RootID.Hex(), user)
		if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
			return err
		}
		t.Version = 1
		if latestVersion != nil {
			t.Version = latestVersion.Version + 1
		}
	}
	return databaseStoreOne(t)
}

// Delete the tree version.
func (t *TreeVersion) Delete(user *User) error {
	if t.RootID.IsZero() || t.Version <= 0 {
		return ErrObjMissingParam
	}
	// check permission
	if err := checkDeletePermission(t, user); err != nil {
		return err
	}
	return databaseDelete(TreeVersion{}, bson.M{"root_id": t.RootID, "version": t.Version})
}
