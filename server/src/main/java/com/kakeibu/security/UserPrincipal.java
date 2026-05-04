package com.kakeibu.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserPrincipal implements UserDetails {

    private final String userId;
    private final boolean isAnonymous;

    public UserPrincipal(String userId, boolean isAnonymous) {
        this.userId = userId;
        this.isAnonymous = isAnonymous;
    }

    public String getUserId() {
        return userId;
    }

    public boolean isAnonymous() {
        return isAnonymous;
    }

    @Override public String getUsername() { return userId; }
    @Override public String getPassword() { return null; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
