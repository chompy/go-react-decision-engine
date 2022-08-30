package main

import (
	"go.mongodb.org/mongo-driver/bson"
)

func checkFetchPermission(i interface{}, user *User) error {
	switch i := i.(type) {
	case *TreeRoot:
		{
			team := i.Parent
			if i.Type == TreeDocument {
				treeForm, err := databaseFetch(TreeRoot{}, bson.M{"_id": i.Parent}, nil)
				if err != nil {
					return err
				}
				team = treeForm.(*TreeRoot).Parent
			}
			if user == nil || user.Team.String() != team.String() {
				return ErrInvalidPermission
			}
		}
	case *TreeVersion:
		{
			treeRoot, err := databaseFetch(TreeRoot{}, bson.M{"_id": i.RootID}, nil)
			if err != nil {
				return err
			}
			if treeRoot.(*TreeRoot).Type == TreeDocument {
				treeRoot, err = databaseFetch(TreeRoot{}, bson.M{"_id": treeRoot.(*TreeRoot).Parent}, nil)
				if err != nil {
					return err
				}
			}
			if user == nil || user.Team.String() != treeRoot.(*TreeRoot).Parent.String() {
				return ErrInvalidPermission
			}
			break
		}
	case *User:
		{
			if user == nil || user.Team.String() != i.Team.String() {
				return ErrInvalidPermission
			}
			break
		}
	case *Team:
		{
			if user == nil || user.Team.String() != i.ID.String() {
				return ErrInvalidPermission
			}
			break
		}
	case *RuleTemplate:
		{
			if user == nil || user.Team.String() != i.Team.String() {
				return ErrInvalidPermission
			}
		}
	case *FormSubmission:
		{
			if user == nil {
				return ErrInvalidPermission
			}
			if user.ID.String() == i.Creator.String() {
				return nil
			}
			treeRoot, err := databaseFetch(TreeRoot{}, bson.M{"_id": i.FormID}, nil)
			if err != nil {
				return err
			}
			if user.Team.String() != treeRoot.(*TreeRoot).Parent.String() {
				return ErrInvalidPermission
			}
		}
	}
	return nil
}

func checkStorePermission(i interface{}, user *User) error {
	// gather parameters
	new := false
	team := DatabaseID{}
	creator := DatabaseID{}
	perm := PermAdmin
	switch i := i.(type) {
	case *TreeRoot:
		{
			new = i.ID.IsEmpty()
			creator = i.Creator
			switch i.Type {
			case TreeForm:
				{
					team = i.Parent
					perm = PermManageForm
					break
				}
			case TreeDocument:
				{
					treeForm, err := databaseFetch(TreeRoot{}, bson.M{"_id": i.Parent}, nil)
					if err != nil {
						return err
					}
					team = treeForm.(*TreeRoot).Parent
					perm = PermManageDocument
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
			perm = PermManageForm
			treeRoot, err := databaseFetch(TreeRoot{}, bson.M{"_id": i.RootID}, nil)
			if err != nil {
				return err
			}
			if treeRoot.(*TreeRoot).Type == TreeDocument {
				treeRoot, err = databaseFetch(TreeRoot{}, bson.M{"_id": treeRoot.(*TreeRoot).Parent}, nil)
				if err != nil {
					return err
				}
				perm = PermManageDocument
			}
			team = treeRoot.(*TreeRoot).Parent
			break
		}
	case *FormSubmission:
		{
			new = i.ID.IsEmpty()
			if new {
				return nil
			}
			creator = i.Creator
			perm = PermManageSubmission
			treeRoot, err := databaseFetch(TreeRoot{}, bson.M{"_id": i.FormID}, nil)
			if err != nil {
				return err
			}
			team = treeRoot.(*TreeRoot).Parent
			break
		}
	case *User:
		{
			new = i.ID.IsEmpty()
			team = i.Team
			perm = PermManageUser
			// same user can edit their profile
			if !new && user != nil && i.ID == user.ID {
				return nil
			}
			// allow self creation
			if new && user == nil && !team.IsEmpty() {
				// TeamOptionAllowSignUp
				/*team, err := FetchTeamByID(team.String(), nil)
				if err != nil {
					return err
				}*/

				i.Permission = UserPermission{}
				return nil
				//}
			}
			break
		}
	case *Team:
		{
			team = i.ID
			creator = i.Creator
			break
		}
	case *RuleTemplate:
		{
			team = i.Team
			creator = i.Creator
			perm = PermManageRuleTemplate
		}
	}
	// user should be provided
	if user == nil {
		return ErrNoUser
	}
	// not on same team
	if !team.IsEmpty() && user.Team.String() != team.String() {
		return ErrInvalidPermission
	}
	// if editting existing and user is original creator then ok
	if !new && !creator.IsEmpty() && user.ID.String() == creator.String() {
		return nil
	}
	// check if user has required permission
	if !user.HasPermission(perm) {
		return ErrInvalidPermission
	}
	return nil
}

func checkDeletePermission(i interface{}, user *User) error {
	return checkStorePermission(i, user)
}
