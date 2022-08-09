package main

import "testing"

func TestUserPermission(t *testing.T) {
	p := UserPermission{}
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
	p = p.Add(PermManageForm)
	if !p.Has(PermManageForm) {
		t.Errorf("expected permission to contain 'PermManageForm'")
		return
	}
}
