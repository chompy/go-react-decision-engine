package main

type UserPermission []string

const (
	PermAdmin              = "admin"                // Full access to everything in team.
	PermManageUser         = "manage_user"          // Create/Edit/Delete users on team.
	PermManageForm         = "manage_form"          // Create/Edit/Delete forms.
	PermManageDocument     = "manage_document"      // Create/Edit/Delete documents.
	PermManageSubmission   = "manage_submission"    // Create/Edit/Delete submissions.
	PermManageRuleTemplate = "manage_rule_template" // Create/Edit/Delete rule templates.
)

func (p UserPermission) Add(flag string) UserPermission {
	return append(p, flag)
}

func (p UserPermission) Remove(flag string) UserPermission {
	out := make(UserPermission, 0)
	for _, ef := range p {
		if ef != flag {
			out = append(out, ef)
		}
	}
	return out
}

func (p UserPermission) Has(flag string) bool {
	for _, ef := range p {
		if ef == flag {
			return true
		}
	}
	return false
}
