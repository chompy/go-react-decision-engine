package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

type FormSubmission struct {
	ID          DatabaseID          `bson:"_id" json:"id"`
	Created     time.Time           `bson:"created,omitempty" json:"created"`
	Modified    time.Time           `bson:"modified,omitempty" json:"modified"`
	Creator     DatabaseID          `bson:"creator,omitempty" json:"creator"`
	Modifier    DatabaseID          `bson:"modifier,omitempty" json:"modifier"`
	FormID      DatabaseID          `bson:"form_id" json:"form_id"`
	FormVersion int                 `bson:"form_version" json:"form_version"`
	Answers     map[string][]string `bson:"answers" json:"answers"`
}

func FetchFormSubmission(id string, user *User) (*FormSubmission, error) {
	if user == nil {
		return nil, ErrNoUser
	}
	// database fetch
	dbId := DatabaseIDFromString(id)
	res, err := databaseFetch(FormSubmission{}, bson.M{"_id": dbId}, nil)
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
func ListFormSubmission(formId string, user *User, offset int) ([]*FormSubmission, int, error) {
	if user == nil {
		return nil, 0, ErrNoUser
	}
	// database fetch
	formDbId := DatabaseIDFromString(formId)
	res, count, err := databaseList(FormSubmission{}, bson.M{"form_id": formDbId}, bson.M{"created": -1}, nil, offset)
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
	if s.FormID.IsEmpty() || s.FormVersion <= 0 {
		return ErrNoData
	}
	if err := checkStorePermission(s, user); err != nil {
		return err
	}
	s.Modifier = user.ID
	s.Modified = time.Now()
	if s.ID.IsEmpty() {
		s.ID = GenerateDatabaseId()
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
