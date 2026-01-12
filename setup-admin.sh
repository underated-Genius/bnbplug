#!/bin/bash
echo "Setting up BnBPlug admin account..."

# Ask for admin email
read -p "Enter admin email (will have full access): " admin_email
read -sp "Enter admin password: " admin_password
echo

# Load existing users
users=$(cat ~/bnbplug/users.json 2>/dev/null || echo '[]')
users=$(echo "$users" | jq --arg email "$admin_email" --arg password "$(echo -n "$admin_password" | base64)" --arg id "admin_$(date +%s)" '
.[length] |= . + {
  id: $id,
  name: "Administrator",
  email: $email,
  phone: "0700 000 000",
  password: $password,
  type: "guest",
  isAdmin: true,
  avatar: "https://ui-avatars.com/api/?name=Admin&background=ff6b6b&color=fff",
  joined: "'$(date -Iseconds)'",
  status: "active"
}')

# Save users
echo "$users" > ~/bnbplug/users.json
echo "✅ Admin account created: $admin_email"
echo "⚠️  Keep these credentials secure!"
