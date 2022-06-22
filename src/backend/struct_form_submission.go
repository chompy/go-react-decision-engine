package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type FormSubmission struct {
	ID          primitive.ObjectID  `bson:"_id" json:"id"`
	Created     time.Time           `bson:"created,omitempty" json:"created"`
	Modified    time.Time           `bson:"modified,omitempty" json:"modified"`
	Creator     primitive.ObjectID  `bson:"creator,omitempty" json:"creator"`
	Modifier    primitive.ObjectID  `bson:"modifier,omitempty" json:"modifier"`
	TreeID      primitive.ObjectID  `bson:"tree_id" json:"tree_id"`
	TreeVersion int                 `bson:"tree_version" json:"tree_version"`
	Answers     map[string][]string `bson:"answers" json:"answers"`
}

func FetchFormSubmission(id string, user *User) (*FormSubmission, error) {
	if user == nil {
		return nil, ErrNoUser
	}
	// database fetch
	res, err := databaseFetch(FormSubmission{}, bson.M{"_id": id}, nil)
	if err != nil {
		return nil, err
	}
	submission := res.(*FormSubmission)
	// check permission
	if err := checkFetchPermission(res, user); err != nil {
		return nil, err
	}
	return submission, nil
}

// List all form submissions for given tree;
func ListFormSubmission(treeId string, user *User, offset int) ([]*FormSubmission, int, error) {
	if user == nil {
		return nil, 0, ErrNoUser
	}
	// databse fetch
	res, count, err := databaseList(FormSubmission{}, bson.M{"tree_id": treeId}, bson.M{"created": -1}, nil, offset)
	if err != nil {
		return nil, 0, err
	}
	// check permission
	if err := checkFetchPermission(res[0], user); err != nil {
		return nil, 0, err
	}
	// format output
	out := make([]*FormSubmission, 0)
	for _, item := range res {
		out = append(out, item.(*FormSubmission))
	}
	return out, count, nil
}

// Store the form submission.
func (s *FormSubmission) Store(user *User) error {
	if s.TreeID.IsZero() || s.TreeVersion <= 0 {
		return ErrNoData
	}
	if err := checkStorePermission(s, user); err != nil {
		return err
	}
	s.Modifier = user.ID
	s.Modified = time.Now()
	if s.ID.IsZero() {
		s.ID = primitive.NewObjectID()
		s.Creator = user.ID
		s.Created = s.Modified
	}
	return databaseStoreOne(s)
}

// Delete the tree root.
func (s *FormSubmission) Delete(user *User) error {
	if err := checkDeletePermission(s, user); err != nil {
		return err
	}
	return databaseDelete(TreeRoot{}, bson.M{"_id": s.ID})
}
