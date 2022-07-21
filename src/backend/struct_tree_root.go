package main

import (
	"time"

	"go.mongodb.org/mongo-driver/mongo"

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
	ID       DatabaseID `bson:"_id" json:"id"`
	Created  time.Time  `bson:"created,omitempty" json:"created"`
	Modified time.Time  `bson:"modified,omitempty" json:"modified"`
	Creator  DatabaseID `bson:"creator,omitempty" json:"creator"`
	Modifier DatabaseID `bson:"modifier,omitempty" json:"modifier"`
	Type     TreeType   `bson:"type" json:"type"`
	Parent   DatabaseID `bson:"parent" json:"parent"`
	Label    string     `bson:"label" json:"label"`
}

// Fetch a tree root object from the database.
func FetchTreeRoot(id string, user *User) (*TreeRoot, error) {
	if user == nil {
		return nil, ErrNoUser
	}
	// database fetch
	dbId := DatabaseIDFromString(id)
	res, err := databaseFetch(TreeRoot{}, bson.M{"_id": dbId}, nil)
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

func listRoot(filter bson.M, user *User, offset int) ([]*TreeRoot, int, error) {
	if user == nil {
		return nil, 0, ErrNoUser
	}
	// databse fetch
	res, count, err := databaseList(TreeRoot{}, filter, bson.M{"created": -1}, nil, offset)
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
	out := make([]*TreeRoot, 0)
	for _, item := range res {
		out = append(out, item.(*TreeRoot))
	}
	return out, count, nil
}

// List all tree root forms that user's team has access to.
func ListFormRoot(user *User, offset int) ([]*TreeRoot, int, error) {
	return listRoot(
		bson.M{"type": string(TreeForm), "parent": user.Team},
		user,
		offset,
	)
}

// List all documents for given form tree root uid.
func ListDocumentRoot(formRootUid string, user *User, offset int) ([]*TreeRoot, int, error) {
	pFormRootUid := DatabaseIDFromString(formRootUid)
	return listRoot(
		bson.M{"type": string(TreeDocument), "parent": pFormRootUid},
		user,
		offset,
	)
}

func listPublishedRoot(filter bson.M, user *User, offset int) ([]*TreeRoot, int, error) {
	if user == nil {
		return nil, 0, ErrNoUser
	}
	res, count, err := databaseListAggregate(
		TreeRoot{},
		mongo.Pipeline{
			bson.D{bson.E{Key: "$match", Value: filter}},
			bson.D{bson.E{Key: "$lookup", Value: bson.M{
				"from": getDatabaseCollectionNameFromData(TreeVersion{}),
				"let":  bson.M{"root_id": "$_id"},
				"pipeline": bson.A{
					bson.M{
						"$match": bson.M{
							"$expr": bson.M{
								"$and": bson.A{
									bson.M{"$eq": bson.A{"$root_id", "$$root_id"}},
									bson.M{"$eq": bson.A{"$state", TreePublished}},
								},
							},
						},
					},
				},
				"as": "published_version",
			}}},
			bson.D{bson.E{Key: "$match", Value: bson.M{
				"published_version": bson.M{
					"$exists": true,
					"$size":   1,
				},
			}}},
			bson.D{bson.E{Key: "$project", Value: bson.M{
				"published_version": 0,
			}}},
			bson.D{bson.E{Key: "$sort", Value: bson.M{
				"created": -1,
			}}},
		},
		offset,
	)
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
	out := make([]*TreeRoot, 0)
	for _, item := range res {
		out = append(out, item.(*TreeRoot))
	}
	return out, count, nil
}

// List all form that contain published version.
func ListPublishedFormRoot(user *User, offset int) ([]*TreeRoot, int, error) {
	return listPublishedRoot(
		bson.M{"type": string(TreeForm), "parent": user.Team},
		user,
		offset,
	)
}

// List all documents that contain published version for given form tree root uid.
func ListPublishedDocumentRoot(formRootUid string, user *User, offset int) ([]*TreeRoot, int, error) {
	pFormRootUid := DatabaseIDFromString(formRootUid)
	return listPublishedRoot(
		bson.M{"type": string(TreeDocument), "parent": pFormRootUid},
		user,
		offset,
	)
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
	isNew := false
	if t.ID.IsEmpty() {
		isNew = true
		t.ID = GenerateDatabaseId()
		t.Creator = user.ID
		t.Created = t.Modified
	}
	if err := databaseStoreOne(t); err != nil {
		return err
	}
	// create first version if new tree
	if isNew && !t.ID.IsEmpty() {
		v := TreeVersion{
			RootID:   t.ID,
			State:    TreeDraft,
			Version:  1,
			Creator:  user.ID,
			Modifier: user.ID,
			Created:  time.Now(),
			Modified: time.Now(),
		}
		if err := v.Store(user); err != nil {
			return err
		}
	}
	return nil
}

// Delete the tree root.
func (t *TreeRoot) Delete(user *User) error {
	if user == nil {
		return ErrNoUser
	}
	if err := checkDeletePermission(t, user); err != nil {
		return err
	}
	// delete tree versions
	if err := databaseDelete(TreeVersion{}, bson.M{"root_id": t.ID}); err != nil {
		return err
	}
	if t.Type == TreeForm {
		// delete form submissions
		if err := databaseDelete(FormSubmission{}, bson.M{"form_id": t.ID}); err != nil {
			return err
		}
		// delete documents
		for {
			res, count, err := databaseList(TreeRoot{}, bson.M{"parent": t.ID, "type": TreeDocument}, nil, nil, 0)
			if count == 0 {
				break
			}
			if err != nil {
				return err
			}
			for _, doc := range res {
				if err := doc.(*TreeRoot).Delete(user); err != nil {
					return err
				}
			}
		}
	}
	return databaseDelete(TreeRoot{}, bson.M{"_id": t.ID})
}
