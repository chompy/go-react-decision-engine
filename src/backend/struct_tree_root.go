package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

// TreeType is the type of decision tree.
type TreeType string

const (
	TreeForm     TreeType = "form"
	TreeDocument TreeType = "document"
)

// TreeRoot is the container for a decision tree.
type TreeRoot struct {
	UID      string    `bson:"uid" json:"uid"`
	Created  time.Time `bson:"created" json:"created"`
	Modified time.Time `bson:"modified" json:"modified"`
	Creator  string    `bson:"creator" json:"creator"`
	Modifier string    `bson:"modifier" json:"modifier"`
	Type     TreeType  `bson:"type" json:"type"`
	Parent   string    `bson:"parent" json:"parent"`
	Label    string    `bson:"label" json:"label"`
}

// Fetch a tree root object from the database.
func FetchTreeRoot(uid string, user *User) (*TreeRoot, error) {
	if user == nil {
		return nil, ErrNoUser
	}
	// database fetch
	res, err := databaseFetch(TreeRoot{}, bson.M{"uid": uid}, nil)
	if err != nil {
		return nil, err
	}
	treeRoot := res.(*TreeRoot)
	// check permission
	switch treeRoot.Type {
	case TreeForm:
		{
			if treeRoot.Parent != user.Team {
				return nil, ErrInvalidPermission
			}
			break
		}
	case TreeDocument:
		{
			formRes, err := databaseFetch(TreeRoot{}, bson.M{"uid": treeRoot.Parent}, nil)
			if err != nil {
				return nil, err
			}
			formRoot := formRes.(*TreeRoot)
			if formRoot.Parent != user.Team {
				return nil, ErrInvalidPermission
			}
			break
		}
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
	res, count, err := databaseList(TreeRoot{}, bson.M{"type": string(TreeDocument), "parent": formRootUid}, bson.M{"created": -1}, nil, offset)
	if err != nil {
		return nil, 0, err
	}
	// format output + check permission
	out := make([]*TreeRoot, 0)
	hasCreator := false
	for _, item := range res {
		if item.(*TreeRoot).Creator == user.UID {
			hasCreator = true
		}
		out = append(out, item.(*TreeRoot))
	}
	if !hasCreator {
		if _, err := FetchTreeRoot(out[0].Parent, user); err != nil {
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
	t.Parent = user.Team
	t.Modifier = user.UID
	t.Modified = time.Now()
	if t.UID == "" {
		t.UID = generateUID()
		t.Creator = user.UID
		t.Created = t.Modified
		if (t.Type == TreeForm && !user.HasPermission(PermCreateForm)) || (t.Type == TreeDocument && !user.HasPermission(PermCreateDocument)) {
			return ErrInvalidPermission
		}
	} else if t.Creator != user.UID && ((t.Type == TreeForm && !user.HasPermission(PermEditForm)) || (t.Type == TreeDocument && !user.HasPermission(PermEditDocument))) {
		return ErrInvalidPermission
	}
	return databaseStoreOne(t)
}

// Delete the tree root.
func (t TreeRoot) Delete(user *User) error {
	if user == nil {
		return ErrNoUser
	}
	if t.Creator != user.UID && ((t.Type == TreeForm && !user.HasPermission(PermDeleteForm)) || (t.Type == TreeDocument && !user.HasPermission(PermDeleteDocument))) {
		return ErrInvalidPermission
	}
	return databaseDelete(TreeRoot{}, bson.M{"uid": t.UID})
}
