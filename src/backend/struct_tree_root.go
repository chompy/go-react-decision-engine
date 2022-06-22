package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TreeType is the type of decision tree.
type TreeType string

const (
	TreeForm     TreeType = "form"
	TreeDocument TreeType = "document"
)

// TreeRoot is the container for a decision tree.
type TreeRoot struct {
	ID       primitive.ObjectID `bson:"_id" json:"id"`
	Created  time.Time          `bson:"created,omitempty" json:"created"`
	Modified time.Time          `bson:"modified,omitempty" json:"modified"`
	Creator  primitive.ObjectID `bson:"creator,omitempty" json:"creator"`
	Modifier primitive.ObjectID `bson:"modifier,omitempty" json:"modifier"`
	Type     TreeType           `bson:"type" json:"type"`
	Parent   primitive.ObjectID `bson:"parent" json:"parent"`
	Label    string             `bson:"label" json:"label"`
}

// Fetch a tree root object from the database.
func FetchTreeRoot(id string, user *User) (*TreeRoot, error) {
	if user == nil {
		return nil, ErrNoUser
	}
	// database fetch
	pId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	res, err := databaseFetch(TreeRoot{}, bson.M{"_id": pId}, nil)
	if err != nil {
		return nil, err
	}
	treeRoot := res.(*TreeRoot)
	// check permission
	if err := checkFetchPermission(res, user); err != nil {
		return nil, err
	}
	return treeRoot, nil
}

// List all tree root forms that user's team has access to.
func ListFormRoot(user *User, offset int) ([]*TreeRoot, int, error) {
	if user == nil {
		return nil, 0, ErrNoUser
	}
	// databse fetch
	res, count, err := databaseList(TreeRoot{}, bson.M{"type": string(TreeForm), "parent": user.Team}, bson.M{"created": -1}, nil, offset)
	if err != nil {
		return nil, 0, err
	}
	// check permission
	if err := checkFetchPermission(res[0], user); err != nil {
		return nil, 0, err
	}
	// format output
	out := make([]*TreeRoot, 0)
	for _, item := range res {
		out = append(out, item.(*TreeRoot))
	}
	return out, count, nil
}

// List all documents for given form tree root uid.
func ListDocumentRoot(formRootUid string, user *User, offset int) ([]*TreeRoot, int, error) {
	if user == nil {
		return nil, 0, ErrNoUser
	}
	// database fetch
	pFormRootUid, err := primitive.ObjectIDFromHex(formRootUid)
	if err != nil {
		return nil, 0, err
	}
	res, count, err := databaseList(TreeRoot{}, bson.M{"type": string(TreeDocument), "parent": pFormRootUid}, bson.M{"created": -1}, nil, offset)
	if err != nil {
		return nil, 0, err
	}
	// check permission
	if err := checkFetchPermission(res[0], user); err != nil {
		return nil, 0, err
	}
	// format output + check permission
	out := make([]*TreeRoot, 0)
	hasCreator := false
	for _, item := range res {
		if item.(*TreeRoot).Creator == user.ID {
			hasCreator = true
		}
		out = append(out, item.(*TreeRoot))
	}
	if !hasCreator {
		if _, err := FetchTreeRoot(out[0].Parent.Hex(), user); err != nil {
			return nil, 0, err
		}
	}
	return out, count, nil
}

// Store the tree root.
func (t *TreeRoot) Store(user *User) error {
	if user == nil {
		return ErrNoUser
	}
	// check permission
	if err := checkStorePermission(t, user); err != nil {
		return err
	}
	// update create/modifier
	t.Modifier = user.ID
	t.Modified = time.Now()
	if t.ID.IsZero() {
		t.ID = primitive.NewObjectID()
		t.Creator = user.ID
		t.Created = t.Modified
	}
	return databaseStoreOne(t)
}

// Delete the tree root.
func (t *TreeRoot) Delete(user *User) error {
	if user == nil {
		return ErrNoUser
	}
	if err := checkDeletePermission(t, user); err != nil {
		return err
	}
	return databaseDelete(TreeRoot{}, bson.M{"_id": t.ID})
}
