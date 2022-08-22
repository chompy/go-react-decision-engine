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
	RootID        DatabaseID      `bson:"root_id" json:"root_id"`
	Created       time.Time       `bson:"created,omitempty" json:"created"`
	Modified      time.Time       `bson:"modified,omitempty" json:"modified"`
	Creator       DatabaseID      `bson:"creator,omitempty" json:"creator"`
	Modifier      DatabaseID      `bson:"modifier,omitempty" json:"modifier"`
	Version       int             `bson:"version" json:"version"`
	State         TreeState       `bson:"state" json:"state"`
	Tree          []Node          `bson:"tree" json:"tree"`
	RuleTemplates []*RuleTemplate `bson:"-" json:"rule_templates"`
}

func FetchTreeVersion(rootId string, version int, user *User) (*TreeVersion, error) {
	// database fetch
	rootDbId := DatabaseIDFromString(rootId)
	res, err := databaseFetch(TreeVersion{}, bson.M{"root_id": rootDbId, "version": version}, nil)
	if err != nil {
		return nil, err
	}
	treeVersion := res.(*TreeVersion)
	// check permission
	if err := checkFetchPermission(res, user); err != nil {
		return nil, err
	}
	// fetch rule templates
	treeVersion.RuleTemplates, err = ListRuleTemplateByID(user, treeVersion.GetRuleTemplateIDs())
	return treeVersion, err
}

func FetchTreeVersionLatest(rootId string, user *User) (*TreeVersion, error) {
	// database fetch
	rootDbId := DatabaseIDFromString(rootId)
	res, err := databaseFetch(TreeVersion{}, bson.M{"root_id": rootDbId}, bson.M{"version": -1})
	if err != nil {
		return nil, err
	}
	treeVersion := res.(*TreeVersion)
	// check permission
	if err := checkFetchPermission(res, user); err != nil {
		return nil, err
	}
	// fetch rule templates
	treeVersion.RuleTemplates, err = ListRuleTemplateByID(user, treeVersion.GetRuleTemplateIDs())
	return treeVersion, err
}

func FetchTreeVersionLatestPublished(rootId string, user *User) (*TreeVersion, error) {
	// database fetch
	rootDbId := DatabaseIDFromString(rootId)
	res, err := databaseFetch(TreeVersion{}, bson.M{"root_id": rootDbId, "state": TreePublished}, bson.M{"version": -1})
	if err != nil {
		return nil, err
	}
	treeVersion := res.(*TreeVersion)
	// check permission
	if err := checkFetchPermission(res, user); err != nil {
		return nil, err
	}
	// fetch rule templates
	treeVersion.RuleTemplates, err = ListRuleTemplateByID(user, treeVersion.GetRuleTemplateIDs())
	return treeVersion, err
}

func ListTreeVersion(rootId string, user *User, offset int) ([]*TreeVersion, int, error) {
	// database fetch
	rootDbId := DatabaseIDFromString(rootId)
	res, count, err := databaseList(
		TreeVersion{},
		bson.M{"root_id": rootDbId},
		bson.M{"created": -1},
		bson.M{"tree": 0},
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
	// format output + check permissions
	out := make([]*TreeVersion, 0)
	for _, item := range res {
		out = append(out, item.(*TreeVersion))
	}
	return out, count, nil
}

func (t *TreeVersion) Store(user *User) error {
	// check params
	if t.RootID.IsEmpty() {
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
		latestVersion, err := FetchTreeVersionLatest(t.RootID.String(), user)
		if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
			return err
		}
		t.Version = 1
		if latestVersion != nil {
			t.Version = latestVersion.Version + 1
		}
	} else if t.Version > 0 {
		// check if not already existing
		existingVersion, err := FetchTreeVersion(t.RootID.String(), t.Version, user)
		if err != nil {
			if !errors.Is(err, mongo.ErrNoDocuments) {
				return err
			}
			t.Created = t.Modified
			t.Creator = user.ID
		} else {
			t.Created = existingVersion.Created
			t.Creator = existingVersion.Creator
		}
	}

	return databaseStoreOne(t)
}

// Delete the tree version.
func (t *TreeVersion) Delete(user *User) error {
	if t.RootID.IsEmpty() || t.Version <= 0 {
		return ErrObjMissingParam
	}
	// check permission
	if err := checkDeletePermission(t, user); err != nil {
		return err
	}
	// ensure this isn't the only version
	count, err := databaseCount(TreeVersion{}, bson.M{"root_id": t.RootID})
	if err != nil {
		return err
	}
	if count <= 1 {
		return ErrCannotDeleteOnlyVersion
	}
	return databaseDelete(TreeVersion{}, bson.M{"root_id": t.RootID, "version": t.Version})
}

// Publish the tree version, archive any previously published versions.
func (t *TreeVersion) Publish(user *User) error {
	if t.RootID.IsEmpty() || t.Version <= 0 {
		return ErrObjMissingParam
	}
	if err := checkStorePermission(t, user); err != nil {
		return err
	}
	currentPublished, err := FetchTreeVersionLatestPublished(t.RootID.String(), user)
	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		return err
	}
	now := time.Now()
	if currentPublished != nil {
		currentPublished.Modified = now
		currentPublished.Modifier = user.ID
		currentPublished.State = TreeArchived
		if err := currentPublished.Store(user); err != nil {
			return err
		}
	}
	t.State = TreePublished
	t.Modified = now
	t.Modifier = user.ID
	if err := t.Store(user); err != nil {
		return err
	}
	return nil
}

// GetRuleTemplateUIDs retrieves the rule template ids.
func (t *TreeVersion) GetRuleTemplateIDs() []string {
	out := make([]string, 0)
	for _, n := range t.Tree {
		if n.Type == "rule" {
			templateId := n.Data["template"]
			if templateId != nil {
				hasTemplateId := false
				for i := range out {
					if hasTemplateId = out[i] == templateId; hasTemplateId {
						break
					}
				}
				if !hasTemplateId {
					out = append(out, templateId.(string))
				}
			}
		}
	}
	return out
}
