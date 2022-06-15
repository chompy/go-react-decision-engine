package main

type UserPermission int

const (
	PermGlobalAdmin        UserPermission = 1 << iota // Global admin, full access to everything, all teams.
	PermTeamAdmin                                     // Team admin, full access to single team.
	PermTeamInvite                                    // Ability to invite others to a team.
	PermTeamCreateForm                                // Ability to create forms for a team, creator can edit/delete their own forms.
	PermTeamEditForm                                  // Ability to edit all existing forms for a team.
	PermTeamDeleteForm                                // Ability to delete all existing forms for a team.
	PermTeamCreateDocument                            // Ability to create documents for a team.
	PermTeamEditDocument                              // Ability to edit all existing documents for a team.
	PermTeamDeleteDocument                            // Abiltiy to delete all existing documents for a team.
)

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
	switch p {
	case PermGlobalAdmin:
		{
			return "global_admin"
		}
	case PermTeamAdmin:
		{
			return "team_admin"
		}
	case PermTeamInvite:
		{
			return "team_invite"
		}
	case PermTeamCreateForm:
		{
			return "team_create_form"
		}
	case PermTeamEditForm:
		{
			return "team_edit_form"
		}
	case PermTeamDeleteForm:
		{
			return "team_delete_form"
		}
	case PermTeamCreateDocument:
		{
			return "team_create_document"
		}
	case PermTeamEditDocument:
		{
			return "team_edit_document"
		}
	case PermTeamDeleteDocument:
		{
			return "team_delete_document"
		}
	}
	return ""
}

func UserPermissionFromName(name string) UserPermission {
	switch name {
	case PermGlobalAdmin.Name():
		{
			return PermGlobalAdmin
		}
	case PermTeamAdmin.Name():
		{
			return PermTeamAdmin
		}
	case PermTeamInvite.Name():
		{
			return PermTeamInvite
		}
	case PermTeamCreateForm.Name():
		{
			return PermTeamCreateForm
		}
	case PermTeamEditForm.Name():
		{
			return PermTeamEditForm
		}
	case PermTeamDeleteForm.Name():
		{
			return PermTeamDeleteForm
		}
	case PermTeamCreateDocument.Name():
		{
			return PermTeamCreateDocument
		}
	case PermTeamEditDocument.Name():
		{
			return PermTeamEditDocument
		}
	case PermTeamDeleteDocument.Name():
		{
			return PermTeamDeleteDocument
		}
	}
	return 0
}
