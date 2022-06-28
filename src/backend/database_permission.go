package main

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func checkFetchPermission(i interface{}, user *User) error {
	return nil
}

func checkStorePermission(i interface{}, user *User) error {
	// gather parameters
	new := false
	team := primitive.NilObjectID
	creator := primitive.NilObjectID
	perm := PermAdmin
	switch i := i.(type) {
	case *TreeRoot:
		{
			new = i.ID.IsZero()
			creator = i.Creator
			switch i.Type {
			case TreeForm:
				{
					team = i.Parent
					perm = PermEditForm
					if new {
						perm = PermCreateForm
					}
					break
				}
			case TreeDocument:
				{
					treeForm, err := databaseFetch(TreeRoot{}, bson.M{"_id": i.Parent}, nil)
					if err != nil {
						return err
					}
					team = treeForm.(*TreeRoot).Parent
					perm = PermEditDocument
					if new {
						perm = PermCreateDocument
					}
					break
				}
			default:
				{
					if i.Type == "" {
						return ErrObjMissingParam
					}
					return ErrObjInvalidParam
				}
			}
			break
		}
	case *TreeVersion:
		{
			new = i.Version <= 0
			creator = i.Creator
			perm = PermEditForm
			treeRoot, err := databaseFetch(TreeRoot{}, bson.M{"_id": i.RootID}, nil)
			if err != nil {
				return err
			}
			if treeRoot.(*TreeRoot).Type == TreeDocument {
				treeRoot, err = databaseFetch(TreeRoot{}, bson.M{"_id": treeRoot.(*TreeRoot).Parent}, nil)
				if err != nil {
					return err
				}
				perm = PermEditDocument
			}
			team = treeRoot.(*TreeRoot).Parent
			break
		}
	case *FormSubmission:
		{
			new = i.ID.IsZero()
			creator = i.Creator
			perm = PermEditSubmission
			if new {
				perm = PermCreateSubmission
			}
			treeRoot, err := databaseFetch(TreeRoot{}, bson.M{"_id": i.TreeID}, nil)
			if err != nil {
				return err
			}
			team = treeRoot.(*TreeRoot).Parent
			break
		}
	case *User:
		{
			new = i.ID.IsZero()
			team = i.Team
			perm = PermEditUser
			if new {
				perm = PermCreateUser
			}
			break
		}
	case *Team:
		{
			team = i.ID
			creator = i.Creator
			break
		}
	}
	// user should be provided
	if user == nil {
		return ErrNoUser
	}
	// not on same team
	if !team.IsZero() && user.Team != team {
		return ErrInvalidPermission
	}
	// if editting existing and user is original creator then ok
	if !new && !creator.IsZero() && user.ID == creator {
		return nil
	}
	// check if user has required permission
	if !user.HasPermission(perm) {
		return ErrInvalidPermission
	}
	return nil
}

func checkDeletePermission(i interface{}, user *User) error {
	return nil
}
