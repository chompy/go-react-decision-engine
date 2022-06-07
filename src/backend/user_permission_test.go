package main

import "testing"

func TestUserPermission(t *testing.T) {
	p := PermGlobalAdmin
	p = p.Add(PermTeamAdmin)
	if !p.Has(PermTeamAdmin) {
		t.Errorf("expected permission to contain 'PermTeamAdmin'")
		return
	}
	p = p.Remove(PermGlobalAdmin)
	if p.Has(PermGlobalAdmin) {
		t.Errorf("expected permission to not contain 'PermGlobalAdmin'")
		return
	}
	p = p.Add(UserPermissionFromName("team_invite"))
	if !p.Has(PermTeamInvite) {
		t.Errorf("expected permission to contain 'PermTeamInvite'")
		return
	}
}
