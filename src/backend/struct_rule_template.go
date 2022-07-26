package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

type RuleTemplate struct {
	ID       DatabaseID `bson:"_id" json:"id"`
	Created  time.Time  `bson:"created,omitempty" json:"created,omitempty"`
	Modified time.Time  `bson:"modified,omitempty" json:"modified,omitempty"`
	Creator  DatabaseID `bson:"creator,omitempty" json:"creator,omitempty"`
	Modifier DatabaseID `bson:"modifier,omitempty" json:"modifier,omitempty"`
	Team     DatabaseID `bson:"team,omitempty" json:"team,omitempty"`
	Label    string     `bson:"label,omitempty" json:"label,omitempty"`
	Script   string     `bson:"script,omitempty" json:"script,omitempty"`
}

// Fetch a rule template object from the database.
func FetchRuleTemplate(id string, user *User) (*RuleTemplate, error) {
	if user == nil {
		return nil, ErrNoUser
	}
	// database fetch
	dbId := DatabaseIDFromString(id)
	res, err := databaseFetch(RuleTemplate{}, bson.M{"_id": dbId}, nil)
	if err != nil {
		return nil, err
	}
	ruleTempl := res.(*RuleTemplate)
	// check permission
	if err := checkFetchPermission(res, user); err != nil {
		return nil, err
	}
	return ruleTempl, nil
}

// List all rule templates that user's team has access to.
func ListRuleTemplate(user *User, offset int) ([]*RuleTemplate, int, error) {
	if user == nil {
		return nil, 0, ErrNoUser
	}
	// databse fetch
	res, count, err := databaseList(RuleTemplate{}, bson.M{"team": user.Team}, bson.M{"created": -1}, nil, offset)
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
	out := make([]*RuleTemplate, 0)
	for _, item := range res {
		out = append(out, item.(*RuleTemplate))
	}
	return out, count, nil
}

// List all rule templates that user's team has access to.
func ListAllRuleTemplate(user *User) ([]*RuleTemplate, error) {
	if user == nil {
		return nil, ErrNoUser
	}
	// databse fetch
	res, err := databaseListAll(
		RuleTemplate{},
		bson.M{"team": user.Team},
		bson.M{"created": -1},
		bson.M{"label": 1},
	)
	if err != nil {
		return nil, err
	}
	// check permission
	if len(res) > 0 {
		if err := checkFetchPermission(res[0], user); err != nil {
			return nil, err
		}
	}
	// format output
	out := make([]*RuleTemplate, 0)
	for _, item := range res {
		out = append(out, item.(*RuleTemplate))
	}
	return out, nil
}

func ListRuleTemplateByID(user *User, ids []string) ([]*RuleTemplate, error) {
	if user == nil {
		return nil, ErrNoUser
	}
	if ids == nil {
		return []*RuleTemplate{}, nil
	}
	// convert id list
	dbIDs := make(bson.A, 0)
	for _, id := range ids {
		dbIDs = append(dbIDs, DatabaseIDFromString(id))
	}
	// databse fetch
	res, err := databaseListAll(
		RuleTemplate{},
		bson.M{"team": user.Team, "_id": bson.M{"$in": dbIDs}},
		bson.M{"created": -1},
		nil,
	)
	if err != nil {
		return nil, err
	}
	// check permission
	if len(res) > 0 {
		if err := checkFetchPermission(res[0], user); err != nil {
			return nil, err
		}
	}
	// format output
	out := make([]*RuleTemplate, 0)
	for _, item := range res {
		out = append(out, item.(*RuleTemplate))
	}
	return out, nil
}

// Store the rule template.
func (t *RuleTemplate) Store(user *User) error {
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
	if t.ID.IsEmpty() {
		t.ID = GenerateDatabaseId()
		t.Creator = user.ID
		t.Created = t.Modified
	}
	if err := databaseStoreOne(t); err != nil {
		return err
	}
	return nil
}

// Delete the rule template.
func (t *RuleTemplate) Delete(user *User) error {
	if user == nil {
		return ErrNoUser
	}
	if err := checkDeletePermission(t, user); err != nil {
		return err
	}
	return databaseDelete(RuleTemplate{}, bson.M{"_id": t.ID})
}
