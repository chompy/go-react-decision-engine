package main

import "testing"

func TestUserPermission(t *testing.T) {
	p := PermAdmin
	p = p.Add(PermAdmin)
	if !p.Has(PermAdmin) {
		t.Errorf("expected permission to contain 'PermAdmin'")
		return
	}
	p = p.Remove(PermAdmin)
	if p.Has(PermAdmin) {
		t.Errorf("expected permission to not contain 'PermAdmin'")
		return
	}
	p = p.Add(UserPermissionFromName("create_form"))
	if !p.Has(PermCreateForm) {
		t.Errorf("expected permission to contain 'PermCreateForm'")
		return
	}
}
