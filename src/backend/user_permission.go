package main

import (
	"encoding/json"
)

type UserPermission int

const (
	PermNone             UserPermission = 1 << iota
	PermAdmin                           // Full access to everything in team.
	PermCreateUser                      // Create new user for team.
	PermEditUser                        // Edit user on team.
	PermDeleteUser                      // Delete user.
	PermCreateForm                      // Create form.
	PermEditForm                        // Edit existing form.
	PermDeleteForm                      // Delete existing form.
	PermCreateDocument                  // Create document.
	PermEditDocument                    // Edit existing document.
	PermDeleteDocument                  // Delete existing document.
	PermCreateSubmission                // Create a form submission.
	PermEditSubmission                  // Edit existing submission.
	PermDeleteSubmission                // Delete existing submission.
)

var permissionNameMap = map[UserPermission]string{
	PermNone:             "none",
	PermAdmin:            "admin",
	PermCreateUser:       "create_user",
	PermEditUser:         "edit_user",
	PermDeleteUser:       "delete_user",
	PermCreateForm:       "create_form",
	PermEditForm:         "edit_form",
	PermDeleteForm:       "delete_form",
	PermCreateDocument:   "create_document",
	PermEditDocument:     "edit_document",
	PermDeleteDocument:   "delete_document",
	PermCreateSubmission: "create_submission",
	PermEditSubmission:   "edit_submission",
	PermDeleteSubmission: "delete_submission",
}

func (p UserPermission) Add(flag UserPermission) UserPermission {
	return p | flag
}

func (p UserPermission) Remove(flag UserPermission) UserPermission {
	return p &^ flag
}

func (p UserPermission) Has(flag UserPermission) bool {
	return p&flag != 0
}

func (p UserPermission) Name() string {
	return permissionNameMap[p]
}

func (p *UserPermission) MarshalJSON() ([]byte, error) {
	out := make([]string, 0)
	for pmap := range permissionNameMap {
		if p.Has(pmap) {
			out = append(out, pmap.Name())
		}
	}
	return json.Marshal(out)
}

func (p *UserPermission) UnmarshalJSON(data []byte) error {
	*p = PermNone
	permNames := make([]string, 0)
	if err := json.Unmarshal(data, &permNames); err != nil {
		return err
	}
	for _, name := range permNames {
		p.Add(UserPermissionFromName(name))
	}
	return nil
}

func UserPermissionFromName(name string) UserPermission {
	for p, n := range permissionNameMap {
		if name == n {
			return p
		}
	}
	return PermNone
}
