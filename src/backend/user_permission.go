package main

type UserPermission int

const (
	PermGlobalAdmin UserPermission = 1 << iota
	PermTeamAdmin
	PermTeamInvite
	PermTeamCreateForm
	PermTeamEditForm
	PermTeamDeleteForm
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
	}
	return 0
}
