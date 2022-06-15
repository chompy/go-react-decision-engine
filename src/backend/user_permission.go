package main

type UserPermission int

const (
	PermAdmin            UserPermission = 1 << iota // Full access to everything in team.
	PermCreateUser                                  // Create new user for team.
	PermEditUser                                    // Edit user on team.
	PermDeleteUser                                  // Delete user.
	PermCreateForm                                  // Create form.
	PermEditForm                                    // Edit existing form.
	PermDeleteForm                                  // Delete existing form.
	PermCreateDocument                              // Create document.
	PermEditDocument                                // Edit existing document.
	PermDeleteDocument                              // Delete existing document.
	PermCreateSubmission                            // Create a form submission.
	PermEditSubmission                              // Edit existing submission.
	PermDeleteSubmission                            // Delete existing submission.
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
	case PermAdmin:
		{
			return "admin"
		}
	case PermCreateUser:
		{
			return "create_user"
		}
	case PermEditUser:
		{
			return "edit_user"
		}
	case PermDeleteUser:
		{
			return "delete_user"
		}
	case PermCreateForm:
		{
			return "create_form"
		}
	case PermEditForm:
		{
			return "edit_form"
		}
	case PermDeleteForm:
		{
			return "delete_form"
		}
	case PermCreateDocument:
		{
			return "create_document"
		}
	case PermEditDocument:
		{
			return "edit_document"
		}
	case PermDeleteDocument:
		{
			return "delete_document"
		}
	case PermCreateSubmission:
		{
			return "create_submission"
		}
	case PermEditSubmission:
		{
			return "edit_submission"
		}
	case PermDeleteSubmission:
		{
			return "delete_suibmission"
		}
	}
	return ""
}

func UserPermissionFromName(name string) UserPermission {
	switch name {
	case PermAdmin.Name():
		{
			return PermAdmin
		}
	case PermCreateUser.Name():
		{
			return PermCreateUser
		}
	case PermEditUser.Name():
		{
			return PermEditUser
		}
	case PermDeleteUser.Name():
		{
			return PermDeleteUser
		}
	case PermCreateForm.Name():
		{
			return PermCreateForm
		}
	case PermEditForm.Name():
		{
			return PermEditForm
		}
	case PermDeleteForm.Name():
		{
			return PermDeleteForm
		}
	case PermCreateDocument.Name():
		{
			return PermCreateDocument
		}
	case PermEditDocument.Name():
		{
			return PermEditDocument
		}
	case PermDeleteDocument.Name():
		{
			return PermDeleteDocument
		}
	case PermCreateSubmission.Name():
		{
			return PermCreateSubmission
		}
	case PermEditSubmission.Name():
		{
			return PermEditSubmission
		}
	case PermDeleteSubmission.Name():
		{
			return PermDeleteSubmission
		}
	}
	return 0
}
